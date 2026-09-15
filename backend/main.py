from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware 
from app.core.config import settings 

from app.routes.datasets import router as datasets_router 

app = FastAPI(
    title = "DataLens AI API",
    version = "1.0.0", 
)

app.add_middleware(
    CORSMiddleware,
    allow_origins = settings.cors_origins, 
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
) 

app.include_router(
    datasets_router,
    prefix = "/api/datasets",
    tags = ["Datasets"], 
) 

@app.get("/") 
def root() :
    return {
        "message" : "DataLens AI API is running" 
    }