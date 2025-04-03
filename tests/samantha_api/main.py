import openai
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse
from pathlib import Path

from config import settings
from models import ChatRequest, ChatResponse, ChatMessage

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Samantha AI API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure OpenAI client
client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

# Mount static files
app.mount("/static", StaticFiles(directory=Path(__file__).parent / "static"), name="static")

# Setup templates
templates = Jinja2Templates(directory=Path(__file__).parent / "templates")

@app.get("/")
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    try:
        logger.info(f"Processing chat request: {request}")
        
        # Set up the messages for OpenAI
        messages = [{"role": "system", "content": settings.SYSTEM_PROMPT}]
        
        # Add user messages
        for msg in request.messages:
            messages.append({"role": msg.role, "content": msg.content})
        
        # Handle translate mode
        if request.translate_mode and request.original_response:
            translate_prompt = f"""
            I need you to humanize the following chatbot response, making it sound like you, Samantha, would say it:
            
            Original response: "{request.original_response}"
            
            Make it warm, natural, and conversational while keeping all the key information. 
            Break up robotic sentences. Use casual punctuation, contractions, and natural phrasing.
            """
            messages.append({"role": "user", "content": translate_prompt})
        
        logger.info(f"Sending to OpenAI: {messages}")
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model=settings.MODEL_NAME,
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        
        # Extract the response text
        response_text = response.choices[0].message.content.strip()
        logger.info(f"Received response from OpenAI: {response_text[:100]}...")
        
        return ChatResponse(response=response_text)
        
    except Exception as e:
        logger.error(f"Error processing request: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error calling OpenAI API: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "api_key_configured": bool(settings.OPENAI_API_KEY)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
