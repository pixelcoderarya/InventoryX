import requests

url = "http://localhost:8080/api/auth/login"
payload = {"username": "admin", "password": "admin123"}
response = requests.post(url, json=payload)
token = response.json()["token"]

print(f"Token: {token[:20]}...")

headers = {"Authorization": f"Bearer {token}"}

# Test GET users
res_get = requests.get("http://localhost:8080/api/users", headers=headers)
print(f"GET /api/users: {res_get.status_code}")

# Test POST users (Add member)
payload_user = {
    "username": "testuser_" + str(requests.utils.quote("123")),
    "password": "testpassword",
    "role": "STAFF"
}
res_post = requests.post("http://localhost:8080/api/users", json=payload_user, headers=headers)
print(f"POST /api/users: {res_post.status_code}")
print(f"Response: {res_post.text}")

# Test DELETE users
res_del = requests.delete("http://localhost:8080/api/users/2", headers=headers)
print(f"DELETE /api/users/2: {res_del.status_code}")
print(f"Response: {res_del.text}")
