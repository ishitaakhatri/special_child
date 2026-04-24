import sys
import os
from google import genai
from google.genai import types
from PIL import Image

def test_gemini():
    api_key = os.environ.get("GEMINI_API_KEY", "AIzaSyDjU2RkL7NG0RsSae18_U1KYsoPm0AviiQ")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set.")
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
