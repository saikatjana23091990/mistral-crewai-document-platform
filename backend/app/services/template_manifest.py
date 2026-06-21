import re
import pandas as pd
from pathlib import Path
from pptx import Presentation
from docx import Document

def build_field_manifest(reference_path: str) -> list:
    """
    Parses a reference template (PPTX, DOCX, XLSX) and returns a structural manifest
    of fillable slots. 
    Each slot includes:
    - slot_id: unique identifier
    - target_label: The actual literal text that needs replacement
    - hint_text: Any instructional text inside the placeholder (e.g. "Insert approved indication")
    - format: type of slot (text, chart, etc)
    """
    ext = Path(reference_path).suffix.lower()
    manifest = []
    
    if ext in [".xlsx", ".xls"]:
        return _build_xlsx_manifest(reference_path)
    elif ext == ".docx":
        return _build_docx_manifest(reference_path)
    elif ext == ".pptx":
        return _build_pptx_manifest(reference_path)
    
    return manifest

def _build_xlsx_manifest(reference_path: str) -> list:
    manifest = []
    try:
        df = pd.read_excel(reference_path)
        for idx, col in enumerate(df.columns):
            col_str = str(col)
            manifest.append({
                "slot_id": f"col_{idx}",
                "target_label": col_str,
                "hint_text": f"Column {col_str}",
                "format": "table_column"
            })
    except Exception:
        pass
    return manifest

def _extract_placeholders_from_text(text: str) -> list:
    """Find placeholder patterns and return (full_match, inner_text_hint)."""
    results = []
    # Match <...>
    for m in re.finditer(r'<([^>]+)>', text):
        results.append((m.group(0), m.group(1)))
    # Match [bracketed]
    for m in re.finditer(r'\[([^\]]+)\]', text):
        results.append((m.group(0), m.group(1)))
    # Match colons at end of line/phrase
    if ":" in text and text.strip().endswith(":"):
        results.append((text.strip(), ""))
    return results

def _build_docx_manifest(reference_path: str) -> list:
    manifest = []
    try:
        doc = Document(reference_path)
        for p_idx, p in enumerate(doc.paragraphs):
            if not p.text.strip(): continue
            
            placeholders = _extract_placeholders_from_text(p.text)
            for i, (full_match, hint) in enumerate(placeholders):
                # Clean up target label, e.g. "Name: <Insert Name>" -> we just replace the whole thing or the slot
                # Let's use the full text as target label if it's short, or just the match
                target_label = full_match
                if not target_label:
                    target_label = p.text.strip()
                
                manifest.append({
                    "slot_id": f"p{p_idx}_slot{i}",
                    "target_label": target_label,
                    "hint_text": hint,
                    "format": "text"
                })
    except Exception:
        pass
    return manifest

def _build_pptx_manifest(reference_path: str) -> list:
    manifest = []
    try:
        prs = Presentation(reference_path)
        for s_idx, slide in enumerate(prs.slides):
            for shape_id, shape in enumerate(slide.shapes):
                # Check for charts first
                if shape.has_chart:
                    try:
                        chart = shape.chart
                        # Extract categories and series names as hints
                        categories = [c.label for c in chart.plots[0].categories]
                        series_names = [s.name for s in chart.series]
                        
                        manifest.append({
                            "slot_id": f"slide{s_idx}_shape{shape_id}_chart",
                            "target_label": f"Chart: {shape.name}",
                            "hint_text": f"Categories: {categories}, Series: {series_names}. Output numeric values for these series.",
                            "format": "chart",
                            "chart_ref": f"shape{shape_id}"
                        })
                    except Exception:
                        pass
                
                # Check for text
                elif hasattr(shape, "text_frame") and shape.text_frame:
                    for p_idx, p in enumerate(shape.text_frame.paragraphs):
                        if not p.text.strip(): continue
                        
                        placeholders = _extract_placeholders_from_text(p.text)
                        
                        # If there are explicit placeholders
                        for i, (full_match, hint) in enumerate(placeholders):
                            # In PPTX, often the whole paragraph text is useful context
                            # For target_label, we want the exact string we will string-replace.
                            manifest.append({
                                "slot_id": f"slide{s_idx}_shape{shape_id}_p{p_idx}_slot{i}",
                                "target_label": full_match,
                                "hint_text": hint if hint else p.text.strip(),
                                "format": "text"
                            })
                        
                        # If no standard placeholders found but text looks like scaffolding or a label
                        if not placeholders and len(p.text.strip()) > 0:
                            # Heuristic: Is it a label waiting for text? e.g. "Response rate"
                            # We'll just pass it as a potential slot if it's short, or skip if long.
                            if len(p.text.strip().split()) <= 4:
                                manifest.append({
                                    "slot_id": f"slide{s_idx}_shape{shape_id}_p{p_idx}_label",
                                    "target_label": p.text.strip(),
                                    "hint_text": p.text.strip(),
                                    "format": "text"
                                })
    except Exception:
        pass
    
    # Deduplicate manifest items based on target_label
    unique_manifest = []
    seen_labels = set()
    for item in manifest:
        if item["target_label"] not in seen_labels:
            unique_manifest.append(item)
            seen_labels.add(item["target_label"])
            
    return unique_manifest
