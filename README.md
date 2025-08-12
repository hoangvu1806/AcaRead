# SciHorizone - IELTS Exam Generator

<p align="center">
  <img width="200px" height="200px" src="logo.png" alt="SciHorizone Logo">
</p>

<div align="center">

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)
[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://python.org)
[![Next.js](https://img.shields.io/badge/next.js-15.3+-black.svg)](https://nextjs.org)

</div>

---

<p align="center">
  <strong>Ứng dụng AI chuyển đổi tài liệu khoa học thành đề thi IELTS/TOEIC Reading Comprehension</strong>
  <br>
  <em>AI-powered application that converts scientific papers into IELTS/TOEIC reading comprehension exams</em>
</p>

## 📋 Mục lục

-   [Giới thiệu](#giới-thiệu)
-   [Tính năng chính](#tính-năng-chính)
-   [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
-   [Cài đặt và chạy](#cài-đặt-và-chạy)
-   [Hướng dẫn sử dụng](#hướng-dẫn-sử-dụng)
-   [API Documentation](#api-documentation)
-   [Cấu hình nâng cao](#cấu-hình-nâng-cao)
-   [Troubleshooting](#troubleshooting)
-   [Công nghệ sử dụng](#công-nghệ-sử-dụng)
-   [Đóng góp](#đóng-góp)

## 🎯 Giới thiệu

**SciHorizone** là một ứng dụng web thông minh sử dụng AI để tự động chuyển đổi các tài liệu khoa học (PDF) thành các đề thi đọc hiểu chuẩn IELTS và TOEIC. Ứng dụng giúp:

-   **Giáo viên & Giảng viên**: Tạo nhanh đề thi chất lượng cao từ tài liệu khoa học
-   **Học sinh & Sinh viên**: Luyện tập với đề thi được tạo từ nội dung thực tế
-   **Trung tâm đào tạo**: Tự động hóa quy trình tạo đề thi, tiết kiệm thời gian

### Điểm nổi bật

-   ✅ **Hoàn toàn tự động**: Upload PDF → Tạo đề thi → Làm bài → Xem kết quả
-   ✅ **Chất lượng cao**: Sử dụng Google Gemini AI để tạo câu hỏi chuẩn
-   ✅ **Đa dạng**: Hỗ trợ IELTS (band 4.0-9.0) và TOEIC (400-900 điểm)
-   ✅ **Tương tác**: Giao diện làm bài giống thi thật
-   ✅ **Phân tích chi tiết**: Giải thích đáp án và đánh giá kết quả

## ✨ Tính năng chính

### 🔄 Xử lý PDF thông minh

-   **Trích xuất nội dung**: Hỗ trợ PDF khoa học phức tạp với công thức, biểu đồ
-   **Hai phương pháp**: docling-serve (chất lượng cao) + fallback method
-   **Đa nguồn**: Upload file hoặc nhập URL trực tiếp

### 🤖 Tạo đề thi bằng AI

-   **Google Gemini AI**: Mô hình ngôn ngữ tiên tiến nhất
-   **Đa dạng câu hỏi**: Multiple choice, True/False/Not Given, Matching, Fill in blanks
-   **Tùy chỉnh linh hoạt**: Loại đề thi, độ khó, độ dài passage

### 📊 Giao diện thi cử chuyên nghiệp

-   **Mô phỏng thi thật**: Timer, navigation, review system
-   **Responsive design**: Hoạt động mượt mà trên mọi thiết bị
-   **Trải nghiệm UX**: Drag & drop, animations, intuitive controls

### 📈 Phân tích kết quả chi tiết

-   **Chấm điểm tự động**: Theo chuẩn IELTS/TOEIC
-   **Giải thích đáp án**: Phân tích tại sao đáp án đúng/sai
-   **Báo cáo chi tiết**: Điểm mạnh, điểm yếu, khuyến nghị cải thiện

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐    HTTP/API    ┌──────────────────┐
│   Frontend      │◄──────────────►│    Backend       │
│   (Next.js)     │                │   (FastAPI)      │
│   Port: 3000    │                │   Port: 8000     │
└─────────────────┘                └──────────────────┘
         │                                   │
         │                                   │
    ┌────▼────┐                         ┌────▼────┐
    │ Tailwind│                         │ Gemini  │
    │   CSS   │                         │   AI    │
    └─────────┘                         └─────────┘
                                             │
                                        ┌────▼────┐
                                        │docling- │
                                        │ serve   │
                                        │Port:5001│
                                        └─────────┘
```

### Luồng xử lý

1. **Upload PDF** → Frontend gửi file đến Backend
2. **Extract Content** → Backend dùng docling-serve hoặc fallback
3. **AI Processing** → Google Gemini phân tích và tạo câu hỏi
4. **Generate Exam** → Tạo đề thi theo format chuẩn
5. **Interactive Test** → Frontend hiển thị giao diện thi
6. **Auto Grading** → Chấm điểm và phân tích kết quả

### Triển khai Production

-   **Frontend**: `scihorizone.hoangvu.id.vn` (Docker container)
-   **Backend**: `apisci.hoangvu.id.vn` (FastAPI server)
-   **Proxy**: Next.js tự động proxy `/api/*` đến backend
-   **CORS**: Đã cấu hình cho phép cross-origin requests

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống

-   **Node.js**: 18.0+ và npm/yarn
-   **Python**: 3.8+ và pip
-   **Google API Key**: Để sử dụng Gemini AI
-   **docling-serve** (tùy chọn): Để trích xuất PDF chất lượng cao

### Bước 1: Clone repository

```bash
git clone https://github.com/hoangvu1806/SciHorizone.git
cd SciHorizone
```

### Bước 2: Cài đặt Backend

```bash
cd server

# Cài đặt dependencies
pip install -r requirements.txt

# Hoặc cài đặt thủ công
pip install fastapi uvicorn langchain-google-genai python-dotenv requests

# Kiểm tra file .env (Google API key đã có sẵn)
cat .env
```

### Bước 3: Cài đặt Frontend

```bash
cd frontend

# Cài đặt dependencies
npm install

# Hoặc dùng yarn
yarn install
```

### Bước 4: Chạy ứng dụng

**Terminal 1 - Backend:**

```bash
cd server
python server.py --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

### Bước 5: Truy cập ứng dụng

-   **Frontend**: http://localhost:3000
-   **Backend API**: http://localhost:8000
-   **API Docs**: http://localhost:8000/docs

### Cài đặt docling-serve (Tùy chọn - Khuyến nghị)

```bash
# Cài đặt docling-serve để trích xuất PDF chất lượng cao
pip install docling-serve
docling-serve --port 5001
```

## 📖 Hướng dẫn sử dụng

### Tạo đề thi mới

1. **Truy cập**: http://localhost:3000
2. **Upload PDF**: Kéo thả file hoặc click để chọn
3. **Cấu hình đề thi**:
    - **Exam Type**: IELTS hoặc TOEIC
    - **Difficulty**: IELTS (4.0-9.0), TOEIC (400-900)
    - **Passage Type**: 1 (Dễ), 2 (Trung bình), 3 (Khó)
4. **Generate**: Click "Tạo đề thi" và chờ AI xử lý
5. **Làm bài**: Giao diện thi tương tác với timer

### Các loại câu hỏi được hỗ trợ

-   **Multiple Choice**: Chọn đáp án đúng từ 4 lựa chọn
-   **True/False/Not Given**: Đánh giá tính đúng/sai của thông tin
-   **Matching**: Nối thông tin tương ứng
-   **Fill in the Blanks**: Điền từ vào chỗ trống
-   **Short Answer**: Trả lời ngắn gọn

### Tips sử dụng hiệu quả

-   **PDF chất lượng**: Sử dụng PDF có text rõ ràng, tránh scan image
-   **Độ dài phù hợp**: Paper 5-15 trang cho kết quả tốt nhất
-   **Chủ đề đa dạng**: Khoa học, công nghệ, y học, môi trường...
-   **Lưu kết quả**: Download JSON để sử dụng lại

## 📚 API Documentation

### Endpoints chính

#### 1. Upload PDF

```http
POST /upload-pdf
Content-Type: multipart/form-data

Body:
- pdf_file: File (PDF)
- url: String (optional, URL to PDF)

Response:
{
  "session_id": "uuid",
  "filename": "paper.pdf",
  "word_count": 5000,
  "status": "success"
}
```

#### 2. Generate Exam

```http
POST /generate-exam/{session_id}
Content-Type: application/json

Body:
{
  "exam_type": "IELTS",
  "difficulty": "7.0",
  "passage_type": "3",
  "output_format": "json"
}

Response:
{
  "session_id": "uuid",
  "result": { /* exam data */ },
  "status": "success"
}
```

#### 3. Get Exam Data

```http
GET /exam-data/{session_id}

Response:
{
  "session_id": "uuid",
  "result": {
    "passage": "...",
    "questions": [...],
    "answers": [...],
    "explanations": [...]
  }
}
```

### Error Handling

-   **400**: Bad Request (file không hợp lệ, thiếu parameters)
-   **404**: Session không tồn tại hoặc đã hết hạn
-   **500**: Lỗi server (AI processing, file I/O)
-   **503**: Service không khả dụng (docling-serve down)

## ⚙️ Cấu hình nâng cao

### Environment Variables

**Backend (.env):**

```env
GOOGLE_API_KEY=your_google_api_key
GEMINI_MODEL=gemini-1.5-flash
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_OUTPUT_TOKENS=8192
GEMINI_TOP_P=0.95
GEMINI_TOP_K=40
```

**Frontend (.env.local):**

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Tùy chỉnh AI Model

Trong file `server/llm.py`:

```python
# Thay đổi model
model_name = "gemini-1.5-pro"  # Chất lượng cao hơn, chậm hơn

# Tùy chỉnh parameters
temperature = 0.5  # Giảm tính ngẫu nhiên
max_tokens = 4096  # Giới hạn độ dài output
```

### Cấu hình CORS

Trong file `server/server.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://yourdomain.com"  # Thêm domain của bạn
    ]
)
```

## 🔧 Troubleshooting

### Lỗi thường gặp

#### 1. "docling-serve is not available"

```bash
# Cài đặt docling-serve
pip install docling-serve

# Chạy trên port 5001
docling-serve --port 5001

# Hoặc bỏ qua (dùng fallback method)
```

#### 2. "Google API key error"

```bash
# Kiểm tra API key trong .env
cat server/.env

# Tạo API key mới tại: https://ai.google.dev/
```

#### 3. "Port already in use"

```bash
# Tìm process đang dùng port
lsof -i :8000
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### 4. "PDF extraction failed"

-   Kiểm tra file PDF có text (không phải scan image)
-   Thử với file PDF khác
-   Kiểm tra kết nối docling-serve

#### 5. "Session expired"

-   Session tự động xóa sau 30 phút
-   Upload lại PDF và tạo đề thi mới

### Debug Mode

```bash
# Backend với debug
python server.py --reload --host 0.0.0.0 --port 8000

# Frontend với debug
npm run dev

# Xem logs
docker logs frontend-app  # Nếu dùng Docker
```

### Performance Optimization

```python
# Tăng timeout cho AI processing
GEMINI_TIMEOUT = 120  # seconds

# Giảm max_tokens để tăng tốc độ
GEMINI_MAX_OUTPUT_TOKENS = 4096

# Cache kết quả để tránh tạo lại
USE_CACHE = True
```

## 🛠️ Công nghệ sử dụng

### Frontend Stack

-   **[Next.js 15.3+](https://nextjs.org/)**: React framework với App Router
-   **[React 19](https://react.dev/)**: UI library với hooks mới nhất
-   **[Tailwind CSS 3.4+](https://tailwindcss.com/)**: Utility-first CSS framework
-   **[TypeScript 5+](https://typescriptlang.org/)**: Type-safe JavaScript
-   **[Framer Motion](https://framer.com/motion/)**: Animation library
-   **[GSAP](https://gsap.com/)**: Professional animation
-   **[React DnD](https://react-dnd.github.io/react-dnd/)**: Drag and drop

### Backend Stack

-   **[FastAPI](https://fastapi.tiangolo.com/)**: Modern Python web framework
-   **[Google Gemini AI](https://ai.google.dev/)**: Large language model
-   **[LangChain](https://langchain.com/)**: LLM application framework
-   **[docling-serve](https://github.com/DS4SD/docling)**: PDF extraction service
-   **[Uvicorn](https://uvicorn.org/)**: ASGI server
-   **[Pydantic](https://pydantic.dev/)**: Data validation

### DevOps & Tools

-   **[Docker](https://docker.com/)**: Containerization
-   **[Git](https://git-scm.com/)**: Version control
-   **[ESLint](https://eslint.org/)**: Code linting
-   **[Prettier](https://prettier.io/)**: Code formatting

## 🤝 Đóng góp

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng:

1. **Fork** repository
2. **Tạo branch** cho feature: `git checkout -b feature/AmazingFeature`
3. **Commit** changes: `git commit -m 'Add AmazingFeature'`
4. **Push** to branch: `git push origin feature/AmazingFeature`
5. **Tạo Pull Request**

### Coding Standards

-   **Python**: PEP 8, type hints, docstrings
-   **TypeScript**: ESLint rules, proper typing
-   **Commits**: Conventional commits format
-   **Documentation**: Update README cho mọi thay đổi

### Bug Reports

Khi báo lỗi, vui lòng bao gồm:

-   **Môi trường**: OS, Python/Node version
-   **Steps to reproduce**: Các bước tái hiện lỗi
-   **Expected vs Actual**: Kết quả mong đợi vs thực tế
-   **Logs**: Error messages, stack traces

---

<div align="center">

**⭐ Nếu project hữu ích, hãy cho chúng tôi một star! ⭐**

Made with ❤️ by [SciHorizone Team](https://github.com/hoangvu1806)

</div>
