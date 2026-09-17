from datetime import datetime, timezone
import uuid

from sqlalchemy import Column, String, Integer, DateTime, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.database import Base


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String, nullable=False)
    extension = Column(String, nullable=False)
    rows = Column(Integer, nullable=False)
    columns = Column(Integer, nullable=False)
    size_bytes = Column(Integer, nullable=True)
    quality_score = Column(Float, nullable=True)
    profile = Column(JSONB, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict:
        return {
            "dataset_id": str(self.id),
            "filename": self.filename,
            "extension": self.extension,
            "rows": self.rows,
            "columns": self.columns,
            "size_bytes": self.size_bytes,
            "quality_score": self.quality_score,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }