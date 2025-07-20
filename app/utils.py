import os
import io
import PyPDF2
import magic
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure OpenRouter API
openai.api_key = "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"  # Your OpenRouter API key
openai.api_base = "https://openrouter.ai/api/v1"  # Point to OpenRouter API

def allowed_file(filename):
    """Check if the file has an allowed extension."""
    ALLOWED_EXTENSIONS = {'pdf', 'txt', 'docx'}
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(file):
    """Extract text from a PDF file."""
    try:
        pdf_reader = PyPDF2.PdfReader(file)
        text = ""
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            text += page.extract_text() + "\n\n"
        return text.strip()
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")

def extract_text_from_txt(file):
    """Extract text from a text file."""
    try:
        # Read the file as text with UTF-8 encoding, ignoring any encoding errors
        text = file.read().decode('utf-8', errors='ignore')
        return text.strip()
    except Exception as e:
        raise Exception(f"Error reading text file: {str(e)}")

def process_resume(file):
    """Process the uploaded resume file and extract text."""
    try:
        # Get file extension
        filename = file.filename.lower()
        
        if filename.endswith('.pdf'):
            return extract_text_from_pdf(file)
        elif filename.endswith(('.txt', '.docx')):
            return extract_text_from_txt(file)
        else:
            raise ValueError("Unsupported file format")
    except Exception as e:
        raise Exception(f"Error processing resume: {str(e)}")

def generate_feedback(resume_text, is_sample=False, api_key=None):
    """Generate feedback for the resume using OpenRouter API with free models.
    
    Args:
        resume_text (str): The text content of the resume to analyze
        is_sample (bool): Whether this is a sample request
        api_key (str, optional): Optional API key to use for the request
        
    Returns:
        dict: Feedback containing scores, strengths, suggestions, and summary
    """
    try:
        # Check if this is a sample request or if we have no text
        if is_sample or not resume_text.strip():
            return get_sample_feedback()
            
        # Prepare the prompt for the AI
        prompt = f"""Analyze the following resume and provide detailed feedback in the following JSON format:
        {{
            "scores": {{
                "overall": 0-5,
                "clarity": 0-5,
                "structure": 0-5,
                "relevance": 0-5,
                "impact": 0-5
            }},
            "strengths": ["strength1", "strength2", "strength3"],
            "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
            "summary": "A brief overall summary of the resume's quality and key areas for improvement."
        }}
        
        Resume:
        {resume_text}
        
        Please provide specific, actionable feedback that would help improve the resume. Focus on content quality, formatting, and presentation."""

        # Prepare headers for the API request
        headers = {
            "Content-Type": "application/json",
        }
        
        # Add API key to headers if provided
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        
        # Prepare the request payload
        payload = {
            "model": "openrouter/auto",  # Auto-select the best free model
            "messages": [
                {"role": "system", "content": "You are a professional resume reviewer. Provide detailed, constructive feedback on the resume."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 1000
        }
        
        # Call the OpenRouter API
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload
        )
        
        # Check for errors
        response.raise_for_status()
        
        # Parse the response
        response_data = response.json()
        
        # Extract the feedback from the response
        feedback_text = response_data['choices'][0]['message']['content'].strip()
        
        # Parse the JSON response
        try:
            # Sometimes the response might include markdown code blocks
            if '```json' in feedback_text:
                feedback_text = feedback_text.split('```json')[1].split('```')[0].strip()
            elif '```' in feedback_text:
                feedback_text = feedback_text.split('```')[1].split('```')[0].strip()
                
            feedback = json.loads(feedback_text)
            
            # Ensure all required fields are present
            required_fields = ['scores', 'strengths', 'suggestions', 'summary']
            for field in required_fields:
                if field not in feedback:
                    raise ValueError(f"Missing required field in feedback: {field}")
            
            return feedback
            
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            print(f"Error parsing AI response: {str(e)}")
            print(f"Raw response: {feedback_text}")
            return get_sample_feedback()
            
    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', str(e))
            except:
                error_msg = e.response.text or str(e)
        print(f"API Error: {error_msg}")
        raise Exception(f"Failed to get feedback from AI service: {error_msg}")
    except Exception as e:
        print(f"Error generating feedback: {str(e)}")
        return get_sample_feedback()

def generate_pdf_report(feedback_data):
    """Generate a PDF report from the feedback data."""
    try:
        # Create a file-like buffer to receive PDF data
        buffer = io.BytesIO()
        
        # Create the PDF object
        doc = SimpleDocTemplate(buffer, pagesize=letter,
                              rightMargin=72, leftMargin=72,
                              topMargin=72, bottomMargin=72)
        
        # Container for the 'Flowable' objects
        elements = []
        
        # Styles
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(name='Center', alignment=1))
        
        # Title
        title = "Resume Feedback Report"
        elements.append(Paragraph(title, styles['Title']))
        elements.append(Spacer(1, 12))
        
        # Summary
        elements.append(Paragraph("Summary", styles['Heading1']))
        elements.append(Paragraph(feedback_data.get('summary', 'No summary provided.'), styles['Normal']))
        elements.append(Spacer(1, 12))
        
        # Scores
        elements.append(Paragraph("Scores", styles['Heading1']))
        scores = feedback_data.get('scores', {})
        for category, score in scores.items():
            elements.append(Paragraph(f"{category.title()}: {score}/5", styles['Normal']))
        
        elements.append(Spacer(1, 12))
        
        # Strengths
        elements.append(Paragraph("Strengths", styles['Heading1']))
        for strength in feedback_data.get('strengths', []):
            elements.append(Paragraph(f"• {strength}", styles['Normal']))
        
        elements.append(Spacer(1, 12))
        
        # Suggestions
        elements.append(Paragraph("Suggestions for Improvement", styles['Heading1']))
        for suggestion in feedback_data.get('suggestions', []):
            elements.append(Paragraph(f"• {suggestion}", styles['Normal']))
        
        # Build the PDF
        doc.build(elements)
        
        # Get the value of the BytesIO buffer and write it to a file
        pdf = buffer.getvalue()
        buffer.close()
        
        # Save the PDF to a temporary file
        import tempfile
        import uuid
        
        temp_dir = os.path.join(os.path.dirname(__file__), 'static', 'reports')
        os.makedirs(temp_dir, exist_ok=True)
        
        filename = f"report_{uuid.uuid4().hex}.pdf"
        filepath = os.path.join(temp_dir, filename)
        
        with open(filepath, 'wb') as f:
            f.write(pdf)
            
        return filepath
        
    except Exception as e:
        print(f"Error generating PDF: {str(e)}")
        raise

def get_sample_feedback():
    """Return sample feedback for demo purposes."""
    return {
        "scores": {
            "clarity": 4,
            "structure": 3,
            "grammar": 5,
            "relevance": 4,
            "overall": 4
        },
        "strengths": [
            "Clear and concise work experience descriptions",
            "Good use of action verbs",
            "Well-organized education section"
        ],
        "suggestions": [
            "Add more quantifiable achievements in your work experience",
            "Include a professional summary at the top of your resume",
            "List relevant technical skills more prominently"
        ],
        "summary": "This is a strong resume with good content and organization. With a few improvements, it could be even more effective.",
        "is_sample": True
    }
