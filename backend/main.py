from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
from openai import OpenAI
import os
import logging
from dotenv import load_dotenv
import io

# Настраиваем логирование
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()

# CORS настройки
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://mood-track-orpin.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Проверяем наличие API ключа
if not os.getenv("OPENAI_API_KEY"):
    logger.error("OPENAI_API_KEY not found in environment variables")
    raise ValueError("OPENAI_API_KEY environment variable is not set")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class TextAnalysisRequest(BaseModel):
    text: str

class TextAnalysisResponse(BaseModel):
    tags: List[str]

@app.get("/")
async def root():
    logger.info("Root endpoint called")
    return {"message": "Backend is running"}

@app.get("/api/health")
async def health_check():
    logger.info("Health check endpoint called")
    return {"status": "ok"}

@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        logger.info(f"[TRANSCRIBE] Начало обработки файла: {file.filename}")
        logger.info(f"[TRANSCRIBE] Метаданные файла: размер={file.size}, тип={file.content_type}")
        
        content = await file.read()
        logger.info(f"[TRANSCRIBE] Прочитано {len(content)} байт")

        # Используем BytesIO вместо временного файла
        audio_bytes = io.BytesIO(content)
        audio_bytes.name = "audio.webm"  # OpenAI API требует имя файла
        logger.info("[TRANSCRIBE] Создан BytesIO объект")

        try:
            logger.info("[TRANSCRIBE] Начинаем запрос к OpenAI API")
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_bytes,
                response_format="text"
            )
            logger.info(f"[TRANSCRIBE] Получен ответ от OpenAI API: {transcript[:100]}...")
        except Exception as openai_error:
            logger.error(f"[TRANSCRIBE] Ошибка OpenAI API: {str(openai_error)}")
            raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(openai_error)}")

        return JSONResponse(content={"text": transcript})
    except Exception as e:
        logger.error(f"[TRANSCRIBE] Ошибка при транскрипции: {str(e)}")
        logger.error(f"[TRANSCRIBE] Тип ошибки: {type(e).__name__}")
        import traceback
        logger.error(f"[TRANSCRIBE] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze", response_model=TextAnalysisResponse)
async def analyze_text(request: TextAnalysisRequest):
    try:
        logger.info(f"[ANALYZE] Получен текст для анализа длиной {len(request.text)} символов")
        logger.info(f"[ANALYZE] Начало текста: {request.text[:100]}...")
        
        try:
            logger.info("[ANALYZE] Отправка запроса к OpenAI API")
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a mood analysis expert. When analyzing text, return ONLY a JSON array of mood tags.
                            Available tags are:
                            Emotions: ["happy", "excited", "calm", "anxious", "sad", "angry"]
                            Activity: ["work_activity", "exercise", "social", "rest"]
                            Contexts: ["home", "work_location", "outside"]
                            Example response: ["happy", "social", "home"]"""
                    },
                    {
                        "role": "user",
                        "content": request.text
                    }
                ],
                temperature=0.7,
                max_tokens=100
            )
            logger.info(f"[ANALYZE] Получен ответ от OpenAI API: {response}")
        except Exception as openai_error:
            logger.error(f"[ANALYZE] Ошибка OpenAI API: {str(openai_error)}")
            raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(openai_error)}")
        
        response_text = response.choices[0].message.content.strip()
        logger.info(f"[ANALYZE] Текст ответа: {response_text}")
        
        try:
            import json
            tags = json.loads(response_text)
            logger.info(f"[ANALYZE] Распознанные теги: {tags}")
            
            valid_tags = [
                "happy", "excited", "calm", "anxious", "sad", "angry",
                "work_activity", "exercise", "social", "rest",
                "home", "work_location", "outside"
            ]
            tags = [tag for tag in tags if tag in valid_tags]
            logger.info(f"[ANALYZE] Отфильтрованные теги: {tags}")
            
            return TextAnalysisResponse(tags=tags)
        except json.JSONDecodeError as e:
            logger.error(f"[ANALYZE] Ошибка парсинга JSON: {e}")
            logger.error(f"[ANALYZE] Проблемный текст: {response_text}")
            raise HTTPException(status_code=500, detail="Failed to parse mood tags")
            
    except Exception as e:
        logger.error(f"[ANALYZE] Ошибка в analyze_text: {str(e)}")
        logger.error(f"[ANALYZE] Тип ошибки: {type(e).__name__}")
        import traceback
        logger.error(f"[ANALYZE] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting backend server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")