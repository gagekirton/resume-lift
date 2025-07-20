import os
from app import create_app

app = create_app()

if __name__ == '__main__':
    # Create uploads directory if it doesn't exist
    os.makedirs(os.path.join(app.root_path, 'static', 'uploads'), exist_ok=True)
    os.makedirs(os.path.join(app.root_path, 'static', 'reports'), exist_ok=True)
    
    # Run the application
    app.run(debug=True, host='0.0.0.0', port=5000)
