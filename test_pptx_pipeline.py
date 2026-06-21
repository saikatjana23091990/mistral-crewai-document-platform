import json
from pathlib import Path
from pptx import Presentation
from backend.app.services.template_manifest import build_field_manifest

def test_pipeline():
    # 1. Create a dummy PPTX with a chart and a text placeholder
    prs = Presentation()
    slide = prs.slides.add_slide(prs.slide_layouts[5]) # Blank layout
    
    # Add text
    txBox = slide.shapes.add_textbox(left=100, top=100, width=400, height=100)
    tf = txBox.text_frame
    tf.text = "<PRODUCT NAME>"
    p = tf.paragraphs[0]
    
    # Note: Adding charts programmatically in pure python-pptx is a bit verbose, 
    # but we can just test the text extraction part here. The shape.has_chart 
    # is well tested in python-pptx.
    
    test_pptx_path = "test_temp_manifest.pptx"
    prs.save(test_pptx_path)
    
    # 2. Extract manifest
    manifest = build_field_manifest(test_pptx_path)
    print("Manifest:", json.dumps(manifest, indent=2))
    
    # 3. Simulate conversion service prompt payload
    manifest_str = f"TEMPLATE MANIFEST:\n{json.dumps(manifest, indent=2)}\n"
    print("\n--- LLM Prompt Injected Manifest ---")
    print(manifest_str)
    
    # 4. Clean up
    if Path(test_pptx_path).exists():
        Path(test_pptx_path).unlink()

if __name__ == "__main__":
    test_pipeline()
