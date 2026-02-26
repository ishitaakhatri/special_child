"""
Special Child Writing Helper with Integrated LLM Layer
=======================================================
This version uses Gemini's vision capabilities to analyze handwriting images,
either as the primary analyzer or to enhance your TensorFlow model predictions.
"""

import streamlit as st
import tensorflow as tf
from tensorflow import keras
import numpy as np
import pandas as pd
import cv2
from PIL import Image
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime
import json
import os
from collections import Counter
import base64
from io import BytesIO

# Try to import Gemini
try:
    from google import genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

# Page config
st.set_page_config(
    page_title="Special Child Writing Helper 🌈",
    page_icon="✏️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .stApp { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .student-card {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        padding: 20px; border-radius: 20px; margin: 10px;
        color: white; text-align: center;
    }
    h1, h2, h3 { color: #ffffff !important; }
    .analysis-box {
        background: rgba(255,255,255,0.95); padding: 20px;
        border-radius: 15px; margin: 10px 0;
    }
    .llm-response {
        background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
        padding: 20px; border-radius: 15px; margin: 10px 0;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
for key, default in [
    ('authenticated', False), ('teacher_name', ''), ('selected_student', None),
    ('student_progress', {}), ('chat_history', []), ('api_key', ''),
    ('analysis_mode', 'hybrid')  # 'ml_only', 'llm_only', 'hybrid'
]:
    if key not in st.session_state:
        st.session_state[key] = default


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

@st.cache_data
def load_student_data():
    return [
        {'name': 'Aaru', 'disability': 'MR', 'iq': 42, 'disability_percentage': 75, 'age': 10},
        {'name': 'Akash', 'disability': 'ID', 'iq': 38, 'disability_percentage': 75, 'age': 6},
        {'name': 'Chirag', 'disability': 'Severe MR', 'iq': 24, 'disability_percentage': 90, 'age': 24},
        {'name': 'Gagan', 'disability': 'CP', 'iq': 35, 'disability_percentage': 75, 'age': 25},
        {'name': 'Gargi', 'disability': 'CP', 'iq': 40, 'disability_percentage': 85, 'age': 17},
        {'name': 'Manoj', 'disability': 'Severe ID', 'iq': 20, 'disability_percentage': 90, 'age': 35},
        {'name': 'Mayur', 'disability': 'ID', 'iq': 40, 'disability_percentage': 85, 'age': 10},
        {'name': 'Meet', 'disability': 'Moderate MR', 'iq': 36, 'disability_percentage': 70, 'age': 20},
        {'name': 'Monika', 'disability': 'Severe MR', 'iq': 26, 'disability_percentage': 90, 'age': 14},
        {'name': 'Parul', 'disability': 'Moderate ID', 'iq': 42, 'disability_percentage': 75, 'age': 32},
        {'name': 'Prateek', 'disability': 'CP', 'iq': 24, 'disability_percentage': 90, 'age': 28},
        {'name': 'Preetam', 'disability': 'CP', 'iq': 35, 'disability_percentage': 90, 'age': 20},
        {'name': 'Rahul', 'disability': 'MR', 'iq': 48, 'disability_percentage': 80, 'age': 14},
        {'name': 'Samarth', 'disability': 'MR', 'iq': 48, 'disability_percentage': 80, 'age': 14},
        {'name': 'Sneha', 'disability': 'ID', 'iq': 24, 'disability_percentage': 90, 'age': 22},
        {'name': 'Sunny', 'disability': 'Severe CP', 'iq': 20, 'disability_percentage': 80, 'age': 18}
    ]


# ============================================
# MODEL LOADING (TensorFlow)
# ============================================

@st.cache_resource
def load_ml_model():
    """Load the trained TensorFlow model"""
    model_paths = ['model.h5', 'model.keras', 'saved_model', 'models/model.h5']
    
    for path in model_paths:
        if os.path.exists(path):
            try:
                model = keras.models.load_model(path, compile=False)
                return model
            except Exception as e:
                continue
    return None


# ============================================
# LLM LAYER - GEMINI VISION INTEGRATION
# ============================================

def image_to_base64(image):
    """Convert PIL Image to base64 string"""
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()


def analyze_with_gemini_vision(image, student_data, api_key):
    """
    Use Gemini's vision capabilities to analyze handwriting.
    This is the core LLM layer integration.
    """
    if not GEMINI_AVAILABLE or not api_key:
        return None
    
    try:
        client = genai.Client(api_key=api_key)
        
        # Convert image to format Gemini can use
        if isinstance(image, np.ndarray):
            image = Image.fromarray(image)
        
        # Create detailed prompt for handwriting analysis
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
        
        # Send image to Gemini
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt, image]
        )
        
        # Parse the response
        response_text = response.text.strip()
        
        # Clean up response (remove markdown code blocks if present)
        if response_text.startswith('```'):
            response_text = response_text.split('```')[1]
            if response_text.startswith('json'):
                response_text = response_text[4:]
        response_text = response_text.strip()
        
        # Parse JSON
        result = json.loads(response_text)
        return result
        
    except json.JSONDecodeError as e:
        st.warning(f"Could not parse LLM response as JSON: {str(e)}")
        return {"error": "JSON parsing failed", "raw_response": response_text}
    except Exception as e:
        st.error(f"Gemini Vision Error: {str(e)}")
        return None


def get_teaching_recommendations(student_data, analysis_result, api_key):
    """Get personalized teaching recommendations based on analysis"""
    if not GEMINI_AVAILABLE or not api_key:
        return None
    
    try:
        client = genai.Client(api_key=api_key)
        
        prompt = f"""You are a special education expert. Based on this handwriting analysis, provide teaching recommendations.

STUDENT PROFILE:
- Name: {student_data['name']}
- Age: {student_data['age']}
- Disability: {student_data['disability']}
- IQ: {student_data['iq']}

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
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        return response.text
        
    except Exception as e:
        return f"Error getting recommendations: {str(e)}"


# ============================================
# ML MODEL PREDICTION
# ============================================

def predict_with_ml_model(model, image):
    """Use TensorFlow model for prediction"""
    try:
        if model is None:
            return None
        
        # Preprocess
        if isinstance(image, Image.Image):
            image = np.array(image)
        
        if len(image.shape) == 2:
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
        elif image.shape[2] == 4:
            image = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)
        
        input_shape = model.input_shape
        target_size = (input_shape[1], input_shape[2]) if input_shape[1] else (128, 128)
        
        image = cv2.resize(image, target_size)
        image = image.astype(np.float32) / 255.0
        image = np.expand_dims(image, axis=0)
        
        predictions = model.predict(image, verbose=0)
        top_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][top_idx] * 100)
        
        predicted_word = CLASS_LABELS[top_idx] if top_idx < len(CLASS_LABELS) else f"CLASS_{top_idx}"
        
        return {
            "detected_word": predicted_word,
            "confidence": confidence,
            "all_predictions": predictions[0]
        }
    except Exception as e:
        st.error(f"ML Model Error: {str(e)}")
        return None


# ============================================
# HYBRID ANALYSIS (ML + LLM)
# ============================================

def hybrid_analysis(image, student_data, ml_model, api_key):
    """
    Combine ML model prediction with LLM analysis for best results.
    This is the main integration point.
    """
    results = {
        "ml_result": None,
        "llm_result": None,
        "final_prediction": None,
        "confidence": 0,
        "letter_scores": {},
        "feedback": "",
        "recommendations": []
    }
    
    # Step 1: Get ML model prediction
    if ml_model is not None:
        ml_result = predict_with_ml_model(ml_model, image)
        if ml_result:
            results["ml_result"] = ml_result
    
    # Step 2: Get LLM analysis
    if api_key and GEMINI_AVAILABLE:
        llm_result = analyze_with_gemini_vision(image, student_data, api_key)
        if llm_result and "error" not in llm_result:
            results["llm_result"] = llm_result
    
    # Step 3: Combine results
    if results["llm_result"]:
        # LLM provides richer analysis
        llm = results["llm_result"]
        results["final_prediction"] = llm.get("detected_word", "UNKNOWN")
        results["confidence"] = llm.get("confidence", 0)
        
        # Extract letter scores
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
        # Fall back to ML model only
        ml = results["ml_result"]
        results["final_prediction"] = ml["detected_word"]
        results["confidence"] = ml["confidence"]
        
        # Generate letter scores from ML confidence
        for letter in set(ml["detected_word"]):
            variation = np.random.uniform(-15, 15)
            results["letter_scores"][letter] = max(0, min(100, ml["confidence"] + variation))
        
        results["feedback"] = "Analysis based on ML model. Enable Gemini API for detailed feedback."
    
    else:
        # Demo mode
        results["final_prediction"] = np.random.choice(CLASS_LABELS)
        results["confidence"] = np.random.uniform(60, 90)
        for letter in set(results["final_prediction"]):
            results["letter_scores"][letter] = np.random.uniform(50, 95)
        results["feedback"] = "Demo mode - no model or API key configured."
    
    return results


# ============================================
# UI COMPONENTS
# ============================================

def display_analysis_results(results, student):
    """Display the analysis results in a nice format"""
    
    st.markdown("### 🔍 Analysis Results")
    
    # Main prediction
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("📝 Detected Word", results["final_prediction"])
    with col2:
        st.metric("📊 Confidence", f"{results['confidence']:.1f}%")
    with col3:
        mode = "🤖 Hybrid" if results["llm_result"] else ("🧠 ML Only" if results["ml_result"] else "🎭 Demo")
        st.metric("Mode", mode)
    
    # Source comparison (if both available)
    if results["ml_result"] and results["llm_result"]:
        st.markdown("#### 🔄 Model Comparison")
        col1, col2 = st.columns(2)
        with col1:
            st.info(f"**ML Model:** {results['ml_result']['detected_word']} ({results['ml_result']['confidence']:.1f}%)")
        with col2:
            st.success(f"**Gemini Vision:** {results['llm_result'].get('detected_word', 'N/A')} ({results['llm_result'].get('confidence', 0)}%)")
    
    # Letter-wise analysis
    if results["letter_scores"]:
        st.markdown("#### 📊 Letter-by-Letter Analysis")
        
        letters = list(results["letter_scores"].keys())
        scores = list(results["letter_scores"].values())
        
        # Find weakest
        min_score = min(scores) if scores else 0
        
        fig = go.Figure(data=[
            go.Bar(
                x=letters,
                y=scores,
                marker_color=['#f5576c' if s == min_score else '#667eea' for s in scores],
                text=[f"{s:.0f}%" for s in scores],
                textposition='auto'
            )
        ])
        fig.update_layout(
            yaxis_range=[0, 100],
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(255,255,255,0.9)',
            height=350
        )
        st.plotly_chart(fig, use_container_width=True)
        
        # Letter feedback from LLM
        if results["llm_result"] and "letter_analysis" in results["llm_result"]:
            st.markdown("#### 📝 Detailed Letter Feedback")
            letter_analysis = results["llm_result"]["letter_analysis"]
            for letter, data in letter_analysis.items():
                if isinstance(data, dict) and "feedback" in data:
                    score = data.get("score", 0)
                    emoji = "✅" if score >= 70 else "⚠️" if score >= 50 else "❌"
                    st.markdown(f"{emoji} **{letter}** ({score}%): {data['feedback']}")
    
    # Overall feedback
    if results.get("feedback"):
        st.markdown("#### 💬 Overall Feedback")
        st.markdown(f"""
        <div class="llm-response">
            {results['feedback']}
        </div>
        """, unsafe_allow_html=True)
    
    # Motor skill observations
    if results.get("motor_observations"):
        st.markdown("#### 🖐️ Motor Skill Observations")
        st.info(results["motor_observations"])
    
    # Recommendations
    if results.get("recommendations"):
        st.markdown("#### 🎯 Practice Recommendations")
        for i, rec in enumerate(results["recommendations"], 1):
            st.markdown(f"{i}. {rec}")


def upload_section(student, ml_model):
    """Image upload and analysis section"""
    st.markdown("### ✏️ Upload Student's Writing")
    
    # Analysis mode selector
    col1, col2 = st.columns([2, 1])
    with col1:
        mode = st.radio(
            "Analysis Mode:",
            ["🤖 Hybrid (ML + LLM)", "🧠 ML Model Only", "🔮 LLM Only (Gemini Vision)"],
            horizontal=True,
            help="Hybrid combines both for best results"
        )
    
    with col2:
        # Status indicators
        ml_status = "✅" if ml_model else "❌"
        llm_status = "✅" if st.session_state.api_key else "❌"
        st.markdown(f"**ML Model:** {ml_status} | **Gemini API:** {llm_status}")
    
    # File uploader
    uploaded_file = st.file_uploader(
        "Choose an image of student's handwriting",
        type=['png', 'jpg', 'jpeg'],
        help="Upload a clear image of the student's writing"
    )
    
    if uploaded_file:
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("#### 📷 Uploaded Image")
            image = Image.open(uploaded_file)
            st.image(image, use_container_width=True)
        
        with col2:
            if st.button("🔍 Analyze Writing", use_container_width=True, type="primary"):
                with st.spinner("🔮 Analyzing handwriting..."):
                    
                    # Determine which analysis to run
                    if "Hybrid" in mode:
                        results = hybrid_analysis(
                            image, student, ml_model, st.session_state.api_key
                        )
                    elif "ML Model" in mode:
                        ml_result = predict_with_ml_model(ml_model, image)
                        results = {
                            "ml_result": ml_result,
                            "llm_result": None,
                            "final_prediction": ml_result["detected_word"] if ml_result else "N/A",
                            "confidence": ml_result["confidence"] if ml_result else 0,
                            "letter_scores": {},
                            "feedback": "ML model analysis only."
                        }
                        if ml_result:
                            for letter in set(ml_result["detected_word"]):
                                results["letter_scores"][letter] = ml_result["confidence"] + np.random.uniform(-15, 15)
                    else:  # LLM Only
                        llm_result = analyze_with_gemini_vision(image, student, st.session_state.api_key)
                        results = {
                            "ml_result": None,
                            "llm_result": llm_result,
                            "final_prediction": llm_result.get("detected_word", "N/A") if llm_result else "N/A",
                            "confidence": llm_result.get("confidence", 0) if llm_result else 0,
                            "letter_scores": {},
                            "feedback": llm_result.get("overall_feedback", "") if llm_result else ""
                        }
                        if llm_result and "letter_analysis" in llm_result:
                            for letter, data in llm_result["letter_analysis"].items():
                                results["letter_scores"][letter] = data.get("score", 50) if isinstance(data, dict) else data
                    
                    # Store in session for display
                    st.session_state.last_analysis = results
        
        # Display results if available
        if hasattr(st.session_state, 'last_analysis') and st.session_state.last_analysis:
            results = st.session_state.last_analysis
            
            st.markdown("---")
            display_analysis_results(results, student)
            
            # Get teaching recommendations button
            if results.get("llm_result") and st.session_state.api_key:
                st.markdown("---")
                if st.button("🎓 Get Personalized Teaching Strategies", use_container_width=True):
                    with st.spinner("Generating recommendations..."):
                        recommendations = get_teaching_recommendations(
                            student, results["llm_result"], st.session_state.api_key
                        )
                        if recommendations:
                            st.markdown("### 🎓 Teaching Strategies")
                            st.markdown(f"""
                            <div class="llm-response">
                                {recommendations}
                            </div>
                            """, unsafe_allow_html=True)
            
            # Save progress button
            if st.button("💾 Save Progress", use_container_width=True):
                save_progress(student['name'], results)
                st.success("✅ Progress saved!")


def save_progress(student_name, results):
    """Save analysis to progress history"""
    if student_name not in st.session_state.student_progress:
        st.session_state.student_progress[student_name] = []
    
    entry = {
        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        'predicted_word': results.get("final_prediction", "N/A"),
        'confidence': results.get("confidence", 0),
        'letter_scores': results.get("letter_scores", {}),
        'weakest_letter': min(results.get("letter_scores", {"": 100}), 
                            key=results.get("letter_scores", {"": 100}).get) if results.get("letter_scores") else "",
        'feedback': results.get("feedback", "")
    }
    
    st.session_state.student_progress[student_name].append(entry)


# ============================================
# PAGE FUNCTIONS
# ============================================

def authentication_page():
    st.title("🎨 Special Child Writing Helper")
    st.markdown("### 👩‍🏫 Teacher Login")
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        teacher_name = st.text_input("👤 Your Name", placeholder="Enter your name")
        if st.button("🚀 Login", use_container_width=True):
            if teacher_name.strip():
                st.session_state.authenticated = True
                st.session_state.teacher_name = teacher_name.strip()
                st.rerun()


def student_selection_page():
    st.title(f"👋 Welcome, {st.session_state.teacher_name}!")
    
    # Sidebar with settings
    with st.sidebar:
        st.markdown("### ⚙️ Settings")
        if st.button("🚪 Logout", use_container_width=True):
            st.session_state.authenticated = False
            st.rerun()
        
        st.markdown("---")
        st.markdown("### 🔑 Gemini API Key")
        api_key = st.text_input(
            "Enter API Key",
            type="password",
            value=st.session_state.api_key,
            help="Get from: https://aistudio.google.com/apikey"
        )
        if api_key:
            st.session_state.api_key = api_key
            st.success("✅ API Key configured!")
        
        st.markdown("---")
        st.markdown("### 📊 System Status")
        ml_model = load_ml_model()
        st.write(f"ML Model: {'✅ Loaded' if ml_model else '❌ Not found'}")
        st.write(f"Gemini: {'✅ Available' if GEMINI_AVAILABLE else '❌ Not installed'}")
        st.write(f"API Key: {'✅ Set' if st.session_state.api_key else '❌ Not set'}")
    
    # Student grid
    st.markdown("### 🎯 Select a Student")
    students = load_student_data()
    
    cols_per_row = 4
    for i in range(0, len(students), cols_per_row):
        cols = st.columns(cols_per_row)
        for j, student in enumerate(students[i:i+cols_per_row]):
            with cols[j]:
                emoji_map = {"MR": "🧠", "ID": "💙", "CP": "💚", "Severe MR": "🧩", 
                           "Severe ID": "💜", "Moderate MR": "🎯", "Moderate ID": "🌟", "Severe CP": "💖"}
                emoji = emoji_map.get(student['disability'], "👤")
                
                st.markdown(f"""
                <div class='student-card'>
                    <h3>{emoji} {student['name']}</h3>
                    <p>Age: {student['age']} | {student['disability']}</p>
                </div>
                """, unsafe_allow_html=True)
                
                if st.button(f"Select", key=f"btn_{student['name']}", use_container_width=True):
                    st.session_state.selected_student = student
                    st.rerun()


def student_dashboard():
    student = st.session_state.selected_student
    ml_model = load_ml_model()
    
    # Sidebar
    with st.sidebar:
        if st.button("⬅️ Back", use_container_width=True):
            st.session_state.selected_student = None
            st.session_state.last_analysis = None
            st.rerun()
        
        st.markdown("---")
        st.markdown("### 🔑 API Key")
        api_key = st.text_input(
            "Gemini API Key",
            type="password",
            value=st.session_state.api_key,
            key="sidebar_api_key"
        )
        if api_key:
            st.session_state.api_key = api_key
        
        st.markdown("---")
        st.markdown("### 📊 Status")
        st.write(f"ML: {'✅' if ml_model else '❌'}")
        st.write(f"LLM: {'✅' if st.session_state.api_key else '❌'}")
    
    # Header
    st.title(f"📊 {student['name']}'s Dashboard")
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("👤 Age", f"{student['age']} yrs")
    with col2:
        st.metric("🧠 IQ", student['iq'])
    with col3:
        st.metric("📋 Type", student['disability'])
    with col4:
        st.metric("📈 Level", f"{student['disability_percentage']}%")
    
    # Tabs
    tab1, tab2, tab3 = st.tabs(["📸 Upload & Analyze", "📈 Progress", "💬 AI Chat"])
    
    with tab1:
        upload_section(student, ml_model)
    
    with tab2:
        progress_section(student)
    
    with tab3:
        chat_section(student)


def progress_section(student):
    """Show student progress"""
    st.markdown("### 📈 Progress History")
    
    student_name = student['name']
    progress = st.session_state.student_progress.get(student_name, [])
    
    if progress:
        df = pd.DataFrame(progress)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Metrics
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("📝 Sessions", len(df))
        with col2:
            st.metric("📊 Avg Accuracy", f"{df['confidence'].mean():.1f}%")
        with col3:
            if len(df) >= 2:
                change = df['confidence'].iloc[-1] - df['confidence'].iloc[0]
                st.metric("📈 Change", f"{change:+.1f}%")
        
        # Chart
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=df['timestamp'], y=df['confidence'],
            mode='lines+markers',
            line=dict(color='#667eea', width=3),
            fill='tozeroy'
        ))
        fig.update_layout(
            yaxis_range=[0, 100],
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(255,255,255,0.9)',
            height=350
        )
        st.plotly_chart(fig, use_container_width=True)
        
        # Recent entries
        st.markdown("#### 📋 Recent Sessions")
        for entry in reversed(progress[-5:]):
            st.markdown(f"**{entry['timestamp']}** - {entry['predicted_word']} ({entry['confidence']:.1f}%)")
    else:
        st.info("No progress data yet. Upload writing samples to start tracking!")


def chat_section(student):
    """Chat with AI about the student"""
    st.markdown("### 💬 AI Teaching Assistant")
    
    if not st.session_state.api_key:
        st.warning("⚠️ Set your Gemini API key in the sidebar to chat with AI.")
        return
    
    # Display chat history
    for msg in st.session_state.chat_history:
        if msg['role'] == 'user':
            st.markdown(f"**👩‍🏫 You:** {msg['content']}")
        else:
            st.markdown(f"""
            <div class="llm-response">
                <strong>🤖 AI:</strong> {msg['content']}
            </div>
            """, unsafe_allow_html=True)
    
    # Chat input
    user_input = st.text_input("Ask about teaching strategies, activities, etc.", key="chat_input")
    
    col1, col2 = st.columns([3, 1])
    with col1:
        if st.button("📤 Send", use_container_width=True) and user_input:
            st.session_state.chat_history.append({'role': 'user', 'content': user_input})
            
            # Get AI response
            try:
                client = genai.Client(api_key=st.session_state.api_key)
                
                progress = st.session_state.student_progress.get(student['name'], [])
                
                prompt = f"""You are a special education teaching assistant.

STUDENT: {student['name']}, Age {student['age']}, {student['disability']}, IQ {student['iq']}
PROGRESS ENTRIES: {len(progress)}
RECENT WORDS: {[p['predicted_word'] for p in progress[-5:]] if progress else 'None yet'}

TEACHER'S QUESTION: {user_input}

Provide helpful, practical advice. Be concise."""

                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt
                )
                st.session_state.chat_history.append({'role': 'assistant', 'content': response.text})
                st.rerun()
                
            except Exception as e:
                st.error(f"Error: {str(e)}")
    
    with col2:
        if st.button("🗑️ Clear", use_container_width=True):
            st.session_state.chat_history = []
            st.rerun()


# ============================================
# MAIN
# ============================================

def main():
    try:
        if not st.session_state.authenticated:
            authentication_page()
        elif st.session_state.selected_student is None:
            student_selection_page()
        else:
            student_dashboard()
    except Exception as e:
        st.error(f"Error: {str(e)}")
        import traceback
        with st.expander("Details"):
            st.code(traceback.format_exc())


if __name__ == "__main__":
    main()