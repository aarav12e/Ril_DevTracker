from pymongo import MongoClient
from app.core.config import settings

client = MongoClient(settings.MONGO_URL)
try:
    db = client.get_default_database()
    if db is None:
        db = client["devtracker"]
except Exception:
    db = client["devtracker"]


class Base:
    pass


def get_db():
    yield db


def get_next_sequence_value(sequence_name: str) -> int:
    res = db.counters.find_one_and_update(
        {"_id": sequence_name},
        {"$inc": {"sequence_value": 1}},
        upsert=True,
        return_document=True
    )
    return res["sequence_value"]


def init_db():
    db.users.create_index("username", unique=True)
    db.users.create_index("email", unique=True, sparse=True)
    db.task_uploads.create_index("ticket_id", unique=True, sparse=True)

