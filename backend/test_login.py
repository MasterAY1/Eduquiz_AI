import asyncio
from app.database import AsyncSessionLocal
from app.services.auth_service import auth_service
from app.schemas.auth import LoginRequest
import logging
logging.basicConfig(level=logging.INFO)

async def main():
    async with AsyncSessionLocal() as db:
        try:
            req = LoginRequest(email="test@test.com", password="password")
            # this will definitely fail if user doesn't exist, but let's test if it's hitting the 500
            res = await auth_service.login(db, req)
            print("Login success!", res)
        except Exception as e:
            print("Exception:", type(e), e)

if __name__ == "__main__":
    asyncio.run(main())
