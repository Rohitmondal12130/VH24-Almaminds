Sure! Here's the updated README section with additional small details integrated to make the flow and context clearer, as requested:

---

# Authenticate Me

**Authenticate Me** is a multi-layered authentication platform that combines industry-standard security protocols with advanced behavioral analysis. Our system utilizes OTP-based verification via **Twilio**, a personalized **Master Safety Phrase**, and **GraphRAG** for real-time behavioral analysis. We ensure both security and user-friendliness through seamless API integrations.

Additionally, **GraphRAG** integrates with **Neo4j** to track behavioral patterns, alerting administrators to anomalies in user activity. Open-source **LLM models from Hugging Face** are utilized for the behavioral checks, optimizing cost while ensuring security remains uncompromised.

---

## API Usage

The **Authenticate Me** API provides easy integration for any system requiring strong user authentication. The API endpoints return JSON responses and can be incorporated into most platforms through HTTP requests.

### 1. **User Sign-Up**

**Endpoint**: `/api/signup`  
**Method**: `POST`  
**Description**: This endpoint registers a new user. An OTP is sent to the user’s phone number via **Twilio** for verification. Along with the OTP, the user receives a unique **Master Safety Phrase** to be used for password recovery and advanced verification.

**Request Body**:
```json
{
    "username": "Bhoomika Singh",
    "phone": "+912345678900",
    "email": "test@gmail.com"
}
```

**Response**:
```json
{
    "message": "OTP sent successfully to +912345678900 along with the Master Phrase"
}
```

**Sample Twilio OTP Message**:
```
Sent from your Twilio trial account - Please note this customized phrase for future password recovery: "The whirling Phoenix flickers the machine"
```

- **Master Safety Phrase**: A one-time phrase sent to the user’s phone or email. This phrase must be securely noted by the user for password recovery or additional verification in the future.
  
### 2. **Login**

**Endpoint**: `/api/login`  
**Method**: `POST`  
**Description**: Authenticates the user using a one-time password (OTP) sent via **Twilio**. If the system detects suspicious activity, it may ask the user for the **Master Phrase** instead of an OTP. 

**Request Body**:
```json
{
    "username": "Bhoomika Singh",
    "otp": "394837"
}
```

**Response**:
```json
{
    "message": "Login successful",
    "metadata": {
        "session_duration": "30 minutes",
        "device_info": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0.0.0"
    }
}
```

- **Behavioral Analysis**: **GraphRAG** flags irregularities in login behavior (e.g., logins from multiple devices or locations). If flagged, the user may be required to enter their **Master Phrase** for verification.

### 3. **Forgot Password**

**Endpoint**: `/api/forgot-password`  
**Method**: `POST`  
**Description**: The user provides their **Master Safety Phrase** to reset their password. Upon verification, a reset link will be sent to their registered email.

**Request Body**:
```json
{
    "username": "Bhoomika Singh",
    "MASTER_Phrase": "The whirling Phoenix flickers the machine"
}
```

**Response**:
```json
{
    "message": "Password reset link sent to your phone while signing up, we got you if you forget your password!"
}
```

---
### 4. **Verify OTP**

**Endpoint**: `/api/verify-otp`  
**Method**: `POST`  
**Description**: Verifies the OTP sent to the user's phone number for authentication.

**Request**:
```bash
POST /api/verify-otp
{
    "username": "Bhoomika Singh",
    "otp": "GeneratedRandomOTP"
}
```

**Response**:
```json
{
    "message": "OTP verified successfully",
    "status": "success"
}
```



---


## Metadata for Behavioral Analysis

**Authenticate Me** tracks detailed metadata for every user action, providing the **GraphRAG** system with the information needed to detect anomalies. This metadata is also crucial for the real-time monitoring offered by **Neo4j**'s graph database.

### Example Metadata JSON for Analysis:

```json
{
    "username": "rohityu@gmail.com",
    "action": "Login",
    "ipAddress": "103.134.7.130",
    "deviceInfo": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    "location": "Mumbai, IN",
    "failedLoginAttempts": 1,
    "lastFailedLogin": "Sat Oct 05 2024 00:12:41 GMT+0530 (India Standard Time)",
    "isBlocked": false,
    "sessionDuration": "undefined"
}
```

### Metadata Parameters:

- **username**: The user's registered email or username (e.g., `rohityu@gmail.com`).
- **action**: The action performed by the user, such as signing up or logging in (e.g., `Login`).
- **ipAddress**: The IP address from which the action was performed (e.g., `103.134.7.130`).
- **deviceInfo**: Information about the user's device, including the OS, browser version, etc.
- **location**: The geographical location inferred from the user's IP address (e.g., `Mumbai, IN`).
- **failedLoginAttempts**: The number of unsuccessful login attempts before the current action.
- **lastFailedLogin**: The timestamp of the last failed login attempt.
- **isBlocked**: Indicates whether the user account is temporarily blocked due to excessive failed login attempts.
- **sessionDuration**: The duration of the current user session. For a newly signed-up user, this will show as `"undefined"`.

---

## Why Metadata is Crucial for **GraphRAG** and Behavioral Monitoring:

- **Behavior Tracking**: By capturing critical data such as login locations, device changes, and failed login attempts, **GraphRAG** can detect unusual patterns. For instance, if multiple failed login attempts occur from different locations within a short period, the system will flag the account for potential fraud, Admins are notified of flagged suspicious activities.
  
- **Graph Visualization**: **Neo4j** graphically represents behavior over time, allowing administrators to spot suspicious activity more easily. Clusters of related activities are represented as nodes, helping identify abnormal behaviors or common attack vectors, The dashboard presents user activity in an intuitive node-based format, allowing for easy monitoring.

## Technologies Used:
- *Twilio API* for OTP services
- *Neo4jDB* for knowledge graph database and visualization
- *GraphRAG* for behavioral analysis
- *Hugging Face Libraries* for integrating language models
- *Custom Master Phrase Algorithm* for unique recovery phrases

---

## How It Works:

1. *Sign Up*: 
    - Users sign up, receiving an OTP via SMS for verification.
    - A *Master Phrase* is generated and sent via Twilio SMS for recovery use.

2. *Login*:
    - Users log in with credentials and the OTP sent to their phone.

3. *Behavioral Monitoring*:
    - *GraphRAG* continuously monitors login attempts and behaviors.
    - Suspicious actions such as multiple failed logins are flagged, and re-authentication via Master Phrase may be required.

4. *Admin Dashboard*:
    - Administrators can visualize flagged accounts and user activities.
    - The dashboard enables monitoring of user relationships, failed attempts, and suspicious behavior.

5. *Incident Response*:
   - When malicious behavior is detected, the admin panel allows rapid investigation and action, including alerting users or blocking accounts.

---

## Installation & Setup

1. Clone the repository:
    bash
    git clone [https://github.com/your-repo/authenticate-me.git](https://github.com/Rohitmondal12130/VH24-Almaminds.git]
    

2. Install dependencies:
    bash
    pip install -r requirements.txt
    

3. Setup environment variables:
    - Configure Twilio API keys.
    - Set up your Neo4j database credentials.
    - Set API Gateway base URLs if necessary.

4. Run the server:
    bash
    python app.py
    

---

## Conclusion
*Authenticate Me* offers a highly secure multi-factor authentication solution that leverages OTP, behavioral analysis, and Master Phrase recovery. Features like real-time phishing detection and Neo4jDB visualizations for administrators provide robust security, ensuring both user safety and ease of account recovery.
