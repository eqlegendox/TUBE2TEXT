# TUBE2TEXT — YouTube AI Note-Taker

A Chrome extension + local backend that converts any YouTube video into structured learning notes and saves them to Notion automatically.

---

## How it works

1. Open a YouTube video and click the extension
2. The extension sends the video to a local Python backend
3. The backend fetches the transcript, runs it through Gemini (or Groq as a fallback), and generates structured notes
4. Notes are saved to your Notion database and displayed in the popup

---

## Quick Start

### 1. Start the backend

```bash
cd YoutubeSummary/backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The server starts at `http://localhost:8000`.

### 2. Add your API keys

Open **[http://localhost:8000/setup](http://localhost:8000/setup)** in your browser. You'll see a setup page where you can paste your keys and save — no editing config files needed.

### 3. Load the Chrome extension

1. Go to `chrome://extensions` in Chrome
2. Enable **Developer Mode** (toggle, top right)
3. Click **Load unpacked** → select the `extension/` folder
4. Navigate to any YouTube video and click the extension icon

---

## Getting your API keys

### Gemini API Key (recommended — free, handles any length video)

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click **Create API key** — no credit card required
3. Copy the key (starts with `AIza`)

### Groq API Key (optional — free fallback for when Gemini hits its daily limit)

1. Go to [console.groq.com/keys](https://console.groq.com/keys)
2. Click **Create API key**
3. Copy the key (starts with `gsk_`)

You need **at least one** of the above.

### Notion Integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations) → **New integration** → give it a name → copy the **Internal Integration Token** (starts with `secret_`)
2. Open your target Notion database → click `•••` in the top right → **Connections** → add your integration
3. Copy the **Database ID** from the URL: `notion.so/`**`6ea2c5cd3252837fa237015d39b81e35`**`?v=...` — it's the 32-character string before the `?`
4. Add a **Date** property to your database named exactly `Date Reviewed` (type: Date)

---

## Project structure

```
YoutubeSummary/
├── backend/
│   ├── main.py            # FastAPI server + /setup page
│   ├── requirements.txt
│   └── .env               # Created automatically when you save via /setup
└── extension/
    ├── manifest.json
    ├── popup.html / popup.js / popup.css
    └── icons/
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Cannot reach the backend" | Make sure `uvicorn` is still running — check the terminal |
| Keys not working after saving | Try refreshing the `/setup` page to confirm they're shown as configured |
| "Transcripts are disabled" | The video owner has disabled captions — try another video |
| Notion page not created | Make sure the integration is added to the database (step 2 of Notion setup above) and the Database ID is correct |
| Extension not updating | Go to `chrome://extensions` and click the refresh icon on the extension card |
