# TUBE2TEXT — YouTube AI Note-Taker

Converts any YouTube video into structured learning notes and saves them to Notion automatically. Paste a video, get a full breakdown by topic — with timestamps, key terms, examples, and review questions.

---

## Prerequisites

- Python 3.10+
- Git
- Google Chrome

---

## Step 1 — Clone the repo

Open VSCode, then open the built-in terminal (`Terminal → New Terminal` or `` Ctrl+` ``).

```bash
git clone https://github.com/dannybudiada/TUBE2TEXT.git
cd TUBE2TEXT
```

---

## Step 2 — Set up the Python backend

**Mac / Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Windows:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

This only needs to be done once.

---

## Step 3 — Get your API keys

You need at least one AI key. Gemini is recommended — it's free and handles any video length.

### Gemini API Key (recommended — free)

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with a Google account
3. Click **Create API key**
4. Copy the key — it starts with `AIza`

### Groq API Key (optional — free fallback)

Used automatically if Gemini hits its daily limit.

1. Go to [console.groq.com/keys](https://console.groq.com/keys)
2. Create an account and click **Create API key**
3. Copy the key — it starts with `gsk_`

### Notion (optional — for saving notes)

Skip this if you just want notes in the popup without saving to Notion.

**Create an integration:**
1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **New integration**, give it a name (e.g. "TUBE2TEXT"), click Submit
3. Copy the **Internal Integration Token** — starts with `secret_`

**Connect it to a database:**
1. Open (or create) a Notion database where you want notes saved
2. Click `•••` in the top-right of the database → **Connections** → add your integration
3. Copy the **Database ID** from the URL:
   `notion.so/`**`6ea2c5cd3252837fa237015d39b81e35`**`?v=...`

**Add a Date column:**
In your Notion database, add a property called exactly `Date Reviewed` with type **Date**.

---

## Step 4 — Start the backend and enter your keys

**Start the server** (make sure `(venv)` is visible in your terminal prompt):

```bash
uvicorn main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**Enter your keys:**

Open [http://localhost:8000/setup](http://localhost:8000/setup) in Chrome. Paste your keys and click **Save Settings** — no restart needed.

---

## Step 5 — Load the Chrome extension

1. Open Chrome and go to `chrome://extensions`
2. Toggle **Developer mode** on (top-right corner)
3. Click **Load unpacked**
4. Select the `extension/` folder inside the cloned repo
5. Pin the TUBE2TEXT icon from the puzzle-piece menu in the toolbar

---

## Using the extension

1. Start the backend (run `uvicorn main:app --reload` in the `backend/` folder with venv active)
2. Open any YouTube video
3. Click the TUBE2TEXT icon in Chrome
4. Click **Generate Notes** and wait ~10–30 seconds
5. Read the notes in the popup or click the Notion link to open the saved page

---

## Starting the backend each time

**Mac / Linux:**
```bash
cd path/to/TUBE2TEXT/backend
source venv/bin/activate
uvicorn main:app --reload
```

**Windows:**
```bash
cd path\to\TUBE2TEXT\backend
venv\Scripts\activate
uvicorn main:app --reload
```

Leave this terminal open while using the extension.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `pip install` fails | Make sure `(venv)` is visible in your terminal prompt — the virtual environment isn't active |
| "Cannot reach the backend" | The `uvicorn` server isn't running — open a terminal, activate the venv, and run `uvicorn main:app --reload` |
| Extension not showing | Make sure you selected the `extension/` subfolder, not the root folder |
| Notion save fails | Check that your integration is connected to the database and the Database ID is correct |
| "Transcripts are disabled" | The video has captions turned off — try a different video |
| Gemini quota error | You've hit the free daily limit — wait until tomorrow or add a Groq key as a fallback |
