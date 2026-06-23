# DocuGen AI — Enterprise Document Translation Module

## Overview

Implement a new module called **Translate Document** inside the existing DocuGen AI application.

This is NOT a standalone application.

The module must seamlessly integrate with the existing platform design language and architecture already used in:

- Convert Document
- Chat with Document
- Stats & Results
- Settings

The new module must support intelligent document translation while preserving document structure, formatting, business terminology, charts, tables, formulas, notes, and layout.

The system should be enterprise-grade and suitable for Pharma, Financial Services, Legal, Regulatory, and Commercial use cases.

---

# Design Requirements

## Existing Design Language

Maintain the same visual language already established across the application.

### Theme

- Soft Neumorphism
- Lavender / Purple accent
- White background
- Large rounded cards
- Soft shadows
- Premium SaaS look
- Enterprise-grade appearance

### Navigation

DO NOT create a sidebar.

The application already uses:

```text
Top Navigation Bar
```

Navigation Items:

- Convert Document
- Translate Document
- Chat with Document
- Stats & Results
- Settings

Highlight:

```text
Translate Document
```

as the active menu item.

---

# Route

```typescript
/translate
```

---

# Supported Documents

The module must support:

- PDF
- DOCX
- XLSX
- PPTX

Maximum upload size:

```text
200 MB
```

---

# Functional Workflow

Implement the translation process as a guided workflow.

## Step 1

### Upload Document

Provide drag-and-drop upload capability.

Display:

- File name
- File size
- File type
- Upload status

Example:

```text
Quarterly_Sales_Report.pptx
14.5 MB
Uploaded Successfully
```

Supported formats:

```text
PDF
DOCX
XLSX
PPTX
```

---

## Step 2

### Language Detection

Automatically detect document language.

User should not need to select source language manually.

Display:

```text
Detected Language

English

Confidence
98.7%

Document Type
PowerPoint Presentation

Slides
24

Word Count
8241
```

---

## Step 3

### Translation Configuration

#### Source Language

Default:

```text
Auto Detect
```

#### Target Language

Support:

- English
- French
- German
- Spanish
- Italian
- Portuguese
- Chinese
- Japanese
- Korean
- Arabic
- Hindi
- Bengali

---

## Translation Mode

Provide three modes.

### Literal

Purpose:

- Regulatory
- Legal
- Compliance

Behavior:

```text
Translate exactly.
Preserve wording.
Avoid paraphrasing.
```

---

### Business

Recommended Default

Behavior:

```text
Preserve meaning.
Improve readability.
Professional tone.
```

Best For:

- Reports
- Presentations
- Commercial documents

---

### Localized

Behavior:

```text
Adapt culturally.
Use local conventions.
Improve audience relevance.
```

Best For:

- Training material
- Customer-facing content
- Marketing collateral

---

# AI Enhancements

Provide optional enhancement capabilities.

### Spelling Correction

```text
Correct spelling mistakes before translation.
```

### Grammar Improvement

```text
Improve grammar and readability.
```

### Terminology Consistency

```text
Maintain consistent terminology throughout the document.
```

### Preserve Brand Terms

```text
Never translate:
- Product names
- Company names
- Internal terminology
```

---

# Glossary Management

Provide a glossary capability.

### Upload Glossary

Support:

```text
xlsx
csv
```

Example:

| Original | Translate As |
|-----------|-------------|
| NOVATHERA | NOVATHERA |
| HCP | Healthcare Professional |
| TradeIQ | TradeIQ |

### Manual Glossary Entry

Allow users to:

- Add term
- Edit term
- Delete term

---

# Translation Preview

Provide side-by-side preview.

## Left

Original Content

## Right

Translated Content

---

### DOCX Preview

Display translated paragraphs.

### PPTX Preview

Display slide thumbnails.

### XLSX Preview

Display translated cells.

### PDF Preview

Display page previews.

---

# Translation Engine

Implement document-aware translation.

The translation system must preserve:

- Layout
- Fonts
- Colors
- Tables
- Charts
- Images
- Headers
- Footers
- Notes
- SmartArt
- Shapes

---

# Translation Pipeline

Implement the following processing flow.

```text
Upload

↓

Extract Content

↓

Detect Language

↓

Chunk Document

↓

Translate

↓

Apply Glossary

↓

Apply Enhancements

↓

Reconstruct Document

↓

Generate Reports

↓

Save History
```

---

# Backend Architecture

## FastAPI

Create a dedicated translation module.

```python
TranslationController
TranslationService
LanguageDetectionService
DocumentExtractionService
DocumentReconstructionService
QualityEvaluationService
GlossaryService
HistoryService
```

---

# Document Extraction

## DOCX

Library:

```python
python-docx
```

Extract:

- Paragraphs
- Tables
- Headers
- Footers
- Images

---

## PPTX

Library:

```python
python-pptx
```

Extract:

- Slides
- Textboxes
- Tables
- Charts
- Notes
- SmartArt

---

## XLSX

Library:

```python
openpyxl
```

Extract:

- Sheets
- Cells
- Comments

Preserve:

- Formulas
- Formatting

---

## PDF

Libraries:

```python
PyMuPDF
pdfplumber
```

Extract:

- Pages
- Tables
- Text Blocks
- Images

---

# Translation Providers

The system must support:

## OpenRouter

Models:

- GPT-4o
- Claude Sonnet
- Gemini Pro
- DeepSeek
- Llama

---

## GroqCloud

Models:

- Llama
- DeepSeek

---

## Mistral

Models:

- Mistral Large
- Mistral Medium

---

## Gemini

Models:

- Gemini 2.5 Pro
- Gemini 2.5 Flash

---

## AWS Bedrock

Models:

- Claude Sonnet
- Claude Opus
- Nova Pro
- Nova Lite

---

# Translation Prompting

Implement provider-independent prompting.

### Literal

```text
Translate exactly.
Preserve wording.
Do not rephrase.
```

### Business

```text
Preserve meaning.
Improve readability.
Use professional business language.
```

### Localized

```text
Adapt culturally.
Maintain intent.
Optimize for local audience.
```

---

# Real-Time Processing

Implement asynchronous translation.

Use:

```python
Celery
Redis
```

Flow:

```text
Upload

↓

Queue Job

↓

Background Translation

↓

Progress Updates

↓

Completion
```

---

# Progress Tracking

Provide progress visualization.

Workflow:

```text
Upload Complete

Language Detected

Content Extracted

Translation Running

Formatting Reconstructed

Reports Generated

Completed
```

Use:

```python
WebSocket
```

Endpoint:

```python
/ws/translation/{jobId}
```

---

# Quality Evaluation

Implement AI-based scoring.

### Translation Quality

Evaluate:

- Accuracy
- Meaning Preservation
- Grammar
- Fluency

Output:

```json
{
  "score": 96
}
```

---

### Formatting Preservation

Compare:

Original Structure

vs

Reconstructed Structure

Output:

```json
{
  "formattingScore": 99.3
}
```

---

### Corrections Applied

Track:

- Grammar fixes
- Spelling fixes
- Terminology replacements

---

# Translation Metrics Section

Display KPI cards.

### Translation Quality

```text
96%
Excellent
```

### Formatting Preserved

```text
99.3%
```

### Corrections Applied

```text
57
```

### Structure Preservation

Display:

- Slides Preserved
- Tables Preserved
- Charts Preserved
- Images Preserved
- Formatting Preserved
- Notes Preserved

---

# Translation Summary

Display:

- Source Language
- Target Language
- Pages
- Word Count
- Processing Time
- Quality Score
- Formatting Score

---

# Download Options

Generate:

### Translated File

Example:

```text
Quarterly_Sales_Report_JP.pptx
```

### Translation Report

PDF containing:

- Language Detection
- Translation Mode
- Quality Score
- Formatting Score
- Corrections Applied
- Glossary Usage

### Side-by-Side Comparison Report

PDF showing:

Original vs Translated content.

---

# Translation Statistics

At the bottom of the page create a section similar to Stats & Results.

Display KPI Cards:

- Total Translations
- Successful Translations
- Average Quality
- Languages Supported
- Documents Translated

---

# Translation History

Display a table.

Columns:

| Column |
|----------|
| Document |
| Language Pair |
| Translation Mode |
| Quality |
| Corrections |
| Date |
| Status |
| Actions |

Actions:

- Download File
- Download Report
- View Details

---

# Expandable History

Allow expanding a translation record.

Display:

- Original File
- Translated File
- Translation Report
- Glossary Used
- Quality Score
- Formatting Score
- Processing Time

---

# Database Schema

## translation_jobs

Fields:

- id
- user_id
- filename
- source_language
- target_language
- translation_mode
- quality_score
- formatting_score
- corrections_applied
- status
- processing_time
- created_at

---

## translation_files

Fields:

- translation_job_id
- original_path
- translated_path
- report_path

---

## translation_glossary

Fields:

- original_term
- translated_term
- created_by

---

# Success Criteria

The module should:

- Preserve formatting accurately
- Preserve charts and tables
- Preserve formulas in Excel
- Preserve speaker notes in PowerPoint
- Support enterprise glossary management
- Support multi-provider LLM translation
- Provide real-time progress
- Provide translation quality scoring
- Match the existing DocuGen AI design system exactly
- Feel like a native module of the platform
- Be production-ready and scalable