from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.conversation import Conversation, Message
from app.models.dataset import Dataset
from app.models.user import User  # Required for SQLAlchemy foreign key resolution

settings.conversations_dir.mkdir(parents=True, exist_ok=True)


def _get_conv_file_path(dataset_id: str) -> Path:
    return settings.conversations_dir / f"{dataset_id}.json"


def _read_file_conversation(dataset_id: str) -> dict[str, Any] | None:
    path = _get_conv_file_path(dataset_id)
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"[Conversation] Error reading fallback file for {dataset_id}: {exc}")
        return None


def _write_file_conversation(dataset_id: str, data: dict[str, Any]) -> None:
    path = _get_conv_file_path(dataset_id)
    try:
        path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    except Exception as exc:
        print(f"[Conversation] Error writing fallback file for {dataset_id}: {exc}")


def get_or_create_conversation(dataset_id: str, user_id: str | None = None) -> dict[str, Any] | None:
    # 1. Try PostgreSQL first
    db_messages = None
    conv_id = None
    try:
        db = SessionLocal()
        try:
            ds_uuid = uuid.UUID(dataset_id)
            conv = db.query(Conversation).filter(Conversation.dataset_id == ds_uuid).first()
            if not conv:
                # Ensure Dataset exists in DB before creating conversation to avoid FK violation
                ds_exists = db.query(Dataset).filter(Dataset.id == ds_uuid).first()
                if ds_exists:
                    conv = Conversation(
                        dataset_id=ds_uuid,
                        user_id=uuid.UUID(user_id) if user_id else None,
                        title="Dataset Analysis",
                    )
                    db.add(conv)
                    db.commit()
                    db.refresh(conv)

            if conv:
                conv_id = str(conv.id)
                db_messages = [m.to_dict() for m in conv.messages]
        finally:
            db.close()
    except Exception as exc:
        print(f"[Conversation] Could not load conversation from PostgreSQL: {exc}")

    # If DB returned a conversation with messages, return it
    if db_messages is not None and len(db_messages) > 0:
        return {
            "conversation_id": conv_id,
            "dataset_id": dataset_id,
            "messages": db_messages,
        }

    # 2. Fall back to local file storage (ensures messages persist even if DB is disconnected/ephemeral)
    file_conv = _read_file_conversation(dataset_id)
    if file_conv and file_conv.get("messages"):
        return {
            "conversation_id": file_conv.get("conversation_id") or conv_id or str(uuid.uuid4()),
            "dataset_id": dataset_id,
            "messages": file_conv.get("messages", []),
        }

    return {
        "conversation_id": conv_id or str(uuid.uuid4()),
        "dataset_id": dataset_id,
        "messages": [],
    }


def persist_turn(
    dataset_id: str,
    user_text: str,
    ai_result: dict[str, Any],
    user_id: str | None = None,
) -> None:
    """Saves both the user question and the AI response message to both file fallback and PostgreSQL."""
    now_iso = datetime.now(timezone.utc).isoformat()
    user_msg_id = str(uuid.uuid4())
    ai_msg_id = str(uuid.uuid4())

    user_dict = {
        "id": user_msg_id,
        "sender": "user",
        "text": user_text,
        "createdAt": now_iso,
    }
    ai_dict = {
        "id": ai_msg_id,
        "sender": "ai",
        "text": ai_result.get("answer", ""),
        "chart": ai_result.get("chart"),
        "explanation": ai_result.get("explanation"),
        "suggestedFollowUps": ai_result.get("suggested_follow_ups") or [],
        "metrics": ai_result.get("metrics"),
        "analysisType": ai_result.get("analysis_type"),
        "createdAt": now_iso,
    }

    # 1. ALWAYS persist to local JSON file first (guarantees zero data loss during tab navigation)
    file_conv = _read_file_conversation(dataset_id) or {
        "conversation_id": str(uuid.uuid4()),
        "dataset_id": dataset_id,
        "user_id": user_id,
        "title": "Dataset Analysis",
        "created_at": now_iso,
        "messages": [],
    }
    file_conv["messages"].append(user_dict)
    file_conv["messages"].append(ai_dict)
    _write_file_conversation(dataset_id, file_conv)

    # 2. Also sync to PostgreSQL if database connection is active
    try:
        db = SessionLocal()
        try:
            ds_uuid = uuid.UUID(dataset_id)
            # Ensure Dataset exists in DB before attaching conversation
            ds = db.query(Dataset).filter(Dataset.id == ds_uuid).first()
            if not ds:
                # If dataset row was not in PostgreSQL, create stub record so FK succeeds
                from app.services.dataset_service import get_dataset_metadata
                meta = get_dataset_metadata(dataset_id)
                ds = Dataset(
                    id=ds_uuid,
                    user_id=uuid.UUID(user_id) if user_id else (uuid.UUID(meta["user_id"]) if meta.get("user_id") else None),
                    filename=meta.get("filename", "dataset.csv"),
                    extension=meta.get("extension", "csv"),
                    rows=meta.get("rows", 0),
                    columns=meta.get("columns", 0),
                    size_bytes=meta.get("size_bytes", 0),
                    quality_score=meta.get("quality_score"),
                )
                db.add(ds)
                db.commit()

            conv = db.query(Conversation).filter(Conversation.dataset_id == ds_uuid).first()
            if not conv:
                conv = Conversation(
                    dataset_id=ds_uuid,
                    user_id=uuid.UUID(user_id) if user_id else (uuid.UUID(ds.user_id) if ds.user_id else None),
                    title="Dataset Analysis",
                )
                db.add(conv)
                db.commit()
                db.refresh(conv)

            # Add user message
            user_msg = Message(
                id=uuid.UUID(user_msg_id),
                conversation_id=conv.id,
                sender="user",
                text=user_text,
            )
            db.add(user_msg)

            # Add AI message
            ai_msg = Message(
                id=uuid.UUID(ai_msg_id),
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
        print(f"[Conversation] Could not persist message to PostgreSQL: {exc}")


def clear_conversation(dataset_id: str) -> bool:
    # 1. Clear file storage
    path = _get_conv_file_path(dataset_id)
    if path.exists():
        try:
            path.unlink()
        except Exception:
            pass

    # 2. Clear PostgreSQL
    try:
        db = SessionLocal()
        try:
            ds_uuid = uuid.UUID(dataset_id)
            conv = db.query(Conversation).filter(Conversation.dataset_id == ds_uuid).first()
            if conv:
                db.delete(conv)
                db.commit()
                return True
            return True
        finally:
            db.close()
    except Exception as exc:
        print(f"[Conversation] Could not clear conversation in PostgreSQL: {exc}")
        return True


def get_all_charts(limit: int = 60) -> list[dict[str, Any]]:
    """Every AI message that produced a chart, newest first. Checks PostgreSQL first,
    falling back to file storage if PostgreSQL is offline."""
    # 1. Try PostgreSQL
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

            if rows:
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
        print(f"[Conversation] Could not load charts from PostgreSQL: {exc}")

    # 2. Fall back to local file conversations
    charts = []
    from app.services.dataset_service import get_dataset_metadata
    for conv_file in settings.conversations_dir.glob("*.json"):
        dataset_id = conv_file.stem
        try:
            conv_data = json.loads(conv_file.read_text(encoding="utf-8"))
            filename = "Dataset"
            try:
                meta = get_dataset_metadata(dataset_id)
                filename = meta.get("filename", "Dataset")
            except Exception:
                pass

            messages = conv_data.get("messages", [])
            for i, msg in enumerate(messages):
                if msg.get("sender") == "ai" and msg.get("chart"):
                    # Find preceding question
                    prev_q = None
                    for j in range(i - 1, -1, -1):
                        if messages[j].get("sender") == "user":
                            prev_q = messages[j].get("text")
                            break
                    charts.append({
                        "message_id": msg.get("id"),
                        "dataset_id": dataset_id,
                        "dataset_filename": filename,
                        "question": prev_q,
                        "answer": msg.get("text"),
                        "chart": msg.get("chart"),
                        "analysis_type": msg.get("analysisType"),
                        "created_at": msg.get("createdAt"),
                    })
        except Exception:
            continue

    charts.sort(key=lambda c: c.get("created_at") or "", reverse=True)
    return charts[:limit]
