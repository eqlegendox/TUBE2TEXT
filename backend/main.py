import os
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from fastapi import FastAPI, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
from notion_client import Client as NotionClient

load_dotenv()

app = FastAPI(title="YouTube Learning Module Generator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AI client setup ---
# Gemini 2.0 Flash is the primary AI (free, 1M token context — handles any video length).
# Groq (llama-3.3-70b) is the fallback when Gemini is not configured.
# At least one must be set in .env.

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

groq_client = None

if GEMINI_API_KEY:
    from google import genai as _google_genai
    gemini_client = _google_genai.Client(api_key=GEMINI_API_KEY)
else:
    gemini_client = None

if GROQ_API_KEY:
    from groq import Groq
    groq_client = Groq(api_key=GROQ_API_KEY)

notion_client = NotionClient(auth=os.getenv("NOTION_API_KEY", ""))
NOTION_DATABASE_ID = os.getenv("NOTION_DATABASE_ID", "")

# Gemini 2.0 Flash has a 1M token context — no truncation needed for any realistic video.
# Groq free tier is ~12,000 TPM so we keep the 32k char limit for that fallback.
MAX_TRANSCRIPT_CHARS_GEMINI = 400_000
MAX_TRANSCRIPT_CHARS_GROQ = 32_000

# Notion API hard limit: max 100 blocks per append call.
NOTION_BLOCK_CHUNK_SIZE = 100


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class SummarizeRequest(BaseModel):
    video_id: str
    video_title: str = ""


class KeyTerm(BaseModel):
    term: str
    definition: str


class VisualMoment(BaseModel):
    timestamp: str
    description: str


class Section(BaseModel):
    title: str
    timestamp: str
    concept_explanation: str
    key_terms: list[KeyTerm] = []
    example: str = ""
    why_it_matters: str = ""
    visual_moments: list[VisualMoment] = []
    section_takeaways: list[str] = []


class LearningModuleResponse(BaseModel):
    video_id: str
    video_title: str
    overview: str
    learning_objectives: list[str]
    sections: list[Section]
    key_takeaways: list[str]
    review_questions: list[str]
    notion_page_url: str | None = None
    notion_error: str | None = None
    truncated: bool = False


# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

LEARNING_MODULE_PROMPT = """You are an expert educator creating a structured learning module from an educational YouTube video.

Video Title: "{title}"

Below is the full timestamped transcript. Your job is NOT to summarise it — your job is to TEACH the content, as if writing a clear, engaging textbook chapter. Explain concepts, define terms, give examples, and make the material genuinely understandable to someone encountering it for the first time.

Produce a learning module in this exact JSON schema:
{{
  "video_title": "...",
  "overview": "2–3 paragraph introduction that gives context, explains what the video covers, who it is for, and why the topic matters. Write this as an engaging intro to the subject.",
  "learning_objectives": [
    "By the end of this module, you will understand X",
    "You will be able to do Y"
  ],
  "sections": [
    {{
      "title": "Section topic name",
      "timestamp": "MM:SS",
      "concept_explanation": "Thorough explanation written like a teacher — clear, structured, building from simple to complex. Do NOT transcribe the speaker word for word. Instead, explain the concept properly using all the details, steps, numbers, and examples mentioned in the transcript.",
      "key_terms": [
        {{"term": "Term name", "definition": "Clear definition as explained in the video"}}
      ],
      "example": "A concrete example or analogy from the video that makes this concept click. If the video did not give one, synthesise a short one that fits.",
      "why_it_matters": "1–2 sentences on why this concept or process is important in the real world.",
      "visual_moments": [
        {{"timestamp": "MM:SS", "description": "What is shown on screen: diagram, demo, graph, code, animation, etc."}}
      ],
      "section_takeaways": [
        "Key point 1 from this section",
        "Key point 2 from this section"
      ]
    }}
  ],
  "key_takeaways": [
    "Most important idea from the entire video",
    "Second most important idea"
  ],
  "review_questions": [
    "A question testing understanding of the core concept?",
    "A question that requires applying what was learned?"
  ]
}}

Rules:
- Group content into logical sections by topic. Each section covers ONE main idea.
- concept_explanation must explain, not just list. Use transitions, comparisons, plain language.
- Preserve ALL specific details: every number, name, step, statistic, formula, or quote in the transcript.
- key_terms: only include terms the video actually defines or explains. If none exist in a section, use [].
- visual_moments: only include timestamps where something meaningful is shown on screen. If a section has none, use [].
- Every timestamp must be a real timestamp present in the transcript.
- Return ONLY valid JSON — no markdown code fences, no extra text.

TRANSCRIPT:
{transcript}"""


# ---------------------------------------------------------------------------
# Transcript fetching
# ---------------------------------------------------------------------------

def format_timestamp(seconds: float) -> str:
    total = int(seconds)
    h = total // 3600
    m = (total % 3600) // 60
    s = total % 60
    return f"{h}:{m:02d}:{s:02d}" if h > 0 else f"{m}:{s:02d}"


def fetch_transcript(video_id: str, use_gemini: bool) -> tuple[str, bool]:
    """Fetch transcript. Returns (text, was_truncated).
    Applies a higher char limit when Gemini is available."""
    try:
        api = YouTubeTranscriptApi()
        transcript = api.fetch(video_id)
    except TranscriptsDisabled:
        raise HTTPException(status_code=422, detail="Transcripts are disabled for this video.")
    except NoTranscriptFound:
        raise HTTPException(status_code=422, detail="No transcript found for this video.")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch transcript: {e}")

    lines = [
        f"[{format_timestamp(s.start)}] {s.text.replace(chr(10), ' ')}"
        for s in transcript
    ]
    full_text = "\n".join(lines)

    limit = MAX_TRANSCRIPT_CHARS_GEMINI if use_gemini else MAX_TRANSCRIPT_CHARS_GROQ
    if len(full_text) > limit:
        cutoff = full_text.rfind("\n", 0, limit)
        if cutoff == -1:
            cutoff = limit
        return full_text[:cutoff], True

    return full_text, False


# ---------------------------------------------------------------------------
# AI generation
# ---------------------------------------------------------------------------

def _clean_json(raw: str) -> str:
    """Strip accidental markdown fences that some models add."""
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return raw.strip()


def generate_with_gemini(transcript: str, video_title: str) -> dict:
    """Call Gemini 2.0 Flash to produce the learning module JSON."""
    from google.genai import types as genai_types

    prompt = LEARNING_MODULE_PROMPT.format(
        title=video_title or "Educational Video",
        transcript=transcript,
    )
    response = gemini_client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config=genai_types.GenerateContentConfig(
            max_output_tokens=8192,
            temperature=0.4,
        ),
    )
    raw = _clean_json(response.text)
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini returned invalid JSON: {e}\n\nRaw (first 400 chars): {raw[:400]}",
        )


def generate_with_groq(transcript: str, video_title: str) -> dict:
    """Fallback: call Groq (llama-3.3-70b) when Gemini is not configured.
    Uses the same prompt structure but is limited to 32k chars of transcript."""
    prompt = LEARNING_MODULE_PROMPT.format(
        title=video_title or "Educational Video",
        transcript=transcript,
    )
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = _clean_json(response.choices[0].message.content)
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Groq returned invalid JSON: {e}\n\nRaw (first 400 chars): {raw[:400]}",
        )


# ---------------------------------------------------------------------------
# Notion helpers
# ---------------------------------------------------------------------------

def ts_to_seconds(ts: str) -> int:
    parts = ts.split(":")
    try:
        if len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[1])
        if len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
    except ValueError:
        pass
    return 0


def _text(content: str, bold: bool = False, color: str = "default") -> dict:
    """Shorthand for a Notion rich_text text object."""
    obj: dict = {"type": "text", "text": {"content": content}}
    if bold or color != "default":
        obj["annotations"] = {}
        if bold:
            obj["annotations"]["bold"] = True
        if color != "default":
            obj["annotations"]["color"] = color
    return obj


def _link_text(content: str, url: str, bold: bool = False) -> dict:
    obj: dict = {"type": "text", "text": {"content": content, "link": {"url": url}}}
    if bold:
        obj["annotations"] = {"bold": True}
    return obj


def _paragraph(rich_text: list) -> dict:
    return {"object": "block", "type": "paragraph", "paragraph": {"rich_text": rich_text}}


def _heading2(text: str) -> dict:
    return {
        "object": "block", "type": "heading_2",
        "heading_2": {"rich_text": [_text(text)]},
    }


def _heading3(rich_text: list) -> dict:
    return {
        "object": "block", "type": "heading_3",
        "heading_3": {"rich_text": rich_text},
    }


def _bullet(rich_text: list) -> dict:
    return {
        "object": "block", "type": "bulleted_list_item",
        "bulleted_list_item": {"rich_text": rich_text},
    }


def _numbered(rich_text: list) -> dict:
    return {
        "object": "block", "type": "numbered_list_item",
        "numbered_list_item": {"rich_text": rich_text},
    }


def _callout(icon: str, text: str, color: str = "gray_background") -> dict:
    return {
        "object": "block", "type": "callout",
        "callout": {
            "rich_text": [_text(text)],
            "icon": {"type": "emoji", "emoji": icon},
            "color": color,
        },
    }


def _divider() -> dict:
    return {"object": "block", "type": "divider", "divider": {}}


def _embed(url: str) -> dict:
    return {"object": "block", "type": "embed", "embed": {"url": url}}


def _chunk_text(text: str, size: int = 1900) -> list[str]:
    """Split long text to respect Notion's 2000-char rich_text limit."""
    return [text[i:i + size] for i in range(0, max(1, len(text)), size)]


def build_notion_blocks(module: dict, video_id: str) -> list[dict]:
    """Build the full list of Notion blocks for a learning module page."""
    video_url = f"https://www.youtube.com/watch?v={video_id}"
    blocks: list[dict] = []

    # Video link
    blocks.append(_paragraph([
        _text("Video: "),
        _link_text(video_url, video_url),
    ]))
    blocks.append(_divider())

    # Learning Objectives
    blocks.append(_heading2("🎯 Learning Objectives"))
    for obj in module.get("learning_objectives", []):
        blocks.append(_bullet([_text(obj)]))
    blocks.append(_divider())

    # Overview
    blocks.append(_heading2("📖 Overview"))
    for chunk in _chunk_text(module.get("overview", "")):
        blocks.append(_paragraph([_text(chunk)]))
    blocks.append(_divider())

    # Notes
    blocks.append(_heading2("📝 Notes"))

    for section in module.get("sections", []):
        ts = section.get("timestamp", "")
        section_url = f"{video_url}&t={ts_to_seconds(ts)}s"
        title = section.get("title", "")

        # Section heading linked to the timestamp in the video
        blocks.append(_heading3([
            _link_text(f"[{ts}]", section_url, bold=True),
            _text(f"  {title}"),
        ]))

        # Concept explanation (chunked for Notion's 2000-char limit)
        explanation = section.get("concept_explanation", "")
        for chunk in _chunk_text(explanation):
            blocks.append(_paragraph([_text(chunk)]))

        # Key Terms
        key_terms = section.get("key_terms", [])
        if key_terms:
            blocks.append(_callout("📌", "Key Terms", "blue_background"))
            for kt in key_terms:
                term = kt.get("term", "")
                definition = kt.get("definition", "")
                blocks.append(_bullet([
                    _text(term, bold=True),
                    _text(f" — {definition}"),
                ]))

        # Example
        example = section.get("example", "").strip()
        if example:
            blocks.append(_callout("💡", f"Example\n{example}", "yellow_background"))

        # Why it matters
        why = section.get("why_it_matters", "").strip()
        if why:
            blocks.append(_callout("⚡", f"Why it matters\n{why}", "green_background"))

        # Visual moments — embedded as a YouTube player at the exact timestamp
        visual_moments = section.get("visual_moments", [])
        if visual_moments:
            blocks.append(_callout("📺", "Visual References — click to watch at this moment in the video", "gray_background"))
            for vm in visual_moments:
                vm_ts = vm.get("timestamp", "")
                vm_seconds = ts_to_seconds(vm_ts)
                embed_url = f"https://www.youtube.com/embed/{video_id}?start={vm_seconds}"
                vm_label = vm.get("description", "")
                blocks.append(_paragraph([
                    _link_text(f"[{vm_ts}] {vm_label}", f"{video_url}&t={vm_seconds}s"),
                ]))
                blocks.append(_embed(embed_url))

        # Section takeaways
        takeaways = section.get("section_takeaways", [])
        if takeaways:
            blocks.append(_paragraph([_text("Takeaways:", bold=True)]))
            for t in takeaways:
                blocks.append(_bullet([_text(t)]))

        blocks.append(_divider())

    # Key Takeaways
    blocks.append(_heading2("✅ Key Takeaways"))
    for t in module.get("key_takeaways", []):
        blocks.append(_bullet([_text(t)]))

    blocks.append(_divider())

    # Review Questions
    blocks.append(_heading2("🧠 Review Questions"))
    for q in module.get("review_questions", []):
        blocks.append(_numbered([_text(q)]))

    return blocks


def append_blocks_chunked(page_id: str, blocks: list[dict]) -> None:
    """Append blocks to a Notion page in chunks of 100 (API hard limit)."""
    for i in range(0, len(blocks), NOTION_BLOCK_CHUNK_SIZE):
        chunk = blocks[i:i + NOTION_BLOCK_CHUNK_SIZE]
        notion_client.blocks.children.append(block_id=page_id, children=chunk)


def save_to_notion(module: dict, video_id: str) -> tuple[str | None, str | None]:
    """Create a Notion page with the full learning module. Returns (url, error)."""
    if not NOTION_DATABASE_ID or NOTION_DATABASE_ID == "your_notion_database_id_here":
        return None, "NOTION_DATABASE_ID not configured in .env"

    notion_api_key = os.getenv("NOTION_API_KEY", "")
    if not notion_api_key or notion_api_key == "your_notion_integration_token_here":
        return None, "NOTION_API_KEY not configured in .env"

    title = module.get("video_title", "YouTube Learning Module")
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    blocks = build_notion_blocks(module, video_id)

    try:
        # Create the page with no children first (avoids the 100-block limit on page create)
        response = notion_client.pages.create(
            parent={"database_id": NOTION_DATABASE_ID},
            properties={
                "title": {"title": [{"type": "text", "text": {"content": title}}]},
                "Date Reviewed": {"date": {"start": today}},
            },
            children=[],
        )
        page_id = response["id"]

        # Append all blocks in chunks of 100
        append_blocks_chunked(page_id, blocks)

        return response.get("url"), None

    except Exception as e:
        print(f"Notion save failed: {e}")
        return None, str(e)


# ---------------------------------------------------------------------------
# API endpoint
# ---------------------------------------------------------------------------

@app.post("/summarize", response_model=LearningModuleResponse)
async def summarize(request: SummarizeRequest):
    if not gemini_client and not groq_client:
        raise HTTPException(
            status_code=500,
            detail="No AI API key configured. Set GEMINI_API_KEY or GROQ_API_KEY in .env",
        )

    use_gemini = gemini_client is not None

    # 1. Fetch transcript
    transcript_text, was_truncated = fetch_transcript(request.video_id, use_gemini)

    # 2. Generate learning module (Gemini preferred, Groq fallback)
    if use_gemini:
        try:
            module = generate_with_gemini(transcript_text, request.video_title)
        except Exception as e:
            if groq_client is None:
                raise HTTPException(
                    status_code=429,
                    detail=f"Gemini failed and no Groq fallback configured: {e}",
                )
            # Re-truncate transcript to Groq's smaller limit before falling back
            if len(transcript_text) > MAX_TRANSCRIPT_CHARS_GROQ:
                cutoff = transcript_text.rfind("\n", 0, MAX_TRANSCRIPT_CHARS_GROQ)
                transcript_text = transcript_text[:cutoff if cutoff != -1 else MAX_TRANSCRIPT_CHARS_GROQ]
                was_truncated = True
            module = generate_with_groq(transcript_text, request.video_title)
    else:
        module = generate_with_groq(transcript_text, request.video_title)

    # 3. Save to Notion
    notion_url, notion_error = save_to_notion(module, request.video_id)

    return LearningModuleResponse(
        video_id=request.video_id,
        video_title=module.get("video_title", request.video_title),
        overview=module.get("overview", ""),
        learning_objectives=module.get("learning_objectives", []),
        sections=[
            Section(
                title=s.get("title", ""),
                timestamp=s.get("timestamp", ""),
                concept_explanation=s.get("concept_explanation", ""),
                key_terms=[
                    KeyTerm(term=kt.get("term", ""), definition=kt.get("definition", ""))
                    for kt in s.get("key_terms", [])
                ],
                example=s.get("example", ""),
                why_it_matters=s.get("why_it_matters", ""),
                visual_moments=[
                    VisualMoment(timestamp=vm.get("timestamp", ""), description=vm.get("description", ""))
                    for vm in s.get("visual_moments", [])
                ],
                section_takeaways=s.get("section_takeaways", []),
            )
            for s in module.get("sections", [])
        ],
        key_takeaways=module.get("key_takeaways", []),
        review_questions=module.get("review_questions", []),
        notion_page_url=notion_url,
        notion_error=notion_error,
        truncated=was_truncated,
    )


@app.get("/health")
async def health():
    ai_provider = "gemini" if gemini_client else "groq" if groq_client else "none"
    return {"status": "ok", "ai_provider": ai_provider}


# ---------------------------------------------------------------------------
# Setup page  —  open http://localhost:8000/setup to configure API keys
# ---------------------------------------------------------------------------

SETUP_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>TUBE2TEXT — Setup</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0f0f0f;color:#e8e8e8;min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:40px 20px 60px}
.page{width:100%;max-width:600px}
.logo{display:flex;align-items:center;gap:14px;margin-bottom:32px}
.logo h1{font-size:24px;font-weight:700;color:#fff;letter-spacing:.02em}
.logo p{font-size:13px;color:#666;margin-top:3px}
.accent{color:#ff4444}
.card{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:24px;margin-bottom:20px}
.card-title{font-size:15px;font-weight:600;color:#fff;margin-bottom:6px}
.card-desc{font-size:13px;color:#888;line-height:1.6;margin-bottom:18px}
.field{margin-bottom:16px}
label{display:block;font-size:13px;font-weight:500;color:#ccc;margin-bottom:5px}
.badge{font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;text-transform:uppercase;letter-spacing:.04em;margin-left:6px;vertical-align:middle}
.rec{background:rgba(255,68,68,.15);color:#ff8888;border:1px solid rgba(255,68,68,.3)}
.opt{background:rgba(100,100,100,.15);color:#888;border:1px solid #2a2a2a}
.hint{font-size:12px;color:#666;line-height:1.5;margin-bottom:6px}
.hint a{color:#ff8888;text-decoration:none}
.hint a:hover{text-decoration:underline}
.hint code{font-family:"SF Mono","Fira Code",monospace;font-size:11px;background:#2a2a2a;padding:1px 5px;border-radius:3px;color:#ccc}
.row{display:flex;gap:8px}
input[type=text],input[type=password]{flex:1;background:#111;border:1px solid #2a2a2a;border-radius:8px;padding:9px 12px;font-size:13px;color:#e8e8e8;font-family:"SF Mono","Fira Code",monospace;outline:none;transition:border-color .15s;width:100%}
input:focus{border-color:#ff4444}
input::placeholder{color:#444}
.show{background:#2a2a2a;border:1px solid #3a3a3a;border-radius:8px;padding:0 14px;font-size:12px;color:#888;cursor:pointer;white-space:nowrap;transition:background .15s,color .15s}
.show:hover{background:#333;color:#ccc}
.actions{display:flex;align-items:center;gap:14px}
.save{background:#ff0000;color:#fff;border:none;border-radius:8px;padding:11px 28px;font-size:14px;font-weight:600;cursor:pointer;transition:background .15s}
.save:hover{background:#cc0000}
.msg{font-size:13px;font-weight:500}
.ok{color:#4caf50}
.err{color:#ff8888}
.status-bar{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#888;display:flex;gap:20px}
.status-bar span{display:flex;align-items:center;gap:6px}
.dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.dot.on{background:#4caf50}
.dot.off{background:#555}
</style>
</head>
<body>
<div class="page">
  <div class="logo">
    <div>
      <h1>TUBE<span class="accent">2</span>TEXT</h1>
      <p>API Key Setup — <a href="http://localhost:8000/setup" style="color:#666">localhost:8000/setup</a></p>
    </div>
  </div>

  <div class="status-bar">
    <span><span class="dot {gemini_dot}"></span>Gemini: {gemini_status}</span>
    <span><span class="dot {groq_dot}"></span>Groq: {groq_status}</span>
    <span><span class="dot {notion_dot}"></span>Notion: {notion_status}</span>
  </div>

  {flash}

  <form method="POST" action="/setup">
    <div class="card">
      <div class="card-title">🤖 AI Provider</div>
      <div class="card-desc">Gemini 2.0 Flash is the primary AI (free, handles any video length). Groq is the automatic fallback when Gemini hits its daily limit. You need at least one.</div>

      <div class="field">
        <label>Gemini API Key <span class="badge rec">Recommended</span></label>
        <div class="hint">Get a free key at <a href="https://aistudio.google.com/app/apikey" target="_blank">aistudio.google.com</a> — no credit card required.</div>
        <div class="row">
          <input type="password" name="gemini_key" id="gemini_key" value="{gemini_val}" placeholder="AIza..." autocomplete="off"/>
          <button type="button" class="show" onclick="toggle('gemini_key',this)">Show</button>
        </div>
      </div>

      <div class="field">
        <label>Groq API Key <span class="badge opt">Optional fallback</span></label>
        <div class="hint">Get a free key at <a href="https://console.groq.com/keys" target="_blank">console.groq.com</a>. Limited to shorter videos on the free tier.</div>
        <div class="row">
          <input type="password" name="groq_key" id="groq_key" value="{groq_val}" placeholder="gsk_..." autocomplete="off"/>
          <button type="button" class="show" onclick="toggle('groq_key',this)">Show</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">📓 Notion Integration</div>
      <div class="card-desc">Notes are saved as a new page in your Notion database. Both fields are required for Notion to work.</div>

      <div class="field">
        <label>Notion API Key (Integration Token)</label>
        <div class="hint">Go to <a href="https://www.notion.so/my-integrations" target="_blank">notion.so/my-integrations</a> → New integration → copy the secret token.<br>Then open your database → ••• → Connections → add your integration.</div>
        <div class="row">
          <input type="password" name="notion_key" id="notion_key" value="{notion_val}" placeholder="secret_..." autocomplete="off"/>
          <button type="button" class="show" onclick="toggle('notion_key',this)">Show</button>
        </div>
      </div>

      <div class="field">
        <label>Notion Database ID</label>
        <div class="hint">Open your Notion database in a browser. The URL looks like:<br><code>notion.so/<strong>6ea2c5cd3252837fa237015d39b81e35</strong>?v=...</code><br>Copy the 32-character ID before the <code>?v=</code>.</div>
        <input type="text" name="notion_db_id" value="{notion_db_val}" placeholder="6ea2c5cd..." autocomplete="off"/>
      </div>
    </div>

    <div class="actions">
      <button type="submit" class="save">Save Settings</button>
    </div>
  </form>
</div>
<script>
function toggle(id, btn) {
  const el = document.getElementById(id);
  if (el.type === 'password') { el.type = 'text'; btn.textContent = 'Hide'; }
  else { el.type = 'password'; btn.textContent = 'Show'; }
}
</script>
</body>
</html>"""


def _mask(val: str) -> str:
    """Return the key value for pre-filling — show it masked in the input."""
    return val  # browser masks password inputs; we send the real value so save works cleanly


def _setup_page(flash: str = "") -> str:
    gk = os.getenv("GEMINI_API_KEY", "")
    rk = os.getenv("GROQ_API_KEY", "")
    nk = os.getenv("NOTION_API_KEY", "")
    nd = os.getenv("NOTION_DATABASE_ID", "")
    return (
        SETUP_HTML
        .replace("{gemini_dot}", "on" if gk else "off")
        .replace("{gemini_status}", "configured" if gk else "not set")
        .replace("{groq_dot}", "on" if rk else "off")
        .replace("{groq_status}", "configured" if rk else "not set")
        .replace("{notion_dot}", "on" if (nk and nd) else "off")
        .replace("{notion_status}", "configured" if (nk and nd) else "not set")
        .replace("{gemini_val}", gk)
        .replace("{groq_val}", rk)
        .replace("{notion_val}", nk)
        .replace("{notion_db_val}", nd)
        .replace("{flash}", flash)
    )


@app.get("/setup", response_class=HTMLResponse)
async def setup_get():
    return _setup_page()


@app.post("/setup", response_class=HTMLResponse)
async def setup_post(
    gemini_key: str = Form(default=""),
    groq_key: str = Form(default=""),
    notion_key: str = Form(default=""),
    notion_db_id: str = Form(default=""),
):
    global gemini_client, groq_client, notion_client, NOTION_DATABASE_ID

    # Write .env file next to main.py
    env_path = Path(__file__).parent / ".env"
    lines = []
    if gemini_key.strip():
        lines.append(f"GEMINI_API_KEY={gemini_key.strip()}")
    if groq_key.strip():
        lines.append(f"GROQ_API_KEY={groq_key.strip()}")
    if notion_key.strip():
        lines.append(f"NOTION_API_KEY={notion_key.strip()}")
    if notion_db_id.strip():
        lines.append(f"NOTION_DATABASE_ID={notion_db_id.strip()}")
    env_path.write_text("\n".join(lines) + "\n")

    # Hot-reload into os.environ so the running server picks up the new values immediately
    for key, val in [
        ("GEMINI_API_KEY", gemini_key.strip()),
        ("GROQ_API_KEY", groq_key.strip()),
        ("NOTION_API_KEY", notion_key.strip()),
        ("NOTION_DATABASE_ID", notion_db_id.strip()),
    ]:
        if val:
            os.environ[key] = val
        else:
            os.environ.pop(key, None)

    # Reinitialise AI clients with the new keys
    gk = os.getenv("GEMINI_API_KEY", "")
    rk = os.getenv("GROQ_API_KEY", "")

    if gk:
        from google import genai as _google_genai
        gemini_client = _google_genai.Client(api_key=gk)
    else:
        gemini_client = None

    if rk:
        from groq import Groq
        groq_client = Groq(api_key=rk)
    else:
        groq_client = None

    notion_client = NotionClient(auth=os.getenv("NOTION_API_KEY", ""))
    NOTION_DATABASE_ID = os.getenv("NOTION_DATABASE_ID", "")

    flash = '<div style="background:rgba(76,175,80,.1);border:1px solid rgba(76,175,80,.3);border-radius:8px;padding:10px 14px;margin-bottom:20px;color:#4caf50;font-size:13px">✓ Settings saved and applied — no restart needed.</div>'
    return _setup_page(flash)
