from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

db_url = settings.database_url
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

connect_args = {"connect_timeout": 3} if db_url and db_url.startswith("postgresql") else {}
engine = create_engine(db_url , connect_args = connect_args , pool_pre_ping = True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Gives each request its own database session, and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()