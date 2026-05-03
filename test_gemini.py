import sys
import os
from google import genai
from google.genai import types
from PIL import Image

# Load .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def test_gemini():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set. Add it to your .env file.")
        return

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=['Say hello!']
        )
        print("Gemini Response:", response.text)
    except Exception as e:
        print("Gemini Error:", str(e))

if __name__ == "__main__":
    test_gemini()
