# Mistral CrewAI Document Platform

AI-powered **multi-source document conversion** + **agentic RAG conversational chat** platform.

Convert documents from multiple sources into a single reference format (XLSX / DOCX / PDF) with conflict resolution, then explore the converted data using an intelligent chat interface powered by Mistral, Google Gemini, or AWS Bedrock.

![Platform Overview](https://via.placeholder.com/800x400?text=Document+Platform+Screenshot)

## ✨ Key Features

### Document Conversion
- Upload multiple source documents (PDF, DOCX, XLSX, TXT)
- Upload a reference/template file to define the target format
- Automatic format detection and native output generation (XLSX stays XLSX, DOCX stays DOCX, etc.)
- **Human-in-the-loop conflict resolution** modal when sources disagree on values
- Missing fields clearly labeled as `[Information not found in source documents]`
- Download the converted document
- Reset functionality for new conversions

### Agentic RAG Chat with Document
- Full chat history panel with auto-titles and timestamps
- Load documents from conversion history or upload new ones
- **Multi-provider support**:
  - Mistral AI (default)
  - Google Gemini
  - AWS Bedrock (boto3 + bearer token API route)
- Top-right model selector
- Structured responses: Executive Summary + Key Sections/Findings + Key Data/Numbers & Entities + Implications & Recommendations
- Memory system (Conversation Summary + Entity Memory)
- Grounding indicators (High / Medium / Low)
- Anti-hallucination: responses are strictly grounded in source chunks
- Tool support (calculator for numeric questions)

### Technical Highlights
- FastAPI backend with LangChain + ChromaDB
- React + Vite + Material-UI frontend
- Clean separation of concerns
- Docker-ready

## 🏗️ Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 18, Vite, MUI, Axios          |
| Backend     | FastAPI, Uvicorn                    |
| AI / RAG    | Mistral AI, Google Generative AI, AWS Bedrock (boto3), LangChain |
| Vector DB   | ChromaDB                            |
| Document    | PyMuPDF, python-docx, pandas, openpyxl, unstructured |
| Deployment  | Docker Compose                      |

## 🚀 Quick Start

### Option 1: Local Development (Recommended for development)

#### 1. Clone and setup
```bash
git clone <your-repo-url>
cd mistral-crewai-document-platform
```

#### 2. Backend
```bash
cd backend
python -m venv ../.venv
source ../.venv/Scripts/activate   # Windows
# source ../.venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
```

Create `.env` file (see `.env.example`):
```env
MISTRAL_API_KEY=your_mistral_key
GEMINI_API_KEY=your_gemini_key
AWS_REGION=us-east-1
AWS_BEARER_TOKEN_BEDROCK=bedrock-api-key-xxxx
```

Run backend:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Option 2: Docker Compose (Easiest for production-like)

```bash
# Copy environment file
cp .env.example .env
# Edit .env with your API keys

# Build and run everything
docker compose up --build
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173

To stop:
```bash
docker compose down
```

## 🔑 Environment Variables

| Variable                    | Required | Description                              | Example |
|----------------------------|----------|------------------------------------------|---------|
| `MISTRAL_API_KEY`          | Optional | Mistral AI key                           | - |
| `GEMINI_API_KEY`           | Optional | Google AI Studio key                     | - |
| `AWS_REGION`               | Optional | AWS region for Bedrock                   | us-east-1 |
| `AWS_BEARER_TOKEN_BEDROCK` | Optional | Bedrock short-term bearer token          | bedrock-api-key-... |
| `MODEL_NAME`               | Optional | Override Mistral model                   | mistral-large-latest |

The app supports **three providers** selectable in the Chat UI:
- Mistral (default)
- Gemini
- AWS Bedrock (supports both boto3 credentials and bearer token route)

## 📁 Project Structure

```
mistral-crewai-document-platform/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI routes (/convert, /chat, /download)
│   │   ├── services/               # Conversion logic
│   │   ├── rag/                    # AgenticMemoryRAG + multi-provider support
│   │   └── parsers/                # Document parsers
│   ├── uploads/                    # Uploaded files
│   ├── outputs/                    # Converted documents
│   ├── chroma_db/                  # Vector store
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConvertDocument.jsx
│   │   │   └── ChatWithDocument.jsx
│   │   └── App.jsx
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## 🔄 Document Conversion Workflow

1. Upload **one or more source documents**
2. Upload a **reference file** (defines target columns/format)
3. Click **Convert**
4. If conflicts detected → Resolve using the modal (choose per source or enter custom)
5. Download the native-format output file

## 💬 Chat Features

- Select model at top-right
- Load previous conversion outputs or upload new files
- Ask natural language questions
- Follow-up questions supported via memory
- Responses include grounding badges

## 🐳 Docker Details

See `docker-compose.yml` and individual Dockerfiles.

Useful commands:
```bash
# Rebuild specific service
docker compose build backend

# View logs
docker compose logs -f backend

# Clean everything
docker compose down -v
```

## 📦 Preparing for GitHub

This repository is ready for GitHub:

```bash
git init
git add .
git commit -m "Initial commit: Document conversion + agentic RAG platform"
git remote add origin https://github.com/<your-username>/mistral-crewai-document-platform.git
git branch -M main
git push -u origin main
```

## 🛠️ Future Improvements

- Add more document formats (PPTX, images via OCR)
- Streaming responses in chat
- User authentication
- Batch conversion jobs
- Advanced semantic retrieval (embeddings)

## 📄 License

MIT

---

Built with ❤️ using FastAPI, React, and modern LLMs.