"""Diagnostic script to check what error occurred during document processing."""
import asyncio
import httpx
import sys

BACKEND_URL = "https://eduquiz-ai-backend.onrender.com"

async def main():
    async with httpx.AsyncClient(timeout=30) as client:
        # 1. Check health
        print("=== Health Check ===")
        try:
            r = await client.get(f"{BACKEND_URL}/health")
            print(f"Status: {r.status_code}, Body: {r.json()}")
        except Exception as e:
            print(f"Health check failed: {e}")

        # 2. Try to login and get documents with error messages
        print("\n=== Checking API root ===")
        try:
            r = await client.get(f"{BACKEND_URL}/")
            print(f"Status: {r.status_code}, Body: {r.json()}")
        except Exception as e:
            print(f"Root check failed: {e}")

        # 3. Try to check the docs endpoint (will need auth)
        print("\n=== Checking docs endpoint (no auth - expect 401) ===")
        try:
            r = await client.get(f"{BACKEND_URL}/api/v1/documents")
            print(f"Status: {r.status_code}, Body: {r.text[:500]}")
        except Exception as e:
            print(f"Documents check failed: {e}")

        # 4. Check if Render logs are accessible via API
        print("\n=== Checking OpenAPI schema for error details ===")
        try:
            r = await client.get(f"{BACKEND_URL}/openapi.json")
            schema = r.json()
            paths = list(schema.get("paths", {}).keys())
            print(f"Available endpoints: {paths}")
        except Exception as e:
            print(f"Schema check failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
