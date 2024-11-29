from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
from openai import OpenAI
import os
import logging
from dotenv import load_dotenv
import tempfile

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
    temp_file_path = None
    try:
        logger.info(f"Получен файл для транскрипции: {file.filename}")
        content = await file.read()

        # Создание временного файла
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name

        # Открытие временного файла для чтения
        with open(temp_file_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )

        logger.info(f"Результат транскрипции: {transcript}")
        return JSONResponse(content={"text": transcript})
    except Exception as e:
        logger.error(f"Ошибка при транскрипции: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Удаление временного файла, если он был создан
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.post("/api/analyze", response_model=TextAnalysisResponse)
async def analyze_text(request: TextAnalysisRequest):
    try:
        if not request.text or len(request.text.strip()) == 0:
            logger.warning("Empty text received for analysis")
            return TextAnalysisResponse(tags=[])

        logger.info(f"Received text for analysis: {request.text[:100]}...")  # Логируем только первые 100 символов
        
        try:
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
            
            # Получаем текст ответа
            response_text = response.choices[0].message.content.strip()
            logger.info(f"Raw response text: {response_text}")
            
            # Пытаемся преобразовать текст в список
            import json
            try:
                tags = json.loads(response_text)
                if not isinstance(tags, list):
                    logger.error(f"Invalid response format (not a list): {response_text}")
                    return TextAnalysisResponse(tags=[])
                
                # Проверяем, что все теги валидные
                valid_tags = [
                    "happy", "excited", "calm", "anxious", "sad", "angry",
                    "work_activity", "exercise", "social", "rest",
                    "home", "work_location", "outside"
                ]
                valid_tags_set = set(valid_tags)
                filtered_tags = [tag for tag in tags if tag in valid_tags_set]
                
                if not filtered_tags:
                    logger.warning(f"No valid tags found in response: {tags}")
                    return TextAnalysisResponse(tags=[])
                
                logger.info(f"Returning valid tags: {filtered_tags}")
                return TextAnalysisResponse(tags=filtered_tags)
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse OpenAI response as JSON: {e}")
                return TextAnalysisResponse(tags=[])
                
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            return TextAnalysisResponse(tags=[])
            
    except Exception as e:
        logger.error(f"Error in analyze_text: {str(e)}")
        logger.exception(e)
        return TextAnalysisResponse(tags=[])

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting backend server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")