# Resume Lift: AI-Powered Resume Analyzer

Resume Lift is a web application designed to help job seekers improve their resumes by providing instant, AI-driven feedback. This tool analyzes resume content for clarity, impact, and structure, offering actionable suggestions to help users create a more compelling and effective resume.

## Key Features

- **Minimalist UI**: A clean, intuitive interface for a seamless user experience.
- **Secure API Key Handling**: Users can securely use their own OpenRouter API key, which is stored only in their browser's local storage and never on the server.
- **Multiple File Formats**: Supports `.pdf`, `.txt`, and `.docx` resume files.
- **Comprehensive Feedback**: Delivers a detailed analysis including an overall score, specific strengths, and areas for improvement.
- **Downloadable Reports**: Users can download their feedback as a formatted PDF report.
- **Privacy First**: Resumes are processed in memory and are never stored on the server, ensuring user privacy.

## Technologies Used

- **Backend**: Python, Flask
- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **AI Integration**: OpenRouter API
- **File Handling**: `python-docx`, `PyMuPDF`

## Local Setup & Installation

To run this project locally, follow these steps:

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/gagekirton/resume-lift.git
    cd resume-lift
    ```

2.  **Create and Activate a Virtual Environment**

    ```bash
    # For macOS/Linux
    python3 -m venv venv
    source venv/bin/activate

    # For Windows
    python -m venv venv
    .\venv\Scripts\activate
    ```

3.  **Install Dependencies**

    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the Application**

    ```bash
    python run.py
    ```

5.  Open your browser and navigate to `http://127.0.0.1:5000`.

## Configuration

The application can be used with a default server-side API key for demonstration purposes. For extended use, you can add your own OpenRouter API key directly in the UI. Click the "Use Custom API Key" link to enter your key.
