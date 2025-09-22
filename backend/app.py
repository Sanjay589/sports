import os
import tempfile
import cv2  # pyright: ignore[reportMissingImports]
import mediapipe as mp  # pyright: ignore[reportMissingImports]
import numpy as np  # pyright: ignore[reportMissingImports]
import hashlib
import secrets
import datetime
from flask import Flask, request, jsonify  # pyright: ignore[reportMissingImports]
from flask_cors import CORS  # pyright: ignore[reportMissingModuleSource]
from database import db

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize MediaPipe Pose
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

# Function to calculate angle between three points
def calculate_angle(a, b, c):
    """Calculate the angle between three points using dot product formula"""
    a = np.array(a)  # First point (e.g., shoulder)
    b = np.array(b)  # Mid point (e.g., hip)
    c = np.array(c)  # End point (e.g., knee)
    
    # Calculate vectors
    ba = a - b
    bc = c - b

    # Use dot product formula
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    # Clamp cosine_angle to avoid numerical errors
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
    angle = np.arccos(cosine_angle)
    
    return np.degrees(angle)

def analyze_sit_ups(video_path):
    """Analyze sit-ups in the video using MediaPipe pose detection"""
    sit_up_count = 0
    stage = None  # 'up' or 'down'
    valid_reps = 0
    feedback = []
    frame_count = 0
    total_frames = 0
    
    # First pass: count total frames
    cap = cv2.VideoCapture(video_path)
    while cap.isOpened():
        ret, _ = cap.read()
        if not ret:
            break
        total_frames += 1
    cap.release()
    
    # Second pass: analyze frames
    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        cap = cv2.VideoCapture(video_path)
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            
            # Convert the BGR image to RGB for MediaPipe
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            
            # Make detection
            results = pose.process(image)
            
            # Recolor back to BGR
            image.flags.writeable = True
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

            try:
                landmarks = results.pose_landmarks.landmark
                
                # Get coordinates for sit-up analysis
                # Using left side landmarks for consistency
                shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, 
                           landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
                hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x, 
                       landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
                knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x, 
                        landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
                
                # Calculate the hip angle (important for sit-ups)
                angle = calculate_angle(shoulder, hip, knee)
                
                # Sit-up counting logic
                if angle > 160:  # Threshold for the "down" stage (lying flat)
                    stage = "down"
                elif angle < 90 and stage == 'down':  # Threshold for the "up" stage (seated)
                    stage = "up"
                    sit_up_count += 1
                    valid_reps += 1  # For now, count all as valid
                    
                # Basic form analysis
                # Check if person is maintaining proper alignment
                shoulder_hip_distance = np.linalg.norm(np.array(shoulder) - np.array(hip))
                if shoulder_hip_distance > 0.3:  # Threshold for excessive movement
                    if len(feedback) < 3:  # Limit feedback messages
                        feedback.append("Keep your core engaged and maintain steady movement")
                
                # Check for consistent form
                if frame_count % 30 == 0:  # Check every 30 frames
                    if angle < 45:  # Very bent position
                        if len(feedback) < 3:
                            feedback.append("Try to maintain a more controlled movement")

            except (AttributeError, IndexError):
                # This handles frames where a person is not detected
                pass
        
        cap.release()
    
    # Calculate final score
    if sit_up_count > 0:
        form_score = min(100, (valid_reps / sit_up_count) * 100)
    else:
        form_score = 0
    
    return {
        'sit_up_count': sit_up_count,
        'form_score': int(form_score),
        'feedback': feedback[:3],  # Limit to 3 feedback items
        'total_frames': total_frames
    }

@app.route("/upload-video", methods=["POST"])
def upload_video():
    """Handle video upload and analysis"""
    tmp_path = None
    try:
        if 'video' not in request.files:
            return jsonify({"error": "No video file provided"}), 400
        
        f = request.files['video']
        if f.filename == '':
            return jsonify({"error": "No video file selected"}), 400
        
        # Save uploaded file temporarily
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
        tmp_path = tmp.name
        f.save(tmp_path)
        
        # Analyze the video
        analysis_result = analyze_sit_ups(tmp_path)
        
        # Prepare response
        response_message = f"You performed {analysis_result['sit_up_count']} sit-ups with a form score of {analysis_result['form_score']}%."
        
        if analysis_result['feedback']:
            response_message += " Tips: " + "; ".join(analysis_result['feedback'])
        
        return jsonify({
            "score": analysis_result['form_score'],
            "message": response_message,
            "sit_up_count": analysis_result['sit_up_count'],
            "feedback": analysis_result['feedback']
        })
        
    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500
    finally:
        # Clean up temporary file, regardless of whether analysis succeeded or failed
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "SAP - AI Sports Analysis Backend is running"})

# Authentication endpoints
@app.route("/register", methods=["POST"])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        email = data.get('email', '').strip()
        
        if not username or not password or not email:
            return jsonify({"success": False, "message": "All fields are required"}), 400
        
        if len(password) < 6:
            return jsonify({"success": False, "message": "Password must be at least 6 characters long"}), 400
        
        # Hash the password
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        
        # Check if user already exists
        check_user_query = "SELECT id FROM users WHERE username = ? OR email = ?"
        existing_user = db.execute_query(check_user_query, (username, email))
        
        if existing_user:
            return jsonify({"success": False, "message": "Username or email already exists"}), 400
        
        # Insert new user
        insert_user_query = """
        INSERT INTO users (username, password, email) 
        VALUES (?, ?, ?)
        """
        
        if db.execute_update(insert_user_query, (username, hashed_password, email)):
            return jsonify({"success": True, "message": "User registered successfully"})
        else:
            return jsonify({"success": False, "message": "Registration failed"}), 500
            
    except Exception as e:
        return jsonify({"success": False, "message": f"Registration error: {str(e)}"}), 500

@app.route("/complete-profile", methods=["POST"])
def complete_profile():
    """Complete user profile with detailed information"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({"success": False, "message": "User ID is required"}), 400
        
        # Extract profile data
        profile_data = {
            'first_name': data.get('first_name', '').strip(),
            'last_name': data.get('last_name', '').strip(),
            'age': data.get('age'),
            'gender': data.get('gender', '').strip(),
            'height': data.get('height'),
            'weight': data.get('weight'),
            'fitness_level': data.get('fitness_level', '').strip(),
            'health_issues': data.get('health_issues', '').strip(),
            'fitness_goals': data.get('fitness_goals', '').strip(),
            'emergency_contact': data.get('emergency_contact', '').strip(),
            'phone': data.get('phone', '').strip()
        }
        
        # Update user profile
        update_query = """
        UPDATE users SET 
            first_name = ?, last_name = ?, age = ?, gender = ?, 
            height = ?, weight = ?, fitness_level = ?, health_issues = ?, 
            fitness_goals = ?, emergency_contact = ?, phone = ?, 
            profile_completed = 1, updated_at = GETDATE()
        WHERE id = ?
        """
        
        if db.execute_update(update_query, (
            profile_data['first_name'], profile_data['last_name'], profile_data['age'],
            profile_data['gender'], profile_data['height'], profile_data['weight'],
            profile_data['fitness_level'], profile_data['health_issues'], 
            profile_data['fitness_goals'], profile_data['emergency_contact'],
            profile_data['phone'], user_id
        )):
            return jsonify({"success": True, "message": "Profile completed successfully"})
        else:
            return jsonify({"success": False, "message": "Failed to update profile"}), 500
            
    except Exception as e:
        return jsonify({"success": False, "message": f"Profile update error: {str(e)}"}), 500

@app.route("/get-user-profile/<int:user_id>", methods=["GET"])
def get_user_profile(user_id):
    """Get detailed user profile"""
    try:
        profile_query = """
        SELECT id, username, email, first_name, last_name, age, gender, 
               height, weight, fitness_level, health_issues, fitness_goals, 
               emergency_contact, phone, profile_completed, created_at
        FROM users WHERE id = ?
        """
        
        profile = db.execute_query(profile_query, (user_id,))
        
        if profile:
            return jsonify({"success": True, "profile": profile[0]})
        else:
            return jsonify({"success": False, "message": "User not found"}), 404
            
    except Exception as e:
        return jsonify({"success": False, "message": f"Profile fetch error: {str(e)}"}), 500

@app.route("/login", methods=["POST"])
def login():
    """Login user"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        if not username or not password:
            return jsonify({"success": False, "message": "Username and password are required"}), 400
        
        # Hash the password
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        
        # Check user credentials
        login_query = "SELECT id, username, email FROM users WHERE username = ? AND password = ?"
        user = db.execute_query(login_query, (username, hashed_password))
        
        if user:
            # Create session token
            session_token = secrets.token_urlsafe(32)
            expires_at = datetime.datetime.now() + datetime.timedelta(hours=24)
            
            # Store session
            session_query = """
            INSERT INTO user_sessions (user_id, session_token, expires_at) 
            VALUES (?, ?, ?)
            """
            
            if db.execute_update(session_query, (user[0]['id'], session_token, expires_at)):
                return jsonify({
                    "success": True, 
                    "message": "Login successful",
                    "user": {
                        "id": user[0]['id'],
                        "username": user[0]['username'],
                        "email": user[0]['email']
                    },
                    "session_token": session_token
                })
            else:
                return jsonify({"success": False, "message": "Session creation failed"}), 500
        else:
            return jsonify({"success": False, "message": "Invalid username or password"}), 401
            
    except Exception as e:
        return jsonify({"success": False, "message": f"Login error: {str(e)}"}), 500

@app.route("/logout", methods=["POST"])
def logout():
    """Logout user"""
    try:
        data = request.get_json()
        session_token = data.get('session_token', '')
        
        if session_token:
            # Remove session
            logout_query = "DELETE FROM user_sessions WHERE session_token = ?"
            db.execute_update(logout_query, (session_token,))
        
        return jsonify({"success": True, "message": "Logged out successfully"})
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Logout error: {str(e)}"}), 500

@app.route("/save-exercise-session", methods=["POST"])
def save_exercise_session():
    """Save exercise session data"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        exercise_type = data.get('exercise_type', 'sit-ups')
        video_path = data.get('video_path', '')
        sit_up_count = data.get('sit_up_count', 0)
        form_score = data.get('form_score', 0)
        feedback = data.get('feedback', '')
        
        if not user_id:
            return jsonify({"success": False, "message": "User ID is required"}), 400
        
        # Save exercise session
        save_query = """
        INSERT INTO exercise_sessions (user_id, exercise_type, video_path, sit_up_count, form_score, feedback) 
        VALUES (?, ?, ?, ?, ?, ?)
        """
        
        if db.execute_update(save_query, (user_id, exercise_type, video_path, sit_up_count, form_score, feedback)):
            return jsonify({"success": True, "message": "Exercise session saved successfully"})
        else:
            return jsonify({"success": False, "message": "Failed to save exercise session"}), 500
            
    except Exception as e:
        return jsonify({"success": False, "message": f"Save error: {str(e)}"}), 500

@app.route("/get-user-history/<int:user_id>", methods=["GET"])
def get_user_history(user_id):
    """Get user's exercise history"""
    try:
        history_query = """
        SELECT exercise_type, sit_up_count, form_score, feedback, created_at 
        FROM exercise_sessions 
        WHERE user_id = ? 
        ORDER BY created_at DESC
        """
        
        history = db.execute_query(history_query, (user_id,))
        
        if history is not None:
            return jsonify({"success": True, "history": history})
        else:
            return jsonify({"success": False, "message": "Failed to retrieve history"}), 500
            
    except Exception as e:
        return jsonify({"success": False, "message": f"History error: {str(e)}"}), 500

if __name__ == "__main__":
    # Initialize database tables
    print("🔧 Initializing database...")
    db.initialize_database()
    
    print("Starting SAP - AI Sports Analysis Backend...")
    print("Make sure you have installed the required dependencies:")
    print("pip install -r requirements.txt")
    app.run(host="0.0.0.0", port=5000, debug=True)
