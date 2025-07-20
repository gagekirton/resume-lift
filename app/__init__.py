from flask import Flask
from .routes import main

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'dev'  # Change this in production
    app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024  # 2MB max file size
    app.config['UPLOAD_FOLDER'] = 'app/static/uploads'
    
    # Register blueprints
    app.register_blueprint(main)
    
    return app
