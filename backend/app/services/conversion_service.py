import json

def run_conversion(source_text, reference_text, target_format="txt", resolutions=None):
    try:
        from crewai import Crew, Task
        from app.agents.document_agents import (
            extractor_agent,
            normalizer_agent,
            formatter_agent,
            validator_agent
        )
    except Exception as e:
        import traceback
        with open("error.log", "w") as f:
            f.write(traceback.format_exc())
        return _fallback_conversion(source_text, reference_text, target_format, resolutions)

    resolutions_str = ""
    if resolutions:
        resolutions_str = f"\n\nUSER RESOLVED CONFLICTS (prefer these values over conflicting ones):\n{json.dumps(resolutions, indent=2)}\n"

    
    extraction_task = Task(
        description=f'''
        Extract ALL information from the combined source documents into a structured, evidence-backed representation.

        EXTRACTION OBJECTIVE:
        Capture both explicit values and semantically equivalent expressions that may later map to target template fields.

        RULES:
        1. Do not omit any relevant information.
        2. Preserve original wording, numbers, dates, tables, entities, and document context.
        3. For every extracted item, include:
        - normalized_field_candidate
        - extracted_value
        - source_text_span
        - source_file
        - section/context
        - confidence (high/medium/low)
        4. Extract values even if they are not written using the exact target field label.
        5. Recognize semantically equivalent or logically related expressions, including:
        - headings, titles, summaries, bullets, labels, and narrative sentences
        - synonyms, paraphrases, abbreviations, and alternate phrasings
        - values embedded in sentences rather than in labeled fields
        6. If a value can reasonably represent a canonical business field, extract it as a candidate even when the wording differs.
        7. For person/profile data, infer likely canonical field candidates where strongly supported by context. Examples:
        - a document title like "Sarah Johnson - Resume" may indicate employee_name
        - "8+ years of experience" may indicate years_of_experience
        - current role/title near the top of the document may indicate job_title
        - employer listed in the latest work history may indicate current_employer
        8. Do not hallucinate. Only extract values that are explicitly stated or strongly and directly supported by the surrounding text.
        9. If the same canonical field appears with different values across sources, flag:
        CONFLICT: [canonical_field] - [value1] vs [value2]
        10. Keep both original text and normalized interpretation.

        CANONICAL EXTRACTION GOAL:
        Where possible, normalize content into likely business fields such as:
        employee_name, job_title, department, years_of_experience, current_employer,
        key_skills, highest_education, certifications, email, phone, work_experience, education

        COMBINED SOURCES:
        {source_text}
        {resolutions_str}
        ''',
        expected_output="""
        A structured extraction result with:
        - canonical field candidates
        - extracted values
        - evidence/source text spans
        - source file names
        - confidence levels
        - conflict flags where applicable
        """,
        agent=extractor_agent
    )

    
    normalization_task = Task(
        description=f'''
        Normalize the extracted content into target-ready canonical fields before formatting.

        OBJECTIVE:
        Resolve semantic variation between source wording and target template fields.

        INSTRUCTIONS:
        1. Compare extracted candidates against the reference document fields/sections.
        2. Map semantically equivalent expressions to the most appropriate target field even if labels differ.
        3. Use logical/document-context reasoning for obvious mappings, including:
        - top document name/header -> employee_name
        - professional summary statements like "X years of experience" -> years_of_experience
        - most recent role title near the profile header -> job_title
        - latest employer in chronological experience -> current_employer
        - skill lists -> key_skills
        - highest degree earned -> highest_education
        - professional certificates -> certifications
        4. Prefer fields supported by stronger evidence and clearer context.
        5. If multiple candidates exist for one target field:
        - choose the best-supported value
        - retain alternates
        - note confidence and rationale
        6. If a value is inferable only through weak association, do not map it as final; keep it as low-confidence candidate.
        7. Never invent missing data.
        8. Produce a mapping rationale for every target field:
        - target_field
        - chosen_value
        - source_evidence
        - why this was mapped
        - confidence
        - conflict/resolution note if applicable

        TARGET REFERENCE STRUCTURE:
        {reference_text}
        ''',
        expected_output="""
        Normalized mapping table with:
        - target field
        - chosen value
        - semantic source match
        - evidence
        - confidence
        - conflict note if any
        """,
        agent=normalizer_agent
    )






    formatting_instructions = f'''
        Convert the normalized mapped content into the REFERENCE structure exactly.

        TARGET FORMAT: {target_format.upper()}
        REFERENCE DOCUMENT STRUCTURE:
        {reference_text}

        CRITICAL RULES:
        1. Follow the exact structure, sections, rows, columns, and field order from the reference.
        2. Use the normalized mapping output as the primary source for field population.
        3. Populate a reference field when there is a strong semantic or logical match, even if the source wording differs from the reference label.
        4. Do not require exact string matches between source labels and target labels.
        5. For any field present in the reference but not supported by source evidence, write:
        "[Information not found in source documents]"
        6. If a mapped value required semantic interpretation, still populate it, but preserve the original meaning accurately.
        7. If there were conflicts across sources, note the chosen value and mention that conflict resolution was applied. Prefer USER RESOLVED CONFLICTS if provided.
        8. Do not invent or over-infer data.
        9. Preserve numeric precision, dates, entities, and lists wherever applicable.

        OUTPUT PRINCIPLE:
        If a reasonable human reviewer would consider the source content an obvious match for a reference field, populate that field using the best supported source value.
    '''

    if target_format in ["docx", "xlsx", "pptx"]:
        formatting_instructions += '''
        
        CRITICAL EXTRAC RULES FOR STRUCTURED TARGETS:
        You MUST output ONLY a valid JSON object and nothing else (no markdown wrappers like ```json, no conversational text).
        If the target is 'pptx' (PowerPoint), you MUST heavily summarize the extracted content to fit into graphical placeholders while keeping the core message intact.
        The JSON MUST have this exact structure:
        {
          "fields": {
             "Field Name 1 from reference": "Mapped Value 1",
             "Field Name 2 from reference": "Mapped Value 2"
          },
          "tables": [
            {
               "headers": ["Header 1", "Header 2"],
               "rows": [
                 ["Row 1 Col 1", "Row 1 Col 2"],
                 ["Row 2 Col 1", "Row 2 Col 2"]
               ]
            }
          ]
        }
        '''
        expected_output = "A valid JSON object containing 'fields' and 'tables' mapping the values to the reference structure."
    else:
        expected_output = "Output strictly following the reference format with semantically mapped values and missing info clearly marked"

    formatting_task = Task(
        description=formatting_instructions,
        expected_output=expected_output,
        agent=formatter_agent
    )



    validation_task = Task(
        description='''
        Validate the final output for both structural compliance and semantic mapping quality.

        VALIDATION CHECKS:
        1. All reference sections/rows/columns/fields are addressed.
        2. Missing information is explicitly labeled as "[Information not found in source documents]".
        3. No hallucinations or unsupported values.
        4. Conflicts are handled using provided resolutions if available.
        5. Check for missed semantic mappings:
        - Was any target field left blank/missing even though a semantically equivalent value existed in source text?
        - Were obvious logical mappings ignored because the source used different wording?
        6. For every populated field, confirm there is source evidence.
        7. For every missing field, confirm there was no sufficiently supported semantic match.
        8. Flag cases where the formatter was too literal and failed to map an obvious equivalent.

        REQUIRED OUTPUT:
        - validation_status
        - structural_issues
        - hallucination_check
        - missed_semantic_mapping_check
        - conflict_handling_check
        - final_recommendation
        ''',
        expected_output="Detailed validation report including missed semantic mapping assessment",
        agent=validator_agent
    )


    crew = Crew(
        agents=[
            extractor_agent,
            normalizer_agent,
            formatter_agent
        ],
        tasks=[
            extraction_task,
            normalization_task,
            formatting_task
        ],
        verbose=True
    )

    try:
        result = crew.kickoff()
        return str(result)
    except Exception as e:
        import traceback
        with open("error.log", "w") as f:
            f.write(traceback.format_exc())
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
