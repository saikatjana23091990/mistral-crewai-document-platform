# Mistral CrewAI Document Platform

AI-powered **multi-source document conversion** + **agentic RAG conversational chat** platform.

Convert documents from multiple sources into a single reference format (XLSX / DOCX / PDF) with conflict resolution, then explore the converted data using an intelligent chat interface powered by Mistral, Google Gemini, or AWS Bedrock.

![Platform Dashboard & Stats](Application%20Previews/results%20and%20stats%20page.png)

## ✨ Key Features

### Document Conversion

![Convert Document Wizard](Application%20Previews/Convert%20Document%20Interface.png)

- **Modern Neomorphic UI**: Beautiful 4-step wizard design (Lavender/White theme).
- **Upload**: Multiple source documents (PDF, DOCX, XLSX, TXT) and a reference template file.
- **Interactive Map Review**: 
  - Preview AI-suggested mappings and confidence scores.
  - **Manual Overrides**: Edit extracted values or manually map missing fields.
  - **Auto Map & Filtering**: Filter by status (Mapped, Missing, Needs Review, Ignored) and search fields instantly.

![AI Mapping Suggestions](Application%20Previews/Convert%20document%20mapping.png)

- **Conflict Resolution**: Human-in-the-loop verification automatically flags differing values extracted from multiple source documents.

![Conflict Resolution](Application%20Previews/Convert%20document%20mapping%20conflict%20resultion.png)

- **Native Output Generation**: Download the fully populated converted document instantly.

![Conversion Results](Application%20Previews/Convert%20document%20results.png)

### Agentic RAG Chat with Document

![Intelligent Chat](Application%20Previews/Chat%20with%20document%20interface.png)

- Full chat history panel with session isolation ("New Chat" properly clears context).
- Load documents from conversion history or upload new ones.
- **Contextual Suggestions**: Start your chat easily with context-aware prompts based on your documents.
- **Multi-provider support** (Dynamically selectable via UI):
  - **Groq** (Default - lightning-fast inference)
  - **OpenRouter** (Flexible OpenAI-compatible routing)
  - **AWS Bedrock** (Anthropic Claude Haiku support)
- Structured responses: Executive Summary + Key Sections/Findings + Key Data/Numbers & Entities + Implications & Recommendations
- Anti-hallucination: responses are strictly grounded in source chunks.

### Global Settings & Admin

![Settings Page](Application%20Previews/Settings%20and%20stat%20page.png)

- **Centralized Configuration**: Globally control the active LLM provider and parameters (temperature, model type, streaming).
- **Usage Stats**: Live dashboard metric cards for platform monitoring.

### Technical Highlights
- FastAPI backend with LangChain + ChromaDB
- React + Vite + Material-UI frontend
- Clean separation of concerns
- Docker-ready

## 🏗️ Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 18, Vite, MUI, Axios (Neomorphic Design) |
| Backend     | FastAPI, Uvicorn                    |
| AI Agents   | CrewAI (Document Conversion)        |
| AI / RAG    | Groq, OpenRouter, AWS Bedrock, LangChain |
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
GROQ_API_KEY=your_groq_key
OPENROUTER_API_KEY=your_openrouter_key
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
| `GROQ_API_KEY`             | Optional | Groq API key                             | - |
| `OPENROUTER_API_KEY`       | Optional | OpenRouter API key                       | - |
| `AWS_REGION`               | Optional | AWS region for Bedrock                   | us-east-1 |
| `AWS_BEARER_TOKEN_BEDROCK` | Optional | Bedrock short-term bearer token          | bedrock-api-key-... |

The app supports **three providers** selectable in the Chat and Conversion UI:
- Groq (default)
- OpenRouter
- AWS Bedrock

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
3. Click **Review Mapping** to get AI-suggested fields
4. **Human-in-the-loop**: Edit extracted values, manually map missing fields, or ignore fields using the Interactive Table.
5. Click **Save Mapping & Convert** to pass your overrides to the CrewAI agents.
6. Download the native-format output file.

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