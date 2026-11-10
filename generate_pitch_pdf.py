"""
Generate a pristine, single-page A4 PDF from SOLUTION_PITCH.md.
Features increased font size (9.0pt body, 11.0pt headers) with generous line spacing,
ensuring all content fits within an exact single page without overflow.
Zero third-party dependencies; uses standard PDF 1.4 specification.
"""

import os

def wrap_text(text: str, max_chars: int) -> list[str]:
    words = text.split()
    lines = []
    curr = []
    curr_len = 0
    for w in words:
        if curr_len + len(w) + (1 if curr else 0) <= max_chars:
            curr.append(w)
            curr_len += len(w) + (1 if len(curr) > 1 else 0)
        else:
            if curr:
                lines.append(" ".join(curr))
            curr = [w]
            curr_len = len(w)
    if curr:
        lines.append(" ".join(curr))
    return lines

def build_pdf(md_path: str, pdf_path: str):
    width = 595.28
    height = 841.89
    margin_x = 36.0
    content_width = width - (2 * margin_x)

    stream_cmds = []

    def set_fill_rgb(r, g, b):
        stream_cmds.append(f"{r:.3f} {g:.3f} {b:.3f} rg")

    def set_stroke_rgb(r, g, b):
        stream_cmds.append(f"{r:.3f} {g:.3f} {b:.3f} RG")

    def set_line_width(w):
        stream_cmds.append(f"{w:.2f} w")

    def draw_rect(x, y, w, h, fill=True, stroke=False):
        op = "B" if (fill and stroke) else ("f" if fill else "S")
        stream_cmds.append(f"{x:.2f} {y:.2f} {w:.2f} {h:.2f} re {op}")

    def draw_line(x1, y1, x2, y2):
        stream_cmds.append(f"{x1:.2f} {y1:.2f} m {x2:.2f} {y2:.2f} l S")

    def draw_text(x, y, font, size, text, r=0.06, g=0.09, b=0.16):
        clean_text = (
            text.replace("\u2014", "--")
            .replace("\u2013", "-")
            .replace("\u2018", "'")
            .replace("\u2019", "'")
            .replace("\u201c", '"')
            .replace("\u201d", '"')
            .replace("\\", "\\\\")
            .replace("(", "\\(")
            .replace(")", "\\)")
        )
        stream_cmds.append("BT")
        stream_cmds.append(f"{r:.3f} {g:.3f} {b:.3f} rg")
        stream_cmds.append(f"/{font} {size} Tf")
        stream_cmds.append(f"{x:.2f} {y:.2f} Td")
        stream_cmds.append(f"({clean_text}) Tj")
        stream_cmds.append("ET")

    curr_y = height - 34.0

    # Top accent bar
    set_fill_rgb(0.059, 0.090, 0.165)
    draw_rect(margin_x, curr_y, content_width, 3.5, fill=True, stroke=False)
    curr_y -= 24.0

    # Document Header Title (20pt Bold)
    draw_text(margin_x, curr_y, "F1", 19.5, "elenchus.ai -- 1-Page Solution Pitch", 0.059, 0.090, 0.165)
    curr_y -= 14.0

    # Metadata Links Box (Comfortable padding & 8.6pt font)
    set_fill_rgb(0.965, 0.975, 0.985)
    set_stroke_rgb(0.82, 0.86, 0.90)
    set_line_width(0.6)
    draw_rect(margin_x, curr_y - 36, content_width, 44, fill=True, stroke=True)

    draw_text(margin_x + 10, curr_y - 10, "F1", 8.6, "Live Application:", 0.06, 0.09, 0.16)
    draw_text(margin_x + 98, curr_y - 10, "F2", 8.6, "https://elenchus-ai.indiasouthcentral.cloudapp.azure.com", 0.04, 0.41, 0.85)

    draw_text(margin_x + 10, curr_y - 22, "F1", 8.6, "GitHub Repository:", 0.06, 0.09, 0.16)
    draw_text(margin_x + 106, curr_y - 22, "F2", 8.6, "https://github.com/akumar015/elenchus.ai", 0.04, 0.41, 0.85)

    draw_text(margin_x + 10, curr_y - 34, "F1", 8.6, "Competition Track:", 0.06, 0.09, 0.16)
    draw_text(margin_x + 106, curr_y - 34, "F2", 8.6, "Gnani AI Voice Engineering Challenge -- Indic Dialectic Voice Agent", 0.25, 0.30, 0.38)

    curr_y -= 54.0

    # 1. The One-Liner Box (Larger 9.0pt body font, 13pt line height)
    draw_text(margin_x, curr_y, "F1", 11.0, "1. THE ONE-LINER", 0.059, 0.090, 0.165)
    set_stroke_rgb(0.85, 0.88, 0.92)
    set_line_width(0.5)
    draw_line(margin_x, curr_y - 3, margin_x + content_width, curr_y - 3)
    curr_y -= 15.0

    set_fill_rgb(0.975, 0.985, 0.995)
    draw_rect(margin_x, curr_y - 32, content_width, 38, fill=True, stroke=False)
    set_fill_rgb(0.72, 0.58, 0.36)  # Warm Gold
    draw_rect(margin_x, curr_y - 32, 3.5, 38, fill=True, stroke=False)

    oneliner_p1 = "elenchus.ai is a real-time, voice-first Socratic companion that cures passive information consumption by transforming philosophy,"
    oneliner_p2 = "essays, and daily news into active verbal sparring sessions--forcing you to defend your logic out loud while auto-capturing your"
    oneliner_p3 = "insights into permanent, structured Atomic Thought Cards."
    draw_text(margin_x + 10, curr_y - 8, "F2", 8.8, oneliner_p1, 0.15, 0.20, 0.28)
    draw_text(margin_x + 10, curr_y - 20, "F2", 8.8, oneliner_p2, 0.15, 0.20, 0.28)
    draw_text(margin_x + 10, curr_y - 32, "F2", 8.8, oneliner_p3, 0.15, 0.20, 0.28)
    curr_y -= 48.0

    # 2. The Problem
    draw_text(margin_x, curr_y, "F1", 11.0, "2. THE PROBLEM: THE 'ILLUSION OF COMPETENCE'", 0.059, 0.090, 0.165)
    draw_line(margin_x, curr_y - 3, margin_x + content_width, curr_y - 3)
    curr_y -= 14.0

    p_intro = "Millions of people consume hours of podcasts, audiobooks, and AI audio overviews (like NotebookLM) every week, yet retain almost none of it."
    draw_text(margin_x + 4, curr_y, "F2", 8.8, p_intro, 0.25, 0.30, 0.38)
    curr_y -= 14.0

    prob_bullets = [
        ("Passive listening is intellectual junk food:", "Listening to someone explain game theory or cognitive bias feels productive, but listening is not learning. Without active recall or friction, the illusion of mastery evaporates the moment you try to explain it."),
        ("The 'NPR Spectator Trap':", "Existing AI podcast generators treat the user as a passive bystander listening to synthetic hosts banter. There is zero pushback, zero personal accountability, and zero active engagement."),
        ("Lost Epiphanies:", "Genuine realizations during a commute or walk vanish because hands are busy and note-taking has high friction.")
    ]

    for title, desc in prob_bullets:
        draw_text(margin_x + 6, curr_y, "F1", 8.8, f"[*] {title}", 0.06, 0.09, 0.16)
        desc_lines = wrap_text(desc, 102)
        first_line = True
        for dl in desc_lines:
            if first_line:
                title_width = len(title) * 5.3 + 24
                draw_text(margin_x + title_width, curr_y, "F2", 8.8, dl, 0.25, 0.30, 0.38)
                first_line = False
            else:
                curr_y -= 12.0
                draw_text(margin_x + 20, curr_y, "F2", 8.8, dl, 0.25, 0.30, 0.38)
        curr_y -= 14.0

    curr_y -= 3.0

    # 3. The Solution
    draw_text(margin_x, curr_y, "F1", 11.0, "3. THE SOLUTION: CONVERSATIONAL DIALECTIC UNDER COGNITIVE FRICTION", 0.059, 0.090, 0.165)
    draw_line(margin_x, curr_y - 3, margin_x + content_width, curr_y - 3)
    curr_y -= 14.0

    sol_intro = "elenchus.ai flips the paradigm from passive broadcast to active Socratic cross-examination across four pillars:"
    draw_text(margin_x + 4, curr_y, "F2", 8.8, sol_intro, 0.25, 0.30, 0.38)
    curr_y -= 13.0

    # 3.1 Dual Modality Box (Spacious card with 8.8pt font)
    set_fill_rgb(0.985, 0.99, 0.995)
    set_stroke_rgb(0.85, 0.88, 0.92)
    draw_rect(margin_x + 6, curr_y - 62, content_width - 12, 66, fill=True, stroke=True)

    draw_text(margin_x + 12, curr_y - 11, "F1", 9.0, "1. Dual-Modality Conversational Architecture:", 0.06, 0.09, 0.16)
    draw_text(margin_x + 20, curr_y - 24, "F1", 8.7, "- Interactive Podcast Studio (3-Way):", 0.55, 0.40, 0.15)
    draw_text(margin_x + 188, curr_y - 24, "F2", 8.7, "Two AI co-hosts (Kalpana/Shivani Anchor + Avinash Provocateur) clash in real-time,", 0.25, 0.30, 0.38)
    draw_text(margin_x + 28, curr_y - 36, "F2", 8.7, "unpack case studies from in-context markdown dossiers, and pull you into the discussion as an equal peer.", 0.25, 0.30, 0.38)

    draw_text(margin_x + 20, curr_y - 48, "F1", 8.7, "- Socratic Duel (1-on-1 Arena):", 0.75, 0.30, 0.20)
    draw_text(margin_x + 158, curr_y - 48, "F2", 8.7, "Adversarial cross-examination targeting fallacies across 4 rigor stages (Mentor, Balanced, Expert, Hardcore).", 0.25, 0.30, 0.38)
    draw_text(margin_x + 28, curr_y - 60, "F2", 8.7, "Zero tolerance for unbacked premises; demands precise operational definitions.", 0.25, 0.30, 0.38)

    curr_y -= 76.0

    # Remaining Pillars (8.8pt font with 12pt line spacing)
    pillars = [
        ("2. Native Indic Multilingual Code-Switching:", "Powered by Gnani Timbre v3.0 (24kHz TTS) & Prisma STT. Flawlessly code-switches across English (en-IN), Hinglish (hi-IN), Punjabi (pa-IN), and Telugu (te-IN) with natural conversational cadence and authentic Indic phonology."),
        ("3. Decoupled Low-Latency Voice Pipeline:", "Overcomes speech synthesis latency by synchronously synthesizing the opening anchor beat while background-scheduling follower host segments, achieving sub-1.5s time-to-first-audio without dead-air."),
        ("4. The Ambient Scribe & Atomic Thought Cards:", "An ambient scribe analyzes your arguments, producing an Atomic Thought Card: isolating the objective core thesis, your articulated stance, exposed blind spots, and key insights exportable directly to Notion/Obsidian.")
    ]

    for title, desc in pillars:
        draw_text(margin_x + 6, curr_y, "F1", 8.8, title, 0.06, 0.09, 0.16)
        desc_lines = wrap_text(desc, 106)
        curr_y -= 12.0
        for dl in desc_lines:
            draw_text(margin_x + 16, curr_y, "F2", 8.8, dl, 0.25, 0.30, 0.38)
            curr_y -= 12.0
        curr_y -= 2.0

    curr_y -= 4.0

    # 4. Technical Stack
    draw_text(margin_x, curr_y, "F1", 11.0, "4. TECHNICAL STACK & PRODUCTION DEPLOYMENT", 0.059, 0.090, 0.165)
    draw_line(margin_x, curr_y - 3, margin_x + content_width, curr_y - 3)
    curr_y -= 14.0

    tech_items = [
        ("AI Cognitive Engine:", "Google Gemini 3.5 Flash Lite (Primary) with resilient fallback to Gemini 2.5 Flash & 2.0 Flash (structured JSON schema)."),
        ("Voice Intelligence:", "Gnani Timbre v3.0 (24kHz neural synthesis) & Gnani Prisma STT (16kHz chunked transcription)."),
        ("Backend Architecture:", "FastAPI (Python 3.11), SSE streaming, asynchronous concurrency management, in-context topic dossiers."),
        ("Frontend Application:", "Next.js 14 (React, Tailwind CSS, TypeScript), Swiss archival aesthetic, full-duplex audio recorder."),
        ("Cloud Infrastructure:", "Azure Linux VM (Ubuntu 22.04), Caddy automated Let's Encrypt SSL reverse proxy, Docker Compose.")
    ]

    for label, val in tech_items:
        draw_text(margin_x + 6, curr_y, "F1", 8.6, f"[*] {label}", 0.06, 0.09, 0.16)
        draw_text(margin_x + 128, curr_y, "F2", 8.6, val, 0.25, 0.30, 0.38)
        curr_y -= 13.0

    curr_y -= 5.0

    # 5. Why It Wins
    draw_text(margin_x, curr_y, "F1", 11.0, "5. WHY IT WINS", 0.059, 0.090, 0.165)
    draw_line(margin_x, curr_y - 2, margin_x + content_width, curr_y - 2)
    curr_y -= 14.0

    win_p1 = "Unlike passive audio summaries that tell you what to think, elenchus.ai teaches you how to think. By marrying cutting-edge"
    win_p2 = "Indic voice synthesis with Socratic friction, it turns idle listening into permanent cognitive fitness."
    draw_text(margin_x + 6, curr_y, "F2", 8.8, win_p1, 0.15, 0.20, 0.28)
    curr_y -= 12.5
    draw_text(margin_x + 6, curr_y, "F2", 8.8, win_p2, 0.15, 0.20, 0.28)

    print(f"DEBUG: Document rendering ended at y = {curr_y:.2f} (bottom margin is 36.00)")

    # Assemble PDF stream content
    content_stream = "\n".join(stream_cmds).encode("latin1")

    # Build PDF Objects
    objects = []

    def add_object(data_bytes: bytes) -> int:
        objects.append(data_bytes)
        return len(objects)

    # 1: Catalog
    add_object(b"<< /Type /Catalog /Pages 2 0 R >>")
    # 2: Pages
    add_object(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    # 3: Page
    page_obj = (
        f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {width:.2f} {height:.2f}] "
        f"/Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>"
    ).encode("latin1")
    add_object(page_obj)
    # 4: Contents Stream
    stream_header = f"<< /Length {len(content_stream)} >>\nstream\n".encode("latin1")
    stream_footer = b"\nendstream"
    add_object(stream_header + content_stream + stream_footer)
    # 5: Font F1 (Helvetica-Bold)
    add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")
    # 6: Font F2 (Helvetica)
    add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")

    # Generate File with XREF
    with open(pdf_path, "wb") as f:
        f.write(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
        offsets = []
        for i, obj_data in enumerate(objects):
            offsets.append(f.tell())
            f.write(f"{i + 1} 0 obj\n".encode("latin1"))
            f.write(obj_data)
            f.write(b"\nendobj\n")

        xref_pos = f.tell()
        f.write(b"xref\n")
        f.write(f"0 {len(objects) + 1}\n".encode("latin1"))
        f.write(b"0000000000 65535 f \n")
        for offset in offsets:
            f.write(f"{offset:010d} 00000 n \n".encode("latin1"))

        trailer = (
            f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
            f"startxref\n{xref_pos}\n%%EOF\n"
        ).encode("latin1")
        f.write(trailer)

    print(f"SUCCESS: Generated larger-font 1-page PDF at: {pdf_path} ({os.path.getsize(pdf_path)} bytes)")

if __name__ == "__main__":
    build_pdf("SOLUTION_PITCH.md", "SOLUTION_PITCH.pdf")
