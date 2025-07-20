import os
from flask import Blueprint, render_template, request, jsonify, send_from_directory, redirect, url_for, flash
from werkzeug.utils import secure_filename
from .utils import allowed_file, process_resume, generate_feedback

main = Blueprint('main', __name__)

@main.route('/')
def index():
    """Render the main page with the upload form."""
    return render_template('index.html')

@main.route('/upload', methods=['POST'])
def upload_file():
    """
    Handle file upload and process the resume.
    
    Returns:
        JSON response with analysis results or error message
    """
    if 'resume' not in request.files:
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['resume']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file and allowed_file(file.filename):
        try:
            # Process the resume
            resume_text = process_resume(file)
            
            # Get API key from form data if provided
            api_key = request.form.get('api_key')
            
            # Generate feedback using AI
            feedback = generate_feedback(resume_text, api_key=api_key)
            
            return jsonify({
                'success': True,
                'feedback': feedback
            })
            
        except Exception as e:
            return jsonify({
                'error': f'Error processing file: {str(e)}',
                'details': str(e) if str(e) != 'Failed to get feedback from AI service' else 'Invalid or missing API key. Please check your API key and try again.'
            }), 500
    else:
        return jsonify({
            'error': 'File type not allowed. Please upload a PDF, TXT, or DOCX file.'
        }), 400

@main.route('/sample')
def sample_feedback():
    """Return sample feedback for demo purposes."""
    try:
        # Get API key from query parameters if provided
        api_key = request.args.get('api_key')
        
        # Load sample resume text from file
        sample_path = os.path.join(os.path.dirname(__file__), 'static', 'sample_resume.txt')
        with open(sample_path, 'r', encoding='utf-8') as f:
            sample_text = f.read()
            
        # Generate feedback for sample resume
        feedback = generate_feedback(sample_text, is_sample=True, api_key=api_key)
        
        return jsonify({
            'success': True,
            'feedback': feedback,
            'is_sample': True
        })
        
    except Exception as e:
        error_msg = str(e)
        return jsonify({
            'error': 'Error generating sample feedback',
            'details': error_msg if error_msg != 'Failed to get feedback from AI service' else 'Invalid or missing API key. Please check your API key and try again.'
        }), 500

@main.route('/download-report', methods=['POST'])
def download_report():
    """Generate and return a PDF report of the feedback."""
    try:
        feedback = request.json.get('feedback')
        if not feedback:
            return jsonify({'error': 'No feedback data provided'}), 400
            
        # Generate PDF (implementation in utils.py)
        from .utils import generate_pdf_report
        pdf_path = generate_pdf_report(feedback)
        
        return send_from_directory(
            os.path.dirname(pdf_path),
            os.path.basename(pdf_path),
            as_attachment=True,
            download_name='resume_feedback_report.pdf'
        )
        
    except Exception as e:
        return jsonify({
            'error': f'Error generating report: {str(e)}'
        }), 500
