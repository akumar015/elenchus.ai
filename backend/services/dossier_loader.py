"""
In-Context Dossier Loader for elenchus.ai.
Reads rich Markdown dossiers from backend/data/dossiers/ with fallback to topic summaries.
"""

from pathlib import Path

_DOSSIER_DIR= Path(__file__).parent.parent/ "data" / "dossiers"

def load_topic_dossier(topic_id: str, fallback_summary: str= "")-> str:

    """
    Load full Markdown dossier for a topic ID.
    If no dedicated dossier exists (e.g. for dynamic URL Sparks),
    returns a synthetic dossier using the fallback summary.
    """

    dossier_file= _DOSSIER_DIR/ f"{topic_id}.md"
    if dossier_file.exists():
        try:
            return dossier_file.read_text(encoding="utf-8").strip()

        except Exception:
            pass

    # clean fallback format for custom sparks or topics without dedicated markdown 

    return (
        f"# Topic: {topic_id}\n\n"
        f"## Sumary & Context\n{fallback_summary}\n"
    )