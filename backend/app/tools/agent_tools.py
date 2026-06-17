import re
from typing import Dict, Any

def calculator_tool(expression: str) -> Dict[str, Any]:
    """Simple calculator tool for numerical reasoning."""
    try:
        # Safe evaluation
        allowed_names = {"__builtins__": {}}
        result = eval(expression, allowed_names, {})
        return {"success": True, "result": result, "expression": expression}
    except Exception as e:
        return {"success": False, "error": str(e), "expression": expression}


def compare_documents_tool(doc1_content: str, doc2_content: str, focus: str = "differences") -> str:
    """Basic document comparison tool."""
    # Very simple comparison
    words1 = set(doc1_content.lower().split())
    words2 = set(doc2_content.lower().split())
    
    common = words1 & words2
    only_in_1 = words1 - words2
    only_in_2 = words2 - words1
    
    if focus == "differences":
        return f"Common terms: {len(common)}\nUnique to Doc 1: {len(only_in_1)}\nUnique to Doc 2: {len(only_in_2)}"
    return f"Overlap: {len(common)} terms"


# Tool registry
AVAILABLE_TOOLS = {
    "calculator": calculator_tool,
    "compare_documents": compare_documents_tool
}

def execute_tool(tool_name: str, **kwargs) -> Dict[str, Any]:
    if tool_name not in AVAILABLE_TOOLS:
        return {"success": False, "error": f"Tool '{tool_name}' not found"}
    return AVAILABLE_TOOLS[tool_name](**kwargs)