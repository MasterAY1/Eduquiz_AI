import asyncio
import asyncpg
from app.config import get_settings

async def main():
    settings = get_settings()
    # asyncpg requires postgresql:// instead of postgresql+asyncpg://
    db_url = settings.DATABASE_URL.replace('+asyncpg', '')
    
    conn = await asyncpg.connect(db_url)
    try:
        # Terminate all other connections to the current database
        query = """
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE datname = current_database() 
        AND pid <> pg_backend_pid();
        """
        await conn.execute(query)
        print("Terminated other connections.")
    finally:
        await conn.close()

if __name__ == '__main__':
    asyncio.run(main())
