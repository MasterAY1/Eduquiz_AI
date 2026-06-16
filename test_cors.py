import httpx

url = "https://eduquiz-ai-backend.onrender.com/api/v1/auth/login"
headers = {
    "Origin": "https://eduquiz-ai-rose.vercel.app",
    "Content-Type": "application/json"
}
data = {
    "email": "test@test.com",
    "password": "password"
}

response = httpx.post(url, headers=headers, json=data)
print(f"Status Code: {response.status_code}")
print(f"Response Headers: {response.headers}")
print(f"Response Text: {response.text}")
