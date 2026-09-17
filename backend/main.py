from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware 
from app.core.config import settings 

from app.routes.datasets import router as datasets_router 
from app.core.exceptions import register_exception_handlers 

app = FastAPI(
    title = "DataLens AI API",
    version = "1.0.0", 
) 

register_exception_handlers(app) 

from app.core.database import Base, engine
from app.models.dataset import Dataset

Base.metadata.create_all(bind=engine) 

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