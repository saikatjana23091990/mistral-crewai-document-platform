# 🚀 Mistral CrewAI Document Platform

An AI-powered, production-ready platform for **Multi-Source Document Conversion**, **Format-Preserving Translation**, and **Agentic RAG Conversational Chat**. 

Built for enterprise efficiency, this platform magically extracts, transforms, translates, and explores data across dozens of complex document formats without ever losing your original template's beautiful formatting!

![Platform Dashboard & Stats](Application%20Previews/results%20and%20stats%20page.png)

---

## ✨ Exciting New Features

### 🌍 1. Format-Preserving Document Translation (NEW!)
Translate entire presentations, spreadsheets, and Word documents while keeping every chart, color, and font perfectly intact.

![Translate Document Interface](Application%20Previews/Translate_Document_Interface.png)

- **In-Place Translation Engine**: Our surgical AI extracts text run-by-run and cell-by-cell, translating the content and re-injecting it back into your original file. **Zero formatting loss.**
- **Smart Language Detection**: Automatically detects the source language.
- **Granular Configuration**: Define custom translation instructions, tone enhancements, and terminology rules before translating.
- **Batched Processing**: Safely translates massive documents without ever hitting LLM token limits.
- **Side-by-Side Preview**: Interactively preview translated text chunks before committing to the final download!

![Translation Configuration](Application%20Previews/Translate_Document_configuration.png)
![Translation Pre-flight Stats](Application%20Previews/Translate_Document_Preconfigure_Stats.png)
![Translation Preview](Application%20Previews/Translate-Dcoument_Preview.png)
![Translation Final Result](Application%20Previews/Translate_Dcoument_Result.png)

### 📄 2. Intelligent Document Conversion (Upgraded!)
Convert unstructured data from multiple sources into a single, beautifully structured reference template (XLSX, DOCX, PDF, PPTX).

![Convert Document Wizard](Application%20Previews/Convert%20Document%20Interface.png)

- **Hybrid In-Place Templates**: The system automatically detects if your template is a scattered **Form** (e.g. `Name: [  ]`) or a structured **Table**. It fills in the blanks intelligently and dynamically appends tabular rows as needed.
- **Graphical PPTX Support**: Replaces text, dynamically updates Charts, and respects presentation slide masters.
- **Interactive Map Review & Override**: Preview AI-suggested mappings, edit extracted values, and manually map missing fields before generating the file.
- **Conflict Resolution**: Human-in-the-loop verification automatically flags differing values extracted from multiple sources (e.g. conflicting revenue numbers).

![AI Mapping Suggestions](Application%20Previews/Convert%20document%20mapping.png)
![Conflict Resolution](Application%20Previews/Convert%20document%20mapping%20conflict%20resultion.png)
![Conversion Result Document](Application%20Previews/Convert%20document%20results.png)

### 💬 3. Agentic RAG Chat
Explore and interrogate your converted and translated documents using an intelligent chat interface.

![Intelligent Chat](Application%20Previews/Chat%20with%20document%20interface.png)

- **Contextual Awareness**: Chat history panel with strict session isolation.
- **Multi-Provider Support**: Switch instantly between **Groq** (lightning-fast), **OpenRouter**, or **AWS Bedrock** (Claude Haiku).
- **Anti-Hallucination**: Responses are strictly grounded in source chunks, featuring executive summaries and evidence badges.

### ⚙️ 4. Global Settings & Analytics
Control your platform's behavior and aesthetic from a centralized command center.

![Global Stats Dashboard](Application%20Previews/Settings%20and%20stat%20page.png)
![Translation Analytics](Application%20Previews/results%20and%20stats%20page%20translate.png)
![Settings Configuration](Application%20Previews/Settings%20Page.png)

- **Dynamic Neomorphic UI**: Switch app themes instantly (Purple, Pink, Yellow, Orange) with sleek, modern neomorphic components.
- **Usage Stats & History**: Live dashboard metric cards tracking conversion rates, translation jobs, and data saved.

---

## 🏗️ Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| **Frontend**| React 18, Vite, Material-UI, Axios (Neomorphic UI) |
| **Backend** | FastAPI, Uvicorn, Python 3.11       |
| **AI Agents**| CrewAI (Orchestration & Workflow)   |
| **AI / RAG**| Groq, OpenRouter, AWS Bedrock, LangChain |
| **Vector DB**| ChromaDB                            |
| **Doc Parsers**| PyMuPDF, python-docx, python-pptx, openpyxl, unstructured |

---

## 🚀 Installation & Setup

### Option 1: Docker Compose (Recommended for Production)

The easiest way to get started.

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd mistral-crewai-document-platform

# 2. Setup Environment Variables
cp .env.example .env
# Edit .env and add your GROQ_API_KEY or OPENROUTER_API_KEY

# 3. Build and Start
docker compose up --build
```
- **Backend API**: http://localhost:8000
- **Frontend App**: http://localhost:5173

### Option 2: Local Development Setup

#### Backend Setup
```bash
cd backend
python -m venv ../.venv

# Activate virtual environment
source ../.venv/Scripts/activate   # Windows
# source ../.venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start Server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Environment Variables

Create a `.env` file in the root or `/backend` directory:

| Variable                    | Required | Description                              |
|----------------------------|----------|------------------------------------------|
| `GROQ_API_KEY`             | Optional | Recommended default provider key         |
| `OPENROUTER_API_KEY`       | Optional | OpenRouter API key                       |
| `AWS_REGION`               | Optional | AWS region for Bedrock                   |
| `AWS_BEARER_TOKEN_BEDROCK` | Optional | Bedrock short-term bearer token          |

---

## 🔄 How To Use

### Translating a Document
1. Navigate to the **Translate Document** tab.
2. Upload your file (DOCX, PPTX, XLSX).
3. Verify the auto-detected source language and select your target language.
4. Add any custom tone instructions (e.g. "Make it sound highly professional").
5. Preview the translation side-by-side, approve it, and download your perfectly formatted file!

### Converting a Document
1. Navigate to the **Convert Document** tab.
2. Upload your **Source Documents** (the files containing your unstructured data).
3. Upload your **Reference Template** (an empty DOCX/XLSX/PPTX showing how you want the output to look).
4. Review the AI's data mapping, resolve any conflicts, and click **Convert**.

---

## 🛠️ Future Improvements

- Add more document formats (Images via OCR)
- Streaming responses in chat
- User authentication and Role-Based Access Control (RBAC)
- Batch conversion jobs for entire directories

## 📄 License

MIT License. Built with ❤️ using FastAPI, React, and modern LLMs.