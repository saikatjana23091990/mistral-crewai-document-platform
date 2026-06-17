from pathlib import Path
import json

def parse_pdf(path):
    import fitz
    doc = fitz.open(path)
    text = ""

    for page in doc:
        text += page.get_text()

    return text

def parse_docx(path):
    from docx import Document
    doc = Document(path)
    return "\n".join([p.text for p in doc.paragraphs])

def parse_txt(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def parse_xlsx(path):
    import pandas as pd
    sheets = pd.read_excel(path, sheet_name=None)
    lines = []
    for sheet_name, sheet_df in sheets.items():
        lines.append(f"Sheet: {sheet_name}")
        lines.append(sheet_df.fillna("").to_csv(index=False))
    return "\n".join(lines)

def parse_csv(path):
    import pandas as pd
    df = pd.read_csv(path)
    return df.fillna("").to_csv(index=False)

def parse_json(path):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return json.dumps(data, indent=2, ensure_ascii=False)

def parse_md(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def parse_document(path):

    ext = Path(path).suffix.lower()

    if ext == ".pdf":
        return parse_pdf(path)

    elif ext == ".docx":
        return parse_docx(path)

    elif ext == ".txt":
        return parse_txt(path)

    elif ext in (".xlsx", ".xls"):
        return parse_xlsx(path)

    elif ext == ".csv":
        return parse_csv(path)

    elif ext == ".json":
        return parse_json(path)

    elif ext == ".md":
        return parse_md(path)

    else:
        raise Exception(f"Unsupported file format: {ext}")