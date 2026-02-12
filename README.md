
<div align="center">

<img src="assets/logo.png" width="180" />

# ACAREAD


[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js_15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Language](https://img.shields.io/badge/Language-Python_3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Language](https://img.shields.io/badge/Language-TypeScript_5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![AI](https://img.shields.io/badge/AI-Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Database](https://img.shields.io/badge/Database-SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**AI-POWERED • ACADEMIC • ASSESSMENT • SYSTEM**

[ LIVE DEMO ](https://acaread.hoangvu.id.vn)

</div>

---

## PROJECT DESCRIPTION

AcaRead is an advanced educational platform designed to bridge the gap between static academic reading materials and interactive assessment. By leveraging the cognitive capabilities of **Google's Gemini 2.5 Flash** model, the system autonomously analyzes complex PDF documents such as research papers and technical journals to generate standardized reading comprehension examinations. The platform focuses on emulating high stakes testing formats like IELTS, providing users with a rigorous environment for academic preparation.

## CORE VALUE

The traditional process of creating high-quality reading assessments is labor-intensive and requires significant pedagogical expertise. AcaRead democratizes this process by:

*   **Automating Content Creation**: Instantly transforming any scientific text into a structured, multi-task exam.
*   **Enhancing Learning Efficiency**: Providing immediate, AI-driven grading and detailed explanations for every answer, tailored to the specific context of the source material.
*   **Standardizing Assessment**: Ensuring consistent difficulty levels and diverse question types (Multiple Choice, Matching Headings, True/False/Not Given) that align with international academic standards.

## TECHNOLOGY STACK

| COMPONENT | TECHNOLOGY | VERSION |
|-----------|------------|---------|
| **Core API** | FastAPI | `0.110.0` |
| **Server** | Uvicorn | `0.29.0` |
| **UI Framework** | Next.js | `15.0.0` |
| **Styling** | Tailwind CSS | `3.4` |
| **ORM** | SQLAlchemy | `2.0+` |
| **AI Model** | Gemini 2.5 Flash | `Latest` |
| **Processing** | Docling / PyMuPDF | `1.0+` |

## QUICK DEPLOYMENT

### SERVER
```bash
cd server
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

### CLIENT
```bash
cd frontend
npm install
npm run dev
```

## ENVIRONMENT CONFIGURATION

### BACKEND (.env)
```ini
GOOGLE_API_KEY="AIzaSy..."
JWT_SECRET="<secure-generated-hash>"
GEMINI_MODEL="gemini-2.5-flash"
```

### FRONTEND (.env.local)
```ini
NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"
AUTH_SECRET="<random-string>"
AUTH_GOOGLE_ID="<client-id>"
AUTH_GOOGLE_SECRET="<client-secret>"
```

---

<div align="center">

**DEVELOPED FOR ACADEMIC RESEARCH PURPOSES**
<br>
2026 © HOANG VU

</div>
