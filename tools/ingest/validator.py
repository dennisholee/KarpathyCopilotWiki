"""Schema validator for wiki pages."""

import json
import re
from typing import Any, Dict, List, Tuple


WIKI_PAGE_SCHEMA = {
    "type": "object",
    "required": ["title", "summary", "tags", "links", "content", "filename"],
    "properties": {
        "title": {"type": "string"},
        "summary": {"type": "string"},
        "tags": {"type": "array", "items": {"type": "string"}},
        "links": {"type": "array", "items": {"type": "string"}},
        "content": {"type": "string"},
        "filename": {"type": "string", "pattern": r"^\d{8}\d{2}\.md$"},
        "needs_source": {"type": "boolean"},
    },
}


def validate_wiki_page(page_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validate a wiki page against the schema.
    
    Args:
        page_data: Dictionary with page fields (title, summary, tags, links, content, filename).
    
    Returns:
        Tuple of (is_valid, error_messages).
    """
    errors = []
    
    # Check required fields
    required_fields = WIKI_PAGE_SCHEMA["required"]
    for field in required_fields:
        if field not in page_data:
            errors.append(f"Missing required field: {field}")
    
    # Check field types
    properties = WIKI_PAGE_SCHEMA["properties"]
    for field_name, field_value in page_data.items():
        if field_name not in properties:
            continue  # Optional or extra fields are allowed
        
        field_schema = properties[field_name]
        expected_type = field_schema.get("type")
        
        if expected_type == "string":
            if not isinstance(field_value, str):
                errors.append(f"Field '{field_name}' must be a string, got {type(field_value).__name__}")
        elif expected_type == "array":
            if not isinstance(field_value, list):
                errors.append(f"Field '{field_name}' must be an array, got {type(field_value).__name__}")
            elif field_name in ["tags", "links"]:
                # Items should be strings
                for i, item in enumerate(field_value):
                    if not isinstance(item, str):
                        errors.append(f"Field '{field_name}[{i}]' must be a string, got {type(item).__name__}")
        elif expected_type == "boolean":
            if not isinstance(field_value, bool):
                errors.append(f"Field '{field_name}' must be boolean, got {type(field_value).__name__}")
    
    # Validate filename pattern
    if "filename" in page_data:
        pattern = properties["filename"]["pattern"]
        if not re.match(pattern, page_data["filename"]):
            errors.append(f"Filename '{page_data['filename']}' does not match pattern {pattern}")
    
    # Validate that links contains at least one /raw path (traceability requirement)
    if "links" in page_data:
        has_raw_link = any(link.startswith("/raw") for link in page_data["links"])
        if not has_raw_link and not page_data.get("needs_source"):
            errors.append("Page must include at least one /raw source link or be marked needs_source=true")
    
    # Validate tags are not empty
    if "tags" in page_data and not page_data["tags"]:
        errors.append("Field 'tags' cannot be empty")
    
    # Validate summary is not empty
    if "summary" in page_data and not page_data["summary"].strip():
        errors.append("Field 'summary' cannot be empty")
    
    return len(errors) == 0, errors


def extract_page_metadata_from_markdown(content: str) -> Dict[str, Any]:
    """
    Extract page metadata from Markdown front matter or labeled sections.
    
    Supports two formats:
    
    Format 1 (Labeled sections):
    ```
    Title: Page Title
    Summary: One-paragraph summary.
    Tags: tag1,tag2
    Links:
    - /raw/source.pdf
    - /wiki/other-page.md
    Content:
    ... body text ...
    ```
    
    Format 2 (Markdown headers):
    ```
    # Page Title
    
    Summary: One-paragraph summary.
    Tags: tag1,tag2
    Links:
    - /raw/source.pdf
    
    Content...
    ```
    
    Args:
        content: Markdown file content.
    
    Returns:
        Dictionary with extracted fields.
    """
    data = {
        "title": "",
        "summary": "",
        "tags": [],
        "links": [],
        "content": "",
    }
    
    lines = content.split("\n")
    body_lines = []
    body_start_idx = 0
    
    i = 0
    
    # Check for Markdown header as title (# format)
    if i < len(lines) and lines[i].startswith("# "):
        data["title"] = lines[i].replace("#", "").strip()
        i += 1
        # Skip blank line after title if present
        if i < len(lines) and not lines[i].strip():
            i += 1
    
    # Parse metadata sections
    while i < len(lines):
        line = lines[i]
        
        # Check for labeled sections
        if line.startswith("Title:"):
            data["title"] = line.replace("Title:", "").strip()
            i += 1
        elif line.startswith("Summary:"):
            data["summary"] = line.replace("Summary:", "").strip()
            i += 1
        elif line.startswith("Tags:"):
            tags_str = line.replace("Tags:", "").strip()
            data["tags"] = [t.strip() for t in tags_str.split(",") if t.strip()]
            i += 1
        elif line.startswith("Links:"):
            # Collect indented lines as links
            i += 1
            while i < len(lines) and (lines[i].startswith("-") or lines[i].startswith("  ")):
                link_line = lines[i].strip()
                if link_line.startswith("-"):
                    link_line = link_line[1:].strip()
                if link_line:
                    data["links"].append(link_line)
                i += 1
        elif line.startswith("Content:") or line.startswith("---"):
            # Everything after is body content
            i += 1
            body_start_idx = i
            break
        elif not line.strip():
            # Blank line might separate metadata from body
            i += 1
        else:
            # If we encounter non-metadata line and haven't found "Content:" section,
            # assume rest is body (for Format 2)
            body_start_idx = i
            break
    
    # Collect body content
    body_lines = lines[body_start_idx:]
    data["content"] = "\n".join(body_lines).strip()
    
    return data
