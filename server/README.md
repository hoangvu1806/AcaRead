# AcaRead Backend API (FastAPI)

The backend service for AcaRead, responsible for document processing, AI model integration, and exam generation logic using state-of-the-art Large Language Models.

## Overview

AcaRead's server component automates the creation of IELTS and TOEIC reading comprehension exams from PDF documents. It leverages Google Gemini AI for advanced natural language understanding and question generation, ensuring high-quality, relevant content that mirrors official testing formats.

## Key Functionality

- **PDF Ingestion**: Advanced parsing with Docling to handle complex academic layouts, stripping headers/footers, and preserving structural integrity.
- **AI-Powered Generation**: Integrates Google Gemini 1.5 via LangChain for contextual analysis and question creation.
- **Exam Engine**: Generates diverse question types including Multiple Choice, Matching, and True/False/Not Given based on document content.
- **Session Management**: Handles ephemeral exam sessions, user history, and result tracking with persistent SQLite storage.
- **Authentication**: Implements secure JWT-based authentication flows and user validation.

## API Documentation

The API uses Swagger UI for interactive documentation. Once running, visit:
http://localhost:8000/docs

## Setup and Installation

### Prerequisites

- Python 3.8+
- Virtual Environment (recommended)
- Google Gemini API Key

### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/hoangvu1806/AcaRead.git
   cd AcaRead/server
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment**:
   Create a `.env` file in the `server` directory:
   ```env
   # Required
   GOOGLE_API_KEY=your_gemini_api_key

   # Optional (Defaults provided)
   GEMINI_MODEL=gemini-1.5-flash
   GEMINI_TEMPERATURE=0.7
   DATABASE_URL=sqlite:///./data/acaread.db
   DOCLING_SERVE_URL=http://localhost:5001
   JWT_SECRET=your_jwt_secret
   ```

4. **Run the Server**:
   ```bash
   python server.py --host 0.0.0.0 --port 8000 --reload
   ```

## Project Structure

- `server.py`: Application entry point and API route definitions.
- `ielts_pipeline.py`: Core logic for parsing, processing, and generating IELTS exams.
- `database.py`: SQLAlchemy database models and connection management.
- `session_manager.py`: Logic for creating and managing exam sessions.
- `llm.py`: Wrapper for Google Gemini API interactions.
- `auth.py`: JWT token generation, validation, and user authentication dependency.

## Testing

Run the test suite using pytest:
```bash
pytest tests/
```

## Contributing

Please adhere to PEP 8 style guidelines for Python code.