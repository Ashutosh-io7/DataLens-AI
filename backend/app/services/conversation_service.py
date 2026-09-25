from __future__ import annotations

import uuid
from typing import Any
from app.core.database import SessionLocal
from app.models.conversation import Conversation, Message 
from app.models.dataset import Dataset 


def get_or_create_conversation(dataset_id: str, user_id: str | None = None) -> dict[str, Any] | None:
    try:
        db = SessionLocal()
        try:
            ds_uuid = uuid.UUID(dataset_id)
            conv = db.query(Conversation).filter(Conversation.dataset_id == ds_uuid).first()
            if not conv:
                conv = Conversation(
                    dataset_id=ds_uuid,
                    user_id=uuid.UUID(user_id) if user_id else None,
                    title="Dataset Analysis",
                )
                db.add(conv)
                db.commit()
                db.refresh(conv)

            messages = [m.to_dict() for m in conv.messages]
            return {
                "conversation_id": str(conv.id),
                "dataset_id": str(conv.dataset_id),
                "messages": messages,
            }
        finally:
            db.close()
    except Exception as exc:
        print(f"⚠️ Could not load conversation from PostgreSQL: {exc}")
        return None


def persist_turn(
    dataset_id: str,
    user_text: str,
    ai_result: dict[str, Any],
    user_id: str | None = None,
) -> None:
    """Saves both the user question and the AI response message to the database."""
    try:
        db = SessionLocal()
        try:
            ds_uuid = uuid.UUID(dataset_id)
            conv = db.query(Conversation).filter(Conversation.dataset_id == ds_uuid).first()
            if not conv:
                conv = Conversation(
                    dataset_id=ds_uuid,
                    user_id=uuid.UUID(user_id) if user_id else None,
                    title="Dataset Analysis",
                )
                db.add(conv)
                db.commit()
                db.refresh(conv)

            # Add user message
            user_msg = Message(
                conversation_id=conv.id,
                sender="user",
                text=user_text,
            )
            db.add(user_msg)

            # Add AI message
            ai_msg = Message(
                conversation_id=conv.id,
                sender="ai",
                text=ai_result.get("answer", ""),
                chart=ai_result.get("chart"),
                explanation=ai_result.get("explanation"),
                suggested_follow_ups=ai_result.get("suggested_follow_ups"),
                metrics=ai_result.get("metrics"),
                analysis_type=ai_result.get("analysis_type"),
            )
            db.add(ai_msg)

            db.commit()
        finally:
            db.close()
    except Exception as exc:
        print(f"⚠️ Could not persist message to PostgreSQL: {exc}")


def clear_conversation(dataset_id: str) -> bool:
    try:
        db = SessionLocal()
        try:
            ds_uuid = uuid.UUID(dataset_id)
            conv = db.query(Conversation).filter(Conversation.dataset_id == ds_uuid).first()
            if conv:
                db.delete(conv)
                db.commit()
                return True
            return False
        finally:
            db.close()
    except Exception as exc:
        print(f"⚠️ Could not clear conversation: {exc}")
        return False 

def get_all_charts(limit: int = 60) -> list[dict[str, Any]]:
    """Every AI message that produced a chart, newest first, with the
    dataset it came from and the question that produced it — powers the
    Charts gallery tab."""
    try:
        db = SessionLocal()
        try:
            rows = (
                db.query(Message, Conversation, Dataset)
                .join(Conversation, Message.conversation_id == Conversation.id)
                .join(Dataset, Conversation.dataset_id == Dataset.id)
                .filter(Message.sender == "ai", Message.chart.isnot(None))
                .order_by(Message.created_at.desc())
                .limit(limit)
                .all()
            )

            results = []
            for msg, conv, ds in rows:
                prev_question = (
                    db.query(Message)
                    .filter(
                        Message.conversation_id == conv.id,
                        Message.sender == "user",
                        Message.created_at < msg.created_at,
                    )
                    .order_by(Message.created_at.desc())
                    .first()
                )
                results.append({
                    "message_id": str(msg.id),
                    "dataset_id": str(ds.id),
                    "dataset_filename": ds.filename,
                    "question": prev_question.text if prev_question else None,
                    "answer": msg.text,
                    "chart": msg.chart,
                    "analysis_type": msg.analysis_type,
                    "created_at": msg.created_at.isoformat() if msg.created_at else None,
                })
            return results
        finally:
            db.close()
    except Exception as exc:
        print(f"⚠️ Could not load charts: {exc}")
        return []
