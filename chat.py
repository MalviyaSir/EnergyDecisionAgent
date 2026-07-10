import requests

API_KEY = "YOUR_API_KEY"

url = "https://apim-foundry-prod-ltts.azure-api.net/gpt5-mini/deployments/gpt-5-mini/chat/completions?api-version=2024-12-01-preview"

headers = {
    "api-key": API_KEY,
    "Content-Type": "application/json"
}

body = {
    "messages": [
        {
            "role": "user",
            "content": input("You: ")
        }
    ]
}

response = requests.post(url, headers=headers, json=body)

print(response.json()["choices"][0]["message"]["content"])