from fastapi import FastAPI, UploadFile, File, Request, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from app.parsers.document_parser import parse_document
from app.services.conversion_service import run_conversion
from app.rag.rag_engine import build_rag, build_multi_rag
import json
import shutil
from pathlib import Path
from datetime import datetime, timezone
import time
import pandas as pd
import re
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from docx import Document
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("outputs")
STATS_FILE = Path("stats.json")
HISTORY_FILE = Path("history.json")

UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

rag_sessions = {}
chat_documents = {}

DEFAULT_STATS = {
    "documents_converted": 0,
    "chat_interactions": 0,
    "api_calls": 0,
}
DEFAULT_HISTORY = []

def load_stats():
    if STATS_FILE.exists():
        with open(STATS_FILE, encoding="utf-8") as f:
            return {**DEFAULT_STATS, **json.load(f)}
    return DEFAULT_STATS.copy()

def save_stats(stats):
    with open(STATS_FILE, "w", encoding="utf-8") as f:
        json.dump(stats, f)

def load_history():
    if HISTORY_FILE.exists():
        with open(HISTORY_FILE, encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) else DEFAULT_HISTORY.copy()
    return DEFAULT_HISTORY.copy()

def save_history(history):
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f)

stats = load_stats()
conversion_history = load_history()

@app.middleware("http")
async def count_api_calls(request: Request, call_next):
    response = await call_next(request)
    if request.url.path not in ("/", "/stats"):
        stats["api_calls"] += 1
        save_stats(stats)
    return response

@app.get("/")
def health():
    return {"status": "running"}

@app.get("/stats")
def get_stats():
    return stats

@app.get("/history")
def get_history():
    return {"records": conversion_history}

def get_target_format(reference_filename: str) -> str:
    """Determine target output format from reference file extension."""
    ext = Path(reference_filename).suffix.lower()
    if ext in (".xlsx", ".xls"):
        return "xlsx"
    elif ext == ".csv":
        return "csv"
    elif ext == ".json":
        return "json"
    elif ext == ".md":
        return "md"
    elif ext == ".docx":
        return "docx"
    elif ext == ".pdf":
        return "pdf"
    elif ext == ".pptx":
        return "pptx"
    else:
        return "txt"

def _get_reference_columns(reference_path: str) -> list:
    """Try to extract column names from an xlsx reference file."""
    try:
        if reference_path.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(reference_path)
            return [str(c) for c in df.columns]
    except Exception:
        pass
    return []

def _extract_data_for_columns(source_text: str, columns: list) -> dict:
    """Dynamic extraction using reference columns + heuristics for sales data."""
    data = {col: "" for col in columns}
    for col in columns:
        cl = col.lower().strip()
        # Try exact column mention
        pat = rf'{re.escape(cl)}[:\-\s]+([^\n\r,]+)'
        m = re.search(pat, source_text, re.IGNORECASE)
        if m:
            val = m.group(1).strip()
            if val:
                data[col] = val
                continue

        # Quarter
        if 'quarter' in cl:
            m = re.search(r'Quarter:\s*([Q\d\s]+)', source_text, re.IGNORECASE)
            if m: data[col] = m.group(1).strip()
            else:
                m = re.search(r'(Q[1-4]\s*\d{4})', source_text)
                if m: data[col] = m.group(1)
        # Region
        elif 'region' in cl:
            m = re.search(r'Region:\s*([A-Za-z\s]+)', source_text, re.IGNORECASE)
            if m: data[col] = m.group(1).strip()
        # Sales Figure / Total Sales
        elif 'sales' in cl or 'figure' in cl:
            m = re.search(r'Total Sales:\s*\$?([\d,]+)', source_text, re.IGNORECASE)
            if m: data[col] = m.group(1)
            else:
                m = re.search(r'\$?([\d,]+\.?\d*)', source_text)
                if m: data[col] = m.group(1)
        # Source
        elif 'source' in cl:
            m = re.search(r'Prepared By:\s*([A-Za-z\s]+)', source_text, re.IGNORECASE)
            if m: data[col] = m.group(1).strip()
        # Date / Timestamp
        elif 'date' in cl or 'timestamp' in cl:
            m = re.search(r'(\d{4}-\d{2}-\d{2})', source_text)
            if m: data[col] = m.group(1)

    return data

def detect_conflicts(source_data_list: list, reference_columns: list = None) -> list:
    """Use actual reference columns for conflict detection."""
    conflicts = []
    if not reference_columns:
        reference_columns = ["Quarter", "Region", "Final Sales Figure"]
    for col in reference_columns:
        cl = col.lower()
        vals = []
        for sf in source_data_list:
            text = sf["text"]
            val = ""
            if 'quarter' in cl:
                m = re.search(r'Quarter:\s*([^\n]+)', text, re.IGNORECASE)
                val = m.group(1).strip() if m else ""
            elif 'region' in cl:
                m = re.search(r'Region:\s*([^\n]+)', text, re.IGNORECASE)
                val = m.group(1).strip() if m else ""
            elif 'sales' in cl or 'figure' in cl:
                m = re.search(r'Total Sales:\s*\$?([\d,]+)', text, re.IGNORECASE)
                val = m.group(1) if m else ""
            if val:
                vals.append({"source": sf["name"], "value": val})
        if len(vals) > 1:
            unique = set(v["value"] for v in vals)
            if len(unique) > 1:
                conflicts.append({"field": col, "values": vals})
    return conflicts

def generate_output_file(converted_text: str, target_format: str, source_stem: str, timestamp: str, reference_columns: list = None, reference_path: str = None) -> tuple[Path, str]:
    if target_format == "xlsx":
        wb = Workbook()
        ws = wb.active
        ws.title = "Converted Data"

        header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
        header_font = Font(bold=True, color="FFFFFF")
        thin_border = Border(
            left=Side(style='thin'),
            right=Side(style='thin'),
            top=Side(style='thin'),
            bottom=Side(style='thin')
        )

        columns = reference_columns if reference_columns else [
            "Quarter", "Region", "Final Sales Figure", "Source Selected", 
            "Alternative Values", "Reviewer", "Resolution Notes", "Approval Timestamp"
        ]

        for col_idx, col_name in enumerate(columns, start=1):
            cell = ws.cell(row=1, column=col_idx, value=col_name)
            cell.fill = header_fill
            cell.font = header_font
            cell.border = thin_border
            cell.alignment = Alignment(wrap_text=True)

        # Parse the JSON from converted_text
        rows_to_write = []
        try:
            cleaned_text = converted_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            elif cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            data = json.loads(cleaned_text.strip())
            
            fields = data.get("fields", {})
            tables = data.get("tables", [])
            
            # If there's a table that seems to match our columns, use its rows
            if tables:
                target_table = tables[0]
                for tbl in tables:
                    # check if headers overlap well with our columns
                    headers = tbl.get("headers", [])
                    if any(h.lower() in [c.lower() for c in columns] for h in headers if h):
                        target_table = tbl
                        break
                        
                headers = target_table.get("headers", [])
                for row_data in target_table.get("rows", []):
                    row_dict = dict(fields) # Start with base fields
                    for i, val in enumerate(row_data):
                        if i < len(headers) and headers[i]:
                            row_dict[headers[i]] = val
                    rows_to_write.append(row_dict)
            else:
                rows_to_write.append(fields)
                
        except Exception:
            # Fallback if json parsing fails
            rows_to_write = [{}]

        if not rows_to_write:
            rows_to_write = [{}]

        current_row = 2
        for row_dict in rows_to_write:
            for col_idx, col_name in enumerate(columns, start=1):
                # case-insensitive match
                matched_val = "[Information not found in source documents]"
                for k, v in row_dict.items():
                    if k.lower() in col_name.lower() or col_name.lower() in k.lower():
                        matched_val = v
                        break
                cell = ws.cell(row=current_row, column=col_idx, value=str(matched_val))
                cell.border = thin_border
                cell.alignment = Alignment(wrap_text=True, vertical='top')
            current_row += 1

        for col_idx in range(1, len(columns) + 1):
            col_letter = chr(64 + col_idx) if col_idx <= 26 else 'A'
            ws.column_dimensions[col_letter].width = 22

        filename = f"{source_stem}_converted_{timestamp}.xlsx"
        output_path = OUTPUT_DIR / filename
        wb.save(output_path)
        return output_path, filename

    elif target_format == "docx":
        if reference_path and Path(reference_path).exists():
            doc = Document(reference_path)
        else:
            doc = Document()
            doc.add_heading("Converted Document", level=1)
            
        try:
            clean_text = converted_text.strip()
            # Clean markdown if present
            cleaned_text = converted_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            elif cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            cleaned_text = cleaned_text.strip()
            
            data = json.loads(cleaned_text)
            
            # Map fields to paragraphs
            import re
            fields = data.get("fields", {})
            for p in doc.paragraphs:
                for key, val in fields.items():
                    if key and key.lower() in p.text.lower() and val:
                        original_text = p.text
                        if re.search(r'_{3,}', p.text):
                            p.text = re.sub(r'_{3,}', str(val), p.text, count=1)
                        elif ":" in p.text and p.text.strip().endswith(":"):
                            p.text = p.text + " " + str(val)
                        elif key.lower() == p.text.strip().lower():
                            p.text = p.text + ": " + str(val)
                        
                        # Stop checking other keys if we modified this paragraph
                        if p.text != original_text:
                            break

            # Map tables
            tables_data = data.get("tables", [])
            for table_data in tables_data:
                headers = table_data.get("headers", [])
                rows = table_data.get("rows", [])
                
                target_table = None
                for t in doc.tables:
                    if len(t.rows) > 0:
                        doc_headers = [c.text.strip() for c in t.rows[0].cells]
                        if all(h in doc_headers for h in headers if h) or all(h in headers for h in doc_headers if h):
                            target_table = t
                            break
                
                if target_table:
                    for row_data in rows:
                        row_cells = target_table.add_row().cells
                        for i, cell_val in enumerate(row_data):
                            if i < len(row_cells):
                                row_cells[i].text = str(cell_val)
                else:
                    if headers and rows:
                        doc.add_paragraph()
                        new_t = doc.add_table(rows=1, cols=len(headers))
                        new_t.style = 'Table Grid'
                        hdr_cells = new_t.rows[0].cells
                        for i, h in enumerate(headers):
                            hdr_cells[i].text = str(h)
                        for row_data in rows:
                            row_cells = new_t.add_row().cells
                            for i, cell_val in enumerate(row_data):
                                if i < len(row_cells):
                                    row_cells[i].text = str(cell_val)
                                    
        except json.JSONDecodeError:
            if not reference_path or not Path(reference_path).exists():
                for line in converted_text.split("\n"):
                    if line.strip():
                        doc.add_paragraph(line.strip())
            else:
                doc.add_paragraph("\n--- Converted Data ---\n")
                for line in converted_text.split("\n"):
                    if line.strip():
                        doc.add_paragraph(line.strip())

        filename = f"{source_stem}_converted_{timestamp}.docx"
        output_path = OUTPUT_DIR / filename
        doc.save(output_path)
        return output_path, filename

    elif target_format == "pptx":
        from pptx import Presentation
        import re
        if reference_path and Path(reference_path).exists():
            prs = Presentation(reference_path)
        else:
            prs = Presentation()
            prs.slides.add_slide(prs.slide_layouts[0])
            
        try:
            cleaned_text = converted_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            elif cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            
            data = json.loads(cleaned_text.strip())
            fields = data.get("fields", {})
            
            for slide in prs.slides:
                for shape in slide.shapes:
                    if hasattr(shape, "text_frame") and shape.text_frame:
                        for p in shape.text_frame.paragraphs:
                            for key, val in fields.items():
                                if key and key.lower() in p.text.lower() and val:
                                    original_text = p.text
                                    new_text = original_text
                                    
                                    # Replace specific placeholders like <__>, <XX%>, <PRODUCT NAME>
                                    if re.search(r'<[^>]+>', p.text):
                                        new_text = re.sub(r'<[^>]+>', str(val), p.text, count=1)
                                    # Handle underscore blanks
                                    elif re.search(r'_{3,}', p.text):
                                        new_text = re.sub(r'_{3,}', str(val), p.text, count=1)
                                    # Handle colons
                                    elif ":" in p.text and p.text.strip().endswith(":"):
                                        new_text = p.text + " " + str(val)
                                    # Exact match
                                    elif key.lower() == p.text.strip().lower():
                                        new_text = p.text.replace(p.text.strip(), str(val))
                                    
                                    if new_text != original_text:
                                        if p.runs:
                                            p.runs[0].text = new_text
                                            for idx in range(1, len(p.runs)):
                                                p.runs[idx].text = ""
                                        else:
                                            p.text = new_text
                                        break
                                        
                    # Map tables (populate existing rows only, as python-pptx doesn't support adding rows natively)
                    if shape.has_table:
                        tables_data = data.get("tables", [])
                        for table_data in tables_data:
                            headers = table_data.get("headers", [])
                            rows = table_data.get("rows", [])
                            
                            if len(shape.table.rows) > 0:
                                doc_headers = [c.text_frame.text.strip() for c in shape.table.rows[0].cells if c.text_frame]
                                if all(h in doc_headers for h in headers if h) or all(h in headers for h in doc_headers if h):
                                    for row_idx, row_data in enumerate(rows):
                                        target_row_idx = row_idx + 1 # skip header
                                        if target_row_idx < len(shape.table.rows):
                                            row_cells = shape.table.rows[target_row_idx].cells
                                            for col_idx, cell_val in enumerate(row_data):
                                                if col_idx < len(row_cells):
                                                    row_cells[col_idx].text = str(cell_val)
                                    break
                                    
        except Exception:
            pass # fallback or ignore if json fails for pptx

        filename = f"{source_stem}_converted_{timestamp}.pptx"
        output_path = OUTPUT_DIR / filename
        prs.save(output_path)
        return output_path, filename

    elif target_format == "pdf":
        filename = f"{source_stem}_converted_{timestamp}.pdf"
        output_path = OUTPUT_DIR / filename
        c = canvas.Canvas(str(output_path), pagesize=letter)
        width, height = letter
        c.setFont("Helvetica-Bold", 14)
        c.drawString(72, height - 50, "Converted Document")
        c.setFont("Helvetica", 10)
        y = height - 80
        for line in converted_text.split("\n"):
            if y < 50:
                c.showPage()
                c.setFont("Helvetica", 10)
                y = height - 50
            c.drawString(72, y, line[:85])
            y -= 12
        c.save()
        return output_path, filename

    else:
        filename = f"{source_stem}_converted_{timestamp}.txt"
        output_path = OUTPUT_DIR / filename
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(converted_text)
        return output_path, filename

@app.post("/convert")
async def convert_document(
    source_files: list[UploadFile] = File(...),
    reference_file: UploadFile = File(...),
    resolutions: str = Form(default=None)
):
    start_time = time.perf_counter()

    if not source_files:
        raise HTTPException(status_code=400, detail="At least one source file is required")

    reference_path = UPLOAD_DIR / reference_file.filename
    with open(reference_path, "wb") as buffer:
        shutil.copyfileobj(reference_file.file, buffer)

    source_data_list = []
    source_filenames = []
    total_source_size = 0

    for source_file in source_files:
        source_path = UPLOAD_DIR / source_file.filename
        with open(source_path, "wb") as buffer:
            shutil.copyfileobj(source_file.file, buffer)
        try:
            text = parse_document(str(source_path))
            source_data_list.append({"name": source_file.filename, "text": text})
            source_filenames.append(source_file.filename)
            total_source_size += source_path.stat().st_size if source_path.exists() else 0
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Failed to parse {source_file.filename}: {exc}") from exc

    combined_source_text = "\n\n".join([f"=== SOURCE: {sf['name']} ===\n{sf['text']}" for sf in source_data_list])

    try:
        reference_text = parse_document(str(reference_path))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    target_format = get_target_format(reference_file.filename)
    reference_columns = _get_reference_columns(str(reference_path)) if target_format == "xlsx" else None

    resolutions_dict = None
    if resolutions:
        try:
            resolutions_dict = json.loads(resolutions)
        except Exception:
            pass

    detected_conflicts = detect_conflicts(source_data_list, reference_columns)

    try:
        import asyncio
        converted_output = await asyncio.to_thread(
            run_conversion,
            combined_source_text,
            reference_text,
            target_format,
            resolutions_dict
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {exc}") from exc

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    source_stem = Path(source_filenames[0]).stem if len(source_filenames) == 1 else "multi_source"

    output_path, converted_filename = generate_output_file(
        converted_output, target_format, source_stem, timestamp, reference_columns=reference_columns, reference_path=str(reference_path)
    )

    try:
        qa = build_rag(combined_source_text, source_name=", ".join(source_filenames))
        rag_sessions[", ".join(source_filenames)] = qa
    except Exception:
        pass

    stats["documents_converted"] += 1
    save_stats(stats)

    elapsed_seconds = round(time.perf_counter() - start_time, 2)

    history_record = {
        "original_document": ", ".join(source_filenames),
        "reference_document": reference_file.filename,
        "converted_document": converted_filename,
        "conversion_time_seconds": elapsed_seconds,
        "conversion_date": datetime.now(timezone.utc).isoformat(),
        "converted_by": "Admin User",
        "status": "Success",
        "source_size_bytes": total_source_size,
        "output_size_bytes": output_path.stat().st_size if output_path.exists() else 0,
        "download_url": f"/download/{converted_filename}",
        "target_format": target_format,
        "num_sources": len(source_filenames)
    }
    conversion_history.insert(0, history_record)
    save_history(conversion_history)

    preview_text = str(converted_output)[:2000]

    return {
        "message": "Conversion complete" if not resolutions_dict else "Final document generated after conflict resolution",
        "download_url": f"/download/{converted_filename}",
        "preview": preview_text,
        "target_format": target_format,
        "converted_filename": converted_filename,
        "num_sources": len(source_filenames),
        "conflicts": detected_conflicts
    }

@app.get("/download/{filename}")
async def download_file_by_name(filename: str):
    target = OUTPUT_DIR / filename
    if not target.exists():
        raise HTTPException(status_code=404, detail="Converted file not found")

    ext = Path(filename).suffix.lower()
    if ext == ".xlsx":
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    elif ext == ".docx":
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif ext == ".pdf":
        media_type = "application/pdf"
    elif ext == ".csv":
        media_type = "text/csv"
    elif ext == ".json":
        media_type = "application/json"
    else:
        media_type = "text/plain"

    return FileResponse(
        path=str(target),
        filename=filename,
        media_type=media_type
    )

@app.post("/chat/upload")
async def upload_chat_document(file: UploadFile = File(...)):
    file_path = UPLOAD_DIR / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    try:
        text = parse_document(str(file_path))
        provider = "mistral"  # default for uploads
        qa = build_rag(text, source_name=file.filename, provider=provider)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    rag_sessions[file.filename] = qa
    chat_documents[file.filename] = text
    return {"message": "Document indexed for chat", "filename": file.filename}

@app.post("/chat")
async def chat(payload: dict):
    raw_filenames = payload.get("filenames", []) or []
    question = payload.get("question", "")
    history = payload.get("history", []) or []
    provider = payload.get("provider", "mistral").lower()

    # Normalize: split any comma-joined filenames (from multi-source history records)
    filenames = []
    for f in raw_filenames:
        if isinstance(f, str) and "," in f:
            for part in f.split(","):
                part = part.strip()
                if part:
                    filenames.append(part)
        elif f:
            filenames.append(f)
    filenames = list(dict.fromkeys(filenames))  # dedupe preserving order

    if not filenames or not question:
        raise HTTPException(status_code=400, detail="No document selected or no question provided.")

    rag_key = f"{provider}|{', '.join(sorted(filenames))}"

    qa = None
    if rag_key in rag_sessions:
        qa = rag_sessions[rag_key]
    else:
        sources = []
        for fn in filenames:
            for base_dir in [UPLOAD_DIR, Path("outputs")]:
                path = base_dir / fn
                if path.exists():
                    try:
                        text = parse_document(str(path))
                        sources.append({"text": text, "source_name": fn})
                        break
                    except Exception:
                        continue
        if sources:
            try:
                qa = build_multi_rag(sources, provider=provider)
                rag_sessions[rag_key] = qa
            except Exception as e:
                return {"answer": f"Failed to index documents: {str(e)}", "citations": []}

    if not qa:
        try:
            path = UPLOAD_DIR / filenames[0]
            if path.exists():
                text = parse_document(str(path))
                qa = build_rag(text, source_name=filenames[0], provider=provider)
                rag_sessions[rag_key] = qa
        except:
            pass

    if not qa:
        return {"answer": "No content found for the selected documents. Please make sure the document was uploaded or converted successfully.", "citations": []}

    try:
        result = qa.run(question, history=history, provider=provider)
        return result
    except Exception as e:
        return {"answer": f"Error processing question: {str(e)}", "citations": []}
