
import os
import requests
import json
import argparse
import sys
from pathlib import Path

# Đảm bảo đầu ra luôn là UTF-8 để tránh lỗi encoding trên Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

def load_env():
    env_path = Path(__file__).parent.parent.parent.parent.parent / ".env"
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if "=" in line:
                    key, value = line.strip().split("=", 1)
                    os.environ[key] = value

def call_mimo(prompt):
    load_env()
    api_key = os.getenv("MIMO_API_KEY")
    base_url = os.getenv("MIMO_BASE_URL", "https://token-plan-sgp.xiaomimimo.com/v1")
    model = os.getenv("MIMO_MODEL", "mimo-v2.5-pro")
    
    if not api_key:
        return "Lỗi: Không tìm thấy MIMO_API_KEY trong file .env"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7
    }
    
    try:
        response = requests.post(f"{base_url}/chat/completions", headers=headers, data=json.dumps(payload))
        if response.status_code == 200:
            return response.json()['choices'][0]['message']['content']
        else:
            return f"Lỗi API ({response.status_code}): {response.text}"
    except Exception as e:
        return f"Đã xảy ra lỗi: {e}"

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Call MiMo AI API")
    parser.add_argument("--prompt", type=str, required=True, help="Câu hỏi cho MiMo")
    args = parser.parse_args()
    
    result = call_mimo(args.prompt)
    print(result)
