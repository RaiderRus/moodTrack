from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import openai
import os
import logging
from dotenv import load_dotenv

# Загружаем переменные окружения из .env файла
load_dotenv()

# Настраиваем логирование
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Расширяем CORS настройки
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Проверяем наличие API ключа
if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY environment variable is not set")

openai.api_key = os.getenv("OPENAI_API_KEY")

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
        content = await file.read()
        
        with open("temp_audio.webm", "wb") as f:
            f.write(content)
        
        with open("temp_audio.webm", "rb") as audio_file:
            transcript = openai.Audio.transcribe(
                "whisper-1",
                audio_file
            )
        return {"text": transcript["text"]}
    except Exception as e:
        print(f"Error in transcribe_audio: {e}")
        raise
    finally:
        if os.path.exists("temp_audio.webm"):
            os.remove("temp_audio.webm")

@app.post("/api/analyze", response_model=TextAnalysisResponse)
async def analyze_text(request: TextAnalysisRequest):
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": """You are a mood analysis expert. Analyze the given text and return relevant mood tags from the following categories:
                        Emotions: happy, excited, calm, anxious, sad, angry
                        Activity: work_activity, exercise, social, rest
                        Contexts: home, work_location, outside
                        Return only the tag IDs in a JSON array."""
                },
                {
                    "role": "user",
                    "content": request.text
                }
            ]
        )
        
        tags = eval(response.choices[0].message.content)
        return TextAnalysisResponse(tags=tags)
    except Exception as e:
        print(f"Error in analyze_text: {e}")
        raise

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting backend server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")