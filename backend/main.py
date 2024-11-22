from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import openai
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

openai.api_key = os.getenv("OPENAI_API_KEY")

class TextAnalysisRequest(BaseModel):
    text: str

class TextAnalysisResponse(BaseModel):
    tags: List[str]

@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    content = await file.read()
    
    with open("temp_audio.webm", "wb") as f:
        f.write(content)
    
    try:
        with open("temp_audio.webm", "rb") as audio_file:
            transcript = openai.Audio.transcribe(
                "whisper-1",
                audio_file
            )
        return {"text": transcript["text"]}
    finally:
        os.remove("temp_audio.webm")

@app.post("/api/analyze", response_model=TextAnalysisResponse)
async def analyze_text(request: TextAnalysisRequest):
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)