import asyncio
import ssl
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres.gmtkjhpmjltewmwqmupl:mVjB4R_gjUxRRVR@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"

async def check_recent_documents():
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE

    engine = create_async_engine(
        DATABASE_URL,
        connect_args={
            "ssl": ssl_ctx,
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0,
        }
    )

    async with engine.connect() as conn:
        result = await conn.execute(
            text("""
                SELECT id, title, source_type, analysis_status, error_message, chunk_count, word_count, created_at 
                FROM documents 
                ORDER BY created_at DESC 
                LIMIT 15;
            """)
        )
        rows = result.fetchall()
        print("=== RECENT DOCUMENTS IN DATABASE ===")
        for r in rows:
            print(f"ID: {r[0]}")
            # Encode/decode title safely to prevent Windows CP1252 console printing errors
            title_str = r[1].encode('ascii', 'replace').decode('ascii') if r[1] else 'None'
            print(f"Title: {title_str}")
            print(f"Type: {r[2]}")
            print(f"Status: {r[3]}")
            err_str = str(r[4]).encode('ascii', 'replace').decode('ascii') if r[4] else 'None'
            print(f"Error Message: {err_str}")
            print(f"Chunks: {r[5]}, Words: {r[6]}")
            print(f"Created At: {r[7]}")
            print("-" * 50)

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_recent_documents())
