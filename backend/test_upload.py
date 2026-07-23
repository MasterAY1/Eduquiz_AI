import asyncio
import httpx

async def test_upload():
    async with httpx.AsyncClient() as client:
        # We need an auth token
        response = await client.post("http://localhost:8000/api/v1/auth/login", json={
            "email": "dngayomide@gmail.com",
            "password": "password" # I don't know the password
        })
        print(response.json())

if __name__ == "__main__":
    asyncio.run(test_upload())
