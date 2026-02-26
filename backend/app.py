"""
Special Child Writing Helper - Flask Backend API
=================================================
Wraps the existing ML + Gemini Vision analysis logic as REST endpoints.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import json
from PIL import Image
from datetime import datetime
import base64
from io import BytesIO
import os

# Try to import TensorFlow
try:
    import tensorflow as tf
    from tensorflow import keras
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

# Try to import Gemini
try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except Exception:
    GEMINI_AVAILABLE = False

# Try to import dotenv
try:
    from dotenv import load_dotenv
    load_dotenv() # Load .env if present
    # Also look in frontend or root
    load_dotenv("../frontend/.env")
    load_dotenv("../.env")
except ImportError:
    pass

# Try to import OpenCV
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

app = Flask(__name__)
CORS(app)

def get_api_key(provided_key):
    """
    Resolve the Gemini API key with the following precedence:
    1. Provided via the request (UI)
    2. Environment variable (GEMINI_API_KEY)
    """
    if provided_key:
        return provided_key
    ext_key = os.environ.get('GEMINI_API_KEY', '') or os.environ.get('VITE_GEMINI_API_KEY', '')
    if ext_key:
        print("DEBUG: Using API key from environment variable")
    return ext_key

# ============================================
# CLASS LABELS & DATA
# ============================================

CLASS_LABELS = ['ANSHUL', 'ANUJ', 'APPLE', 'ASHOK', 'BANANA', 'BAT', 'BEAR', 'BIKE', 'BLACK',
                'BLUE', 'BUS', 'CAR', 'CARROT', 'CHEST', 'CHIRAG', 'CIRCLE', 'COW', 'CRICKET',
                'CROW', 'DEER', 'DOCTOR', 'DOG', 'EAR', 'EARS', 'ELEPHANT', 'EYE', 'EYES',
                'FOUR', 'FOX', 'FRIDAY', 'GOAT', 'GRAPES', 'GREEN', 'GUAVA', 'HAIR', 'HAND',
                'HEAR', 'HEN', 'HOLI', 'IS', 'ISHITA', 'JEEP', 'JITENDER', 'LEG', 'LION',
                'LIPS', 'LOTUS', 'LUDO', 'MANGO', 'MANOJ', 'MARIGOLD', 'MAT', 'MONDAY',
                'MONSOON', 'MOUTH', 'NAME', 'NAN', 'NOSE', 'ONION', 'ORANGE', 'OWL', 'OX',
                'PARROT', 'PARUL', 'PEA', 'PEAS', 'PINK', 'PLEASE', 'POLICE', 'POTATO',
                'RADISH', 'RAIN', 'RECTANGLE', 'RED', 'ROSE', 'SATURDAY', 'SCOOTY', 'SORRY',
                'SQUARE', 'SUDESH', 'SUDHIR', 'SUMMAR', 'SUMMER', 'SUNDAY', 'SUNFLOWER',
                'SWAN', 'TAILOR', 'TEEJ', 'THURSDAY', 'TIGER', 'TOMATO', 'TRAIN', 'TRUCK',
                'TUESDAY', 'TULIP', 'TWO', 'VAN', 'WEDNESDAY', 'WHITE', 'YELLOW']

STUDENTS = [
    {'id': 1, 'name': 'Aaru', 'disability': 'MR', 'iq': 42, 'disability_percentage': 75, 'age': 10},
    {'id': 2, 'name': 'Akash', 'disability': 'ID', 'iq': 38, 'disability_percentage': 75, 'age': 6},
    {'id': 3, 'name': 'Chirag', 'disability': 'Severe MR', 'iq': 24, 'disability_percentage': 90, 'age': 24},
    {'id': 4, 'name': 'Gagan', 'disability': 'CP', 'iq': 35, 'disability_percentage': 75, 'age': 25},
    {'id': 5, 'name': 'Gargi', 'disability': 'CP', 'iq': 40, 'disability_percentage': 85, 'age': 17},
    {'id': 6, 'name': 'Manoj', 'disability': 'Severe ID', 'iq': 20, 'disability_percentage': 90, 'age': 35},
    {'id': 7, 'name': 'Mayur', 'disability': 'ID', 'iq': 40, 'disability_percentage': 85, 'age': 10},
    {'id': 8, 'name': 'Meet', 'disability': 'Moderate MR', 'iq': 36, 'disability_percentage': 70, 'age': 20},
    {'id': 9, 'name': 'Monika', 'disability': 'Severe MR', 'iq': 26, 'disability_percentage': 90, 'age': 14},
    {'id': 10, 'name': 'Parul', 'disability': 'Moderate ID', 'iq': 42, 'disability_percentage': 75, 'age': 32},
    {'id': 11, 'name': 'Prateek', 'disability': 'CP', 'iq': 24, 'disability_percentage': 90, 'age': 28},
    {'id': 12, 'name': 'Preetam', 'disability': 'CP', 'iq': 35, 'disability_percentage': 90, 'age': 20},
    {'id': 13, 'name': 'Rahul', 'disability': 'MR', 'iq': 48, 'disability_percentage': 80, 'age': 14},
    {'id': 14, 'name': 'Samarth', 'disability': 'MR', 'iq': 48, 'disability_percentage': 80, 'age': 14},
    {'id': 15, 'name': 'Sneha', 'disability': 'ID', 'iq': 24, 'disability_percentage': 90, 'age': 22},
    {'id': 16, 'name': 'Sunny', 'disability': 'Severe CP', 'iq': 20, 'disability_percentage': 80, 'age': 18}
]

# In-memory progress store
student_progress = {}

# ============================================
# MODEL LOADING
# ============================================

ml_model = None

def load_ml_model():
    global ml_model
    if not TF_AVAILABLE:
        return None
    model_paths = ['model.h5', 'model.keras', 'saved_model', 'models/model.h5',
                   '../model.h5', '../model.keras', '../saved_model', '../models/model.h5']
    for path in model_paths:
        if os.path.exists(path):
            try:
                ml_model = keras.models.load_model(path, compile=False)
                print(f"ML Model loaded from {path}")
                return ml_model
            except Exception:
                continue
    print("No ML model found.")
    return None


# ============================================
# ANALYSIS FUNCTIONS
# ============================================

def decode_image(image_data):
    """Decode base64 image or file bytes to PIL Image"""
    if isinstance(image_data, str):
        image_bytes = base64.b64decode(image_data)
    else:
        image_bytes = image_data
    return Image.open(BytesIO(image_bytes))


def analyze_with_gemini_vision(image, student_data, api_key):
    if not GEMINI_AVAILABLE:
        print("DEBUG: GEMINI_AVAILABLE is False")
        return None
    
    # Resolve API Key
    resolved_key = get_api_key(api_key)
    if not resolved_key:
        print("DEBUG: No API key found (provided or environment)")
        return None

    try:
        print(f"DEBUG: Initializing Gemini Client with key prefix: {resolved_key[:5]}...")
        client = genai.Client(api_key=resolved_key)
        
        prompt = f"""You are an expert in analyzing handwriting from children with special needs.

TASK: Analyze this handwriting sample from a student.

STUDENT CONTEXT:
- Name: {student_data['name']}
- Age: {student_data['age']} years
- Disability Type: {student_data['disability']}
- IQ Level: {student_data['iq']}

EXPECTED VOCABULARY (the word is likely one of these):
{', '.join(CLASS_LABELS[:30])}... and similar simple words.

Please analyze the image and provide your response in this EXACT JSON format:
{{
    "detected_word": "THE WORD YOU SEE IN THE IMAGE",
    "confidence": 85,
    "letter_analysis": {{
        "A": {{"score": 75, "feedback": "Letter A needs more practice - spacing issue"}},
        "B": {{"score": 90, "feedback": "Well formed"}}
    }},
    "overall_feedback": "Brief overall assessment of the writing quality",
    "weak_letters": ["A", "C"],
    "strong_letters": ["B", "D"],
    "practice_recommendations": ["Specific recommendation 1", "Recommendation 2"],
    "motor_skill_observations": "Observations about fine motor control",
    "improvement_areas": ["Area 1", "Area 2"]
}}

IMPORTANT:
1. Analyze EACH letter in the detected word
2. Score each letter 0-100 based on formation, size, and clarity
3. Consider the student's disability when providing feedback
4. Be encouraging but honest
5. Return ONLY valid JSON, no other text
"""
        # Prepare image for Gemini
        img_byte_arr = BytesIO()
        image.save(img_byte_arr, format='PNG')
        img_bytes = img_byte_arr.getvalue()
        
        print(f"DEBUG: Calling Gemini model: gemini-2.5-flash")
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                prompt,
                types.Part.from_bytes(data=img_bytes, mime_type='image/png')
            ]
        )
        if not response or not hasattr(response, 'text') or not response.text:
            print("DEBUG: Gemini returned empty or invalid response")
            return {"error": "Empty or invalid response from Gemini"}

        response_text = response.text.strip()
        print(f"DEBUG: Gemini Success. Response length: {len(response_text)}")

        if response_text.startswith('```'):
            parts = response_text.split('```')
            if len(parts) > 1:
                response_text = parts[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]
        response_text = response_text.strip()
        response_text = response_text.strip()

        return json.loads(response_text)
    except json.JSONDecodeError:
        print(f"DEBUG: JSONDecodeError. Raw response: {response_text[:100]}...")
        return {"error": "JSON parsing failed", "raw_response": response_text}
    except Exception as e:
        print(f"DEBUG: Gemini Exception: {str(e)}")
        return {"error": str(e)}


def predict_with_ml_model(image):
    if ml_model is None:
        return None
    try:
        img = np.array(image)
        if CV2_AVAILABLE:
            if len(img.shape) == 2:
                img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
            elif img.shape[2] == 4:
                img = cv2.cvtColor(img, cv2.COLOR_RGBA2RGB)

            input_shape = ml_model.input_shape
            target_size = (input_shape[1], input_shape[2]) if input_shape[1] else (128, 128)
            img = cv2.resize(img, target_size)
        else:
            img = np.array(image.resize((128, 128)).convert('RGB'))

        img = img.astype(np.float32) / 255.0
        img = np.expand_dims(img, axis=0)

        predictions = ml_model.predict(img, verbose=0)
        top_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][top_idx] * 100)
        predicted_word = CLASS_LABELS[top_idx] if top_idx < len(CLASS_LABELS) else f"CLASS_{top_idx}"

        return {
            "detected_word": predicted_word,
            "confidence": confidence
        }
    except Exception as e:
        return {"error": str(e)}


def hybrid_analysis(image, student_data, api_key):
    results = {
        "ml_result": None,
        "llm_result": None,
        "final_prediction": None,
        "confidence": 0,
        "letter_scores": {},
        "feedback": "",
        "recommendations": [],
        "weak_letters": [],
        "motor_observations": ""
    }

    # ML model prediction
    if ml_model is not None:
        ml_result = predict_with_ml_model(image)
        if ml_result and "error" not in ml_result:
            results["ml_result"] = ml_result

    # LLM analysis
    llm_error = None
    if api_key and GEMINI_AVAILABLE:
        llm_result = analyze_with_gemini_vision(image, student_data, api_key)
        if llm_result and "error" not in llm_result:
            results["llm_result"] = llm_result
        elif llm_result and "error" in llm_result:
            llm_error = llm_result["error"]
            print(f"DEBUG: LLM Analysis failed: {llm_error}")
    elif not api_key:
        print("DEBUG: No API key provided for hybrid analysis")
    elif not GEMINI_AVAILABLE:
        print("DEBUG: Gemini SDK not available")

    # Combine
    if results["llm_result"]:
        llm = results["llm_result"]
        results["final_prediction"] = llm.get("detected_word", "UNKNOWN")
        results["confidence"] = llm.get("confidence", 0)
        letter_analysis = llm.get("letter_analysis", {})
        for letter, data in letter_analysis.items():
            if isinstance(data, dict):
                results["letter_scores"][letter] = data.get("score", 50)
            else:
                results["letter_scores"][letter] = data
        results["feedback"] = llm.get("overall_feedback", "")
        results["recommendations"] = llm.get("practice_recommendations", [])
        results["weak_letters"] = llm.get("weak_letters", [])
        results["motor_observations"] = llm.get("motor_skill_observations", "")
    elif results["ml_result"]:
        ml = results["ml_result"]
        results["final_prediction"] = ml["detected_word"]
        results["confidence"] = ml["confidence"]
        for letter in set(ml["detected_word"]):
            variation = float(np.random.uniform(-15, 15))
            results["letter_scores"][letter] = max(0, min(100, ml["confidence"] + variation))
        results["feedback"] = "Analysis based on ML model. Enable Gemini API for detailed feedback."
    else:
        # Demo mode
        results["final_prediction"] = str(np.random.choice(CLASS_LABELS))
        results["confidence"] = float(np.random.uniform(60, 90))
        for letter in set(results["final_prediction"]):
            results["letter_scores"][letter] = float(np.random.uniform(50, 95))
        
        if llm_error:
            results["feedback"] = f"Gemini Error: {llm_error}. (Using fallback prediction)"
        else:
            results["feedback"] = "Demo mode - no model or API key configured."

    return results


# ============================================
# API ROUTES
# ============================================

@app.route('/api/students', methods=['GET'])
def get_students():
    return jsonify(STUDENTS)


@app.route('/api/analyze', methods=['POST'])
def analyze():
    try:
        provided_key = request.form.get('api_key', '')
        api_key = get_api_key(provided_key)
        print(f"DEBUG: /api/analyze called. Mode: {request.form.get('mode')}, API Key resolved: {bool(api_key)}")
        student_json = request.form.get('student', '{}')
        student = json.loads(student_json)
        mode = request.form.get('mode', 'hybrid')

        # Get image
        if 'image' in request.files:
            image_file = request.files['image']
            image = Image.open(image_file.stream)
        elif 'image_base64' in request.form:
            image = decode_image(request.form['image_base64'])
        else:
            return jsonify({"error": "No image provided"}), 400

        # Run analysis based on mode
        if mode == 'hybrid':
            results = hybrid_analysis(image, student, api_key)
        elif mode == 'ml_only':
            ml_result = predict_with_ml_model(image)
            results = {
                "ml_result": ml_result,
                "llm_result": None,
                "final_prediction": ml_result["detected_word"] if ml_result and "error" not in ml_result else "N/A",
                "confidence": ml_result["confidence"] if ml_result and "error" not in ml_result else 0,
                "letter_scores": {},
                "feedback": "ML model analysis only.",
                "recommendations": [],
                "weak_letters": [],
                "motor_observations": ""
            }
            if ml_result and "error" not in ml_result:
                for letter in set(ml_result["detected_word"]):
                    results["letter_scores"][letter] = float(ml_result["confidence"] + np.random.uniform(-15, 15))
        elif mode == 'llm_only':
            llm_result = analyze_with_gemini_vision(image, student, api_key)
            results = {
                "ml_result": None,
                "llm_result": llm_result,
                "final_prediction": llm_result.get("detected_word", "N/A") if llm_result and "error" not in llm_result else "N/A",
                "confidence": llm_result.get("confidence", 0) if llm_result and "error" not in llm_result else 0,
                "letter_scores": {},
                "feedback": llm_result.get("overall_feedback", "") if llm_result else "",
                "recommendations": llm_result.get("practice_recommendations", []) if llm_result else [],
                "weak_letters": llm_result.get("weak_letters", []) if llm_result else [],
                "motor_observations": llm_result.get("motor_skill_observations", "") if llm_result else ""
            }
            if llm_result and "letter_analysis" in llm_result:
                for letter, data in llm_result["letter_analysis"].items():
                    results["letter_scores"][letter] = data.get("score", 50) if isinstance(data, dict) else data
        else:
            return jsonify({"error": "Invalid mode"}), 400

        return jsonify(results)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/recommendations', methods=['POST'])
def recommendations():
    try:
        data = request.json
        provided_key = data.get('api_key', '')
        api_key = get_api_key(provided_key)
        student = data.get('student', {})
        analysis_result = data.get('analysis_result', {})

        if not GEMINI_AVAILABLE or not api_key:
            return jsonify({"error": "Gemini API not available or no API key"}), 400

        print(f"DEBUG: /api/recommendations called. API Key length: {len(api_key)}")
        client = genai.Client(api_key=api_key)

        prompt = f"""You are a special education expert. Based on this handwriting analysis, provide teaching recommendations.

STUDENT PROFILE:
- Name: {student.get('name', 'Unknown')}
- Age: {student.get('age', 'Unknown')}
- Disability: {student.get('disability', 'Unknown')}
- IQ: {student.get('iq', 'Unknown')}

ANALYSIS RESULTS:
{json.dumps(analysis_result, indent=2)}

Provide 5 specific, actionable teaching strategies tailored to this student's needs.
Focus on:
1. Activities to improve weak letters
2. Motor skill exercises
3. Engagement strategies appropriate for their disability
4. Home practice suggestions
5. Positive reinforcement techniques

Be concise and practical.
"""
        print(f"DEBUG: Calling Gemini (Recommendations): gemini-2.5-flash")
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt]
        )
        return jsonify({"recommendations": response.text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        provided_key = data.get('api_key', '')
        api_key = get_api_key(provided_key)
        student = data.get('student', {})
        message = data.get('message', '')
        progress_count = data.get('progress_count', 0)
        recent_words = data.get('recent_words', [])

        if not GEMINI_AVAILABLE or not api_key:
            return jsonify({"error": "Gemini API not available or no API key"}), 400

        print(f"DEBUG: /api/chat called. API Key length: {len(api_key)}")
        client = genai.Client(api_key=api_key)

        prompt = f"""You are a special education teaching assistant.

STUDENT: {student.get('name', 'Unknown')}, Age {student.get('age', 'Unknown')}, {student.get('disability', 'Unknown')}, IQ {student.get('iq', 'Unknown')}
PROGRESS ENTRIES: {progress_count}
RECENT WORDS: {recent_words if recent_words else 'None yet'}

TEACHER'S QUESTION: {message}

Provide helpful, practical advice. Be concise."""

        print(f"DEBUG: Calling Gemini (Chat): gemini-2.5-flash")
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt]
        )
        return jsonify({"response": response.text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/progress/<student_name>', methods=['GET'])
def get_progress(student_name):
    return jsonify(student_progress.get(student_name, []))


@app.route('/api/progress/<student_name>', methods=['POST'])
def save_progress(student_name):
    try:
        data = request.json
        if student_name not in student_progress:
            student_progress[student_name] = []

        entry = {
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'predicted_word': data.get('final_prediction', 'N/A'),
            'confidence': data.get('confidence', 0),
            'letter_scores': data.get('letter_scores', {}),
            'weakest_letter': '',
            'feedback': data.get('feedback', '')
        }

        letter_scores = data.get('letter_scores', {})
        if letter_scores:
            entry['weakest_letter'] = min(letter_scores, key=letter_scores.get)

        student_progress[student_name].append(entry)
        return jsonify({"message": "Progress saved", "entry": entry})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({
        "ml_model": ml_model is not None,
        "gemini_available": GEMINI_AVAILABLE,
        "tf_available": TF_AVAILABLE,
        "env_key_present": bool(os.environ.get('GEMINI_API_KEY'))
    })


# ============================================
# MAIN
# ============================================

if __name__ == '__main__':
    load_ml_model()
    app.run(debug=True, port=5000)
