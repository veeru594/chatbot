# app/config.py
import os
from dotenv import load_dotenv

# Find absolute project root (two levels above this file)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(BASE_DIR, ".env")

load_dotenv(dotenv_path)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    print(f"⚠️  OPENAI_API_KEY not loaded. Checked path: {dotenv_path}")
else:
    print("✅ OPENAI_API_KEY loaded successfully")
