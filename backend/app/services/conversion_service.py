import json

def run_conversion(source_text, reference_text, target_format="txt", resolutions=None):
    try:
        from crewai import Crew, Task
        from app.agents.document_agents import (
            extractor_agent,
            formatter_agent,
            validator_agent
        )
    except Exception:
        return _fallback_conversion(source_text, reference_text, target_format, resolutions)

    resolutions_str = ""
    if resolutions:
        resolutions_str = f"\n\nUSER RESOLVED CONFLICTS (prefer these values over conflicting ones):\n{json.dumps(resolutions, indent=2)}\n"

    extraction_task = Task(
        description=f'''
        Extract ALL information from the combined source documents.

        Rules:
        - No omission of any data
        - Preserve numbers, dates, tables, entities
        - Note the source file for each piece of information
        - If the same field appears in multiple sources with different values, flag it as CONFLICT: [field] - values from different sources

        COMBINED SOURCES:
        {source_text}
        {resolutions_str}
        ''',
        expected_output="Structured extraction with conflict flags if any",
        agent=extractor_agent
    )

    formatting_task = Task(
        description=f'''
        Convert the extracted content to match the REFERENCE structure exactly.

        TARGET FORMAT: {target_format.upper()}
        REFERENCE DOCUMENT STRUCTURE:
        {reference_text}

        CRITICAL RULES:
        1. Follow the exact structure/sections/columns from the reference.
        2. For any field or section present in the reference but NOT found in any source documents, explicitly write: "[Information not found in source documents]"
        3. If there were conflicts across sources, note the chosen value and that it required resolution. Prefer the USER RESOLVED CONFLICTS if provided.
        4. Do not invent data.
        ''',
        expected_output="Output strictly following the reference format with missing info clearly marked",
        agent=formatter_agent
    )

    validation_task = Task(
        description='''
        Validate the output:
        - All reference sections/columns are addressed
        - Missing information is explicitly labeled as "[Information not found in source documents]"
        - No hallucinations
        - Conflicts (if any) are handled using provided resolutions if available
        ''',
        expected_output="Validation report",
        agent=validator_agent
    )

    crew = Crew(
        agents=[
            extractor_agent,
            formatter_agent,
            validator_agent
        ],
        tasks=[
            extraction_task,
            formatting_task,
            validation_task
        ],
        verbose=True
    )

    try:
        result = crew.kickoff()
        return str(result)
    except Exception:
        return _fallback_conversion(source_text, reference_text, target_format, resolutions)

def _fallback_conversion(source_text, reference_text, target_format="txt", resolutions=None):
    source = (source_text or "").strip()
    reference = (reference_text or "").strip()

    if len(source) > 6000:
        source = source[:6000] + "\n\n...[truncated]..."

    header = f"=== CONVERTED DOCUMENT (Target: {target_format.upper()}) ===\n\n"

    resolutions_note = ""
    if resolutions:
        resolutions_note = f"\n\nUsing these resolved values: {json.dumps(resolutions)}\n"

    if target_format == "xlsx":
        # Produce structured key-value that the xlsx generator can parse easily
        return header + (
            "Reference Columns: " + reference[:500] + "\n\n"
            "EXTRACTED STRUCTURED DATA (map to columns above):\n" +
            source + resolutions_note + "\n\n"
            "Instructions: For each reference column, output 'ColumnName: value' on new lines. "
            "Use exact numbers/dates from sources. Use '[Information not found in source documents]' for missing."
        )
    else:
        return header + (
            "Reference Format / Structure:\n" + reference[:2000] + "\n\n"
            "Combined Source Content from multiple documents:\n" + source + resolutions_note + "\n\n"
            "Instructions for output: Follow the reference structure exactly. "
            "Mark any information present in the reference but missing from sources as: [Information not found in source documents]"
        )
