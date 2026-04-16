# YouTube Learning Module Generator

Turn any educational YouTube video into a structured **learning module** in Notion — automatically. Instead of just summarising a video, this tool produces notes that read like a textbook chapter: concepts explained clearly, key terms defined, examples highlighted, and screenshots embedded at the right moments.

> **📸 Screenshot needed:** *Add a screenshot of an example Notion learning module page here — ideally one with multiple sections, a callout box, and an embedded screenshot from the video. This is the most important image in the README as it shows users exactly what they are getting.*

---

## Why this exists

Educational YouTube videos are great, but they are designed to be entertaining — not efficient. You end up watching a 40-minute video to get 10 minutes of actual knowledge. This tool extracts all that knowledge and presents it the way a good textbook would: structured, scannable, and actually teachable.

---

## What you get in Notion

Each video becomes a Notion page with:

- **Learning Objectives** — what you will know after reading
- **Key Terms** — important concepts defined clearly
- **Sections** — each topic explained like a teacher would, not just transcribed
- **Examples & Analogies** — pulled directly from the video
- **Why it matters** — context for each concept
- **Screenshots** — actual frames captured from the video at the right timestamps, embedded as images
- **Key Takeaways** — bullet summary per section
- **Review Questions** — to test your understanding

> **📸 Screenshot needed:** *Add a side-by-side comparison here: on the left, a plain text transcript or basic summary; on the right, the structured Notion learning module this tool generates. This shows the "before and after" clearly.*

---

## How it works

```
YouTube URL
    ↓
Fetch full timestamped transcript  (youtube-transcript-api)
    ↓
Gemini 2.0 Flash — Generate learning module JSON
    (explains concepts, defines terms, gives examples, adds review questions)
    ↓
Notion API — Write the structured learning module page
    (sections with embedded YouTube players at the exact visual moment timestamps)
```

Gemini 2.0 Flash is used because it is **completely free** (via Google AI Studio) and has a **1 million token context window**, meaning even a 3-hour video transcript fits in a single call with no truncation. Groq (llama-3.3-70b) is available as a fallback if you prefer not to set up a Google account.

---

## Prerequisites

Just Python — no extra tools required.

### Python 3.10 or higher

Check your version:
```bash
python3 --version
```

If you do not have Python, download it from [python.org](https://www.python.org/downloads/).

> **📸 Screenshot needed:** *Add a screenshot of the terminal showing `python3 --version` with a 3.10+ version number.*

---

## Installation

### Step 0 — Install Git (if you don't have it)

Git is used to download the code. Check if you already have it:

```bash
git --version
```

If you see a version number, skip to Step 1. If you get "command not found", install it:

**Mac**
```bash
xcode-select --install
```
A dialog will appear — click **Install**. This installs Git as part of the Xcode Command Line Tools.

**Windows** (run in PowerShell as Administrator)
```powershell
winget install --id Git.Git -e --source winget
```

**Linux (Ubuntu / Debian)**
```bash
sudo apt update && sudo apt install git
```

After installing, close and reopen your terminal, then run `git --version` again to confirm it worked.

**Using VS Code instead?**
You can skip Git entirely. In VS Code, press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac), type **Git: Clone**, paste the repository URL, and choose a folder. VS Code will download everything for you.

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/YoutubeSummary.git
cd YoutubeSummary/backend
```

### Step 2 — Create a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate        # Mac / Linux
venv\Scripts\activate           # Windows
```

### Step 3 — Install Python dependencies

```bash
pip install -r requirements.txt
```

---

## Configuration

You need three free API keys. Follow the steps below to get each one.

### 1. Google AI Studio API Key (for Gemini — free)

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with your Google account
3. Click **Get API Key** in the left sidebar
4. Click **Create API key**
5. Copy the key

> **📸 Screenshot needed:** *Add a screenshot of the Google AI Studio "Get API Key" page with the "Create API key" button visible. Blur or remove any actual key values.*

### 2. Notion Integration Token (free)

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **New integration**
3. Give it a name (e.g. "YouTube Notes") and select your workspace
4. Click **Submit**
5. Copy the **Internal Integration Token** — it starts with `secret_`

> **📸 Screenshot needed:** *Add a screenshot of the Notion integrations page showing the "New integration" button and the token field after creation.*

### 3. Notion Database ID

You need a Notion database where pages will be created. If you do not have one yet:

1. In Notion, create a new page and choose **Table** as the view (this creates a database)
2. Add two properties: **Title** (already there by default) and **Date Reviewed** (type: Date)
3. Open the database as a full page
4. Connect your integration: click the `...` menu in the top right → **Connections** → find your integration and click **Connect**
5. Copy the database ID from the URL — it is the long string of characters after the last `/` and before the `?`

Example URL:
```
https://www.notion.so/YOUR_WORKSPACE/abc123def456...?v=...
                                      ^^^^^^^^^^^^^^^^
                                      This is your database ID
```

> **📸 Screenshot needed:** *Add a screenshot of a Notion database page with the URL bar visible and the database ID portion highlighted/annotated. Blur the workspace name if desired.*

### 4. Set up your .env file

Copy the example file:
```bash
cp .env.example .env
```

Open `.env` and fill in your keys:
```
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
NOTION_API_KEY=secret_your_notion_token_here
NOTION_DATABASE_ID=your_notion_database_id_here
```

> The `GROQ_API_KEY` is optional — it is used as a fallback for short videos. You can leave it blank if you do not have one.

---

## Running the server

Make sure your virtual environment is **activated** before running the server, otherwise Python will not find the installed packages:

```bash
source venv/bin/activate        # Mac / Linux
venv\Scripts\activate           # Windows
```

Then start the server:

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

> **📸 Screenshot needed:** *Add a screenshot of the terminal showing the uvicorn startup output with "Application startup complete" visible, so users know what a successful start looks like.*

---

## Usage

### Via the API directly

Send a POST request to `/summarize`:

```bash
curl -X POST http://localhost:8000/summarize \
  -H "Content-Type: application/json" \
  -d '{"video_id": "dQw4w9WgXcQ", "video_title": "My Video Title"}'
```

The `video_id` is the part after `?v=` in any YouTube URL.

For example, for `https://www.youtube.com/watch?v=dQw4w9WgXcQ`, the `video_id` is `dQw4w9WgXcQ`.

### Via the frontend

> **📸 Screenshot needed:** *If there is a frontend UI, add a screenshot of it here showing the input field and submit button. If not, remove this section.*

### Response

```json
{
  "video_id": "dQw4w9WgXcQ",
  "video_title": "...",
  "overview": "...",
  "sections": [...],
  "notion_page_url": "https://notion.so/...",
  "notion_error": null,
  "truncated": false
}
```

If `notion_page_url` is returned, your learning module is ready in Notion.

---

## Troubleshooting

### `localhost:8000/setup` shows "Internal Server Error"

This was a bug in earlier versions — restart the server after pulling the latest code and the setup page will load correctly.

### "No AI API key configured. Set GEMINI_API_KEY or GROQ_API_KEY in .env"

You need at least one AI API key in your `.env` file. Either:

- Open the setup page at `http://localhost:8000/setup` and enter your keys there, **or**
- Open `.env` and set `GEMINI_API_KEY` to your Google AI Studio key (free at [aistudio.google.com](https://aistudio.google.com/app/apikey))

After saving the keys, restart the server.

If you do not have a `.env` file yet, create one from the template:

```bash
cp .env.example .env
```

Then open `.env` and fill in your keys.

### `RuntimeError: Form data requires "python-multipart" to be installed`

This means the server is running with the wrong Python — your virtual environment is not active. Stop the server, activate the venv, then restart:

```bash
source venv/bin/activate        # Mac / Linux
venv\Scripts\activate           # Windows
uvicorn main:app --reload
```

### "Transcripts are disabled for this video"
Some YouTube videos have transcripts turned off by the creator. There is no workaround — try a different video.

### "No transcript found"
The video may not have captions. Try enabling auto-generated captions on YouTube first, or try a different video.

### Notion page not being created
- Make sure your integration is connected to the database (step 3 of Notion setup above)
- Double-check that your `NOTION_DATABASE_ID` has no extra spaces or characters
- Check that your database has a **Date Reviewed** property of type **Date**

### Embedded videos not showing in Notion
- This is a Notion display setting. Make sure you are viewing the page in full-page mode, not the side peek.
- If the embed shows a broken preview, click the link above it to open the video at that exact timestamp in YouTube.

### Gemini API errors
- Make sure your `GEMINI_API_KEY` is correct in `.env`
- The free tier has rate limits — if you process many videos quickly, wait a minute and retry

---

## Limitations

This tool is entirely free but that comes with real constraints.

### Video length

| AI Provider | Max video length (approx) | Why |
|---|---|---|
| Gemini 2.0 Flash (recommended) | ~9 hours | Capped at 400,000 characters of transcript |
| Groq fallback | ~40 minutes | Capped at 32,000 characters of transcript |

Almost all educational YouTube videos fall well within the Gemini limit. The Groq fallback is only suitable for shorter content — lectures, tutorials under 40 minutes.

### How many videos per day

| AI Provider | Daily limit (approx) | Notes |
|---|---|---|
| Gemini 2.0 Flash | ~10 full-length videos | 1M tokens/day on the free tier |
| Groq fallback | ~30–50 videos | Higher RPM but shorter context |

For personal use, 10 videos/day is more than enough. If you hit the Gemini daily limit the server will automatically try Groq. If both are exhausted, you will see a rate limit error — wait until midnight Pacific time for Gemini to reset.

### What this tool cannot do

- **Private or age-restricted videos** — transcripts are not accessible without authentication
- **Videos with no captions** — auto-generated or manual captions must be enabled on the video
- **Non-English videos** — the AI prompt is written in English; non-English transcripts will produce degraded output
- **Real-time or live streams** — no transcript is available until the stream ends and captions are processed

---

## Free tier limits

| Service | Free Limit | Notes |
|---|---|---|
| Google Gemini 2.0 Flash | 15 requests/min, 1M tokens/day | More than enough for personal use |
| Groq (fallback) | 14,400 tokens/min, ~32k chars of transcript | Used as fallback only |
| Notion API | Unlimited for personal use | No practical limit |
| youtube-transcript-api | Unlimited | No API key needed |

---

## Project structure

```
backend/
├── main.py              # FastAPI app — all the logic lives here
├── requirements.txt     # Python dependencies
├── .env.example         # Template for your API keys
├── .env                 # Your actual keys (never commit this)
└── README.md            # This file
```

---

## Contributing

Pull requests are welcome. If you find a video that produces a poor learning module, please open an issue with the video ID (but not a private video) so the prompt can be improved.

---

## License

MIT
