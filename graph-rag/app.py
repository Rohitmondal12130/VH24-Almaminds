import os
import subprocess
from flask import Flask, request, jsonify
import httpx
import json

app = Flask(__name__)

client = httpx.AsyncClient(timeout=httpx.Timeout(10.0))  # Set to 10 seconds, adjust as needed

# Path to the GraphRAG root directory
GRAPH_RAG_ROOT = './ragtest'

FAILED_ATTEMPTS_THRESHOLD = 5

def run_combined_query(username):
    """
    Run a combined GraphRAG query to retrieve user behavior data.
    """
    query_command = f"python -m graphrag.query --root {GRAPH_RAG_ROOT} --method local \"{username}\""
    
    try:
        result = subprocess.check_output(query_command, shell=True, text=True).strip()
        return result
    except subprocess.CalledProcessError as e:
        print(f"Error querying GraphRAG: {e}")
        return None

def analyze_graphrag_response(response):
    """
    Analyze the response for failed login attempts and flag users if necessary.
    """
    # Log the response for debugging
    print("Response received from GraphRAG:", response)

    # Extract the number of failed login attempts from the response
    # Assuming response is a JSON string that needs to be parsed
    try:
        # Assuming the response is a JSON string
        response_data = json.loads(response)  # Use json.loads for safety
        print("Parsed response data:", response_data)
        failed_login_attempts = response_data.get("failedLoginAttempts", 0)

        # Check if failed login attempts exceed the threshold
        if failed_login_attempts > FAILED_ATTEMPTS_THRESHOLD:
            return jsonify({
                'status': 'additional_security_required',
                'message': 'Additional security required due to excessive failed login attempts.'
            }), 200
    except Exception as e:
        print(f"Error parsing response: {e}")

    return jsonify({
        'status': 'no_anomalies',
        'message': 'User behavior is normal.'
    }), 200


@app.route('/analyze_behavior', methods=['POST'])
def analyze_behavior():
    """
    Analyze user behavior based on failed login attempts from the request JSON.
    """
    user_data = request.json

    # Ensure the request has valid JSON
    if not user_data or 'failedLoginAttempts' not in user_data:
        return jsonify({
            'status': 'error',
            'message': 'Invalid input. Please provide failedLoginAttempts.'
        }), 400  # Bad request

    # Extract the number of failed login attempts from the request
    failed_login_attempts = user_data.get("failedLoginAttempts", 0)

    # Log the received input for debugging
    print("Received input data:", user_data)

    # Construct the response
    response = {}

    # Check if failed login attempts exceed the threshold
    if failed_login_attempts > FAILED_ATTEMPTS_THRESHOLD:
        response["status"] = "user is flagged!"
        response["message"] = "Additional security required due to excessive failed login attempts."
    else:
        response["status"] = "no_anomalies"
        response["message"] = "User behavior is normal."

    # Log the response for debugging
    print("Constructed response:", response)

    return jsonify(response), 200

@app.route('/index_behavior', methods=['POST'])
def index_behavior():
    """
    Index the existing data from deet.txt into GraphRAG without appending anything.
    """
    try:
        # Run the GraphRAG indexing command
        index_command = f"python -m graphrag.index --root {GRAPH_RAG_ROOT}"
        os.system(index_command)  # You can use subprocess if needed for more control
        
        return jsonify({
            'status': 'success',
            'message': 'Data from deet.txt indexed into GraphRAG successfully.'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error during indexing: {str(e)}'
        }), 500

if __name__ == '__main__':
    # Ensure the input directory exists
    os.makedirs(f"{GRAPH_RAG_ROOT}/input", exist_ok=True)

    # Run the Flask app
    app.run(debug=True)
