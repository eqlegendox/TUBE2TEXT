# TUBE2TEXT — YouTube AI Note-Taker

Converts any YouTube video into structured learning notes and saves them to Notion automatically. Paste a video, get a full breakdown by topic — with timestamps, key terms, examples, and review questions.

---

## What you need before starting

- **VSCode** (already installed)
- **Google Chrome**
- A free **Gemini API key** (takes 2 minutes — no credit card)
- Optional: Groq key and Notion account

---

## Step 1 — Install Python

1. Go to [python.org/downloads](https://www.python.org/downloads/)
2. Download the latest version (3.12 or higher)
3. Run the installer — **on Windows, check "Add Python to PATH"** before clicking Install
4. Verify it worked: open a terminal and run:
   ```
   python3 --version
   ```
   You should see something like `Python 3.12.x`. On Windows use `python` instead of `python3`.

---

## Step 2 — Install Git

1. Go to [git-scm.com/downloads](https://git-scm.com/downloads)
2. Download and install for your OS (leave all options at their defaults)
3. Verify: open a terminal and run:
   ```
   git --version
   ```

---

## Step 3 — Clone this repo

Open VSCode, then open the built-in terminal (`Terminal → New Terminal` or `` Ctrl+` ``).

Run:
```bash
git clone https://github.com/dannybudiada/TUBE2TEXT.git
cd TUBE2TEXT
```

---

## Step 4 — Set up the Python backend

In the same terminal:

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

You should see a bunch of packages installing. This only needs to be done once.

---

## Step 5 — Get your API keys

You need at least one AI key. Gemini is recommended because it's free and handles any video length.

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

Skip this section if you just want notes in the popup without saving to Notion.

**Create an integration:**
1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **New integration**, give it a name (e.g. "TUBE2TEXT"), click Submit
3. Copy the **Internal Integration Token** — it starts with `secret_`

**Connect it to a database:**
1. Open (or create) a Notion database where you want notes saved
2. Click `•••` in the top-right of the database → **Connections** → find your integration and add it
3. Copy the **Database ID** from the URL — it's the 32-character string in the address bar:
   `notion.so/`**`6ea2c5cd3252837fa237015d39b81e35`**`?v=...`

**Add a Date column:**
In your Notion database, add a new property called exactly `Date Reviewed` with type **Date** — this is where the review date gets recorded automatically.

---

## Step 6 — Start the backend and enter your keys

**Start the server** (make sure your virtual environment is active — you should see `(venv)` in your terminal):

```bash
uvicorn main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**Enter your keys:**

Open [http://localhost:8000/setup](http://localhost:8000/setup) in Chrome. You'll see a settings page — paste your keys and click **Save Settings**. No need to restart the server.

---

## Step 7 — Load the Chrome extension

1. Open Chrome and go to `chrome://extensions`
2. Toggle **Developer mode** on (top-right corner)
3. Click **Load unpacked**
4. Navigate to the `TUBE2TEXT` folder you cloned and select the `extension/` subfolder
5. The TUBE2TEXT icon will appear in your Chrome toolbar (you may need to pin it from the puzzle-piece menu)

---

## Using the extension

1. **Start the backend** — every time you want to use the extension, run this in the `backend/` folder with the virtual environment active:
   ```bash
   uvicorn main:app --reload
   ```
2. Open any YouTube video
3. Click the TUBE2TEXT icon in the Chrome toolbar
4. Click **Generate Notes**
5. Wait ~10–30 seconds while the AI processes the transcript
6. Read the notes in the popup, or click the Notion link to open the full saved page

---

## Starting the backend (every time)

Each time you open your computer and want to use TUBE2TEXT:

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

Leave this terminal open while you use the extension. Close it when you're done.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `python3: command not found` | Python isn't installed or not on PATH — redo Step 1 |
| `git: command not found` | Git isn't installed — redo Step 2 |
| `pip install` fails | Make sure the virtual environment is active — you should see `(venv)` at the start of your terminal prompt |
| "Cannot reach the backend" | The `uvicorn` server isn't running — open a terminal, activate the venv, and run `uvicorn main:app --reload` |
| Extension not showing | Make sure you loaded the `extension/` subfolder, not the root folder |
| Notes generate but Notion save fails | Check that your integration is connected to the database (Step 5, Notion section) and the Database ID is correct |
| "Transcripts are disabled" | The video has captions turned off — try a different video |
| Gemini quota error | You've hit the free daily limit — either wait until tomorrow or add a Groq key as a fallback |
