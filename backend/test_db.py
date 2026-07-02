import os
from dotenv import load_dotenv
import pymysql

load_dotenv()

try:
    conn = pymysql.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
    )
    print("✅ Connected successfully to:", os.getenv("DB_NAME"))
    conn.close()
except Exception as e:
    print("❌ Connection failed:", e)
