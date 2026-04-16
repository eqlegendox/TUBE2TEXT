# TUBE2TEXT — YouTube AI Note-Taker

Converts any YouTube video into structured learning notes and saves them to Notion automatically. Paste a video, get a full breakdown by topic — with timestamps, key terms, examples, and review questions.

---

## What you need before starting

- A computer running Windows, Mac, or Linux
- Google Chrome
- An internet connection

Everything else (Git, Python, the code itself) is installed in the steps below.

---

## Step 0 — Install Git

Git is a tool that downloads code from the internet. You need it to get TUBE2TEXT onto your computer.

### Check if you already have it

Open a terminal and run:

```bash
git --version
```

**How to open a terminal:**
- **Windows** — Press `Win + R`, type `powershell`, press Enter. Or search "PowerShell" in the Start menu.
- **Mac** — Press `Cmd + Space`, type `Terminal`, press Enter.
- **Linux** — Press `Ctrl + Alt + T`.

If you see something like `git version 2.39.0`, Git is already installed — skip to Step 1.

If you see `command not found` or `'git' is not recognized`, follow the instructions for your operating system below.

---

### Install Git on Windows

1. Open **PowerShell as Administrator**:
   - Click the Start menu
   - Search for **PowerShell**
   - Right-click it and choose **Run as administrator**
   - Click **Yes** on the prompt that appears

2. Paste this command and press Enter:

```powershell
winget install --id Git.Git -e --source winget
```

3. Wait for it to finish. You will see a progress bar.

4. **Close PowerShell completely** and open a new one.

5. Confirm it worked:

```powershell
git --version
```

You should see a version number. If you still get an error, restart your computer and try again.

---

### Install Git on Mac

1. Open **Terminal** (press `Cmd + Space`, type `Terminal`, press Enter).

2. Run this command:

```bash
xcode-select --install
```

3. A dialog box will pop up asking if you want to install the Command Line Developer Tools. Click **Install**.

4. Wait for the download to finish (it may take a few minutes).

5. Confirm it worked:

```bash
git --version
```

---

### Install Git on Linux (Ubuntu / Debian)

```bash
sudo apt update && sudo apt install git
```

Enter your password if prompted. Confirm with `git --version` when done.

---

### Alternative: Use VS Code instead of the terminal

If you have VS Code installed, you can skip using the terminal for cloning:

1. Open VS Code
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
3. Type **Git: Clone** and press Enter
4. Paste the repo URL when asked

VS Code handles the rest without you typing any commands.

---

## Step 1 — Install Python

Python runs the backend that powers the AI. You need version 3.10 or higher.

### Check if you already have it

```bash
python3 --version
```

On Windows, try:

```bash
python --version
```

If you see `Python 3.10` or higher, skip to Step 2.

### Install Python on Windows

1. Go to [python.org/downloads](https://www.python.org/downloads/)
2. Click the big **Download Python** button
3. Run the installer
4. **Important:** On the first screen, check the box that says **"Add Python to PATH"** before clicking Install

### Install Python on Mac

```bash
brew install python3
```

If you don't have Homebrew: go to [brew.sh](https://brew.sh) and follow the one-line install command there first.

### Install Python on Linux

```bash
sudo apt update && sudo apt install python3 python3-pip python3-venv
```

---

## Step 1b — Check that pip is installed

pip is the tool that installs Python packages. Run this to check:

```bash
pip --version
```

On Mac/Linux, try:

```bash
pip3 --version
```

If you see a version number, move on. If you get `command not found`, install it:

**Windows** (in PowerShell as Administrator):
```powershell
python -m ensurepip --upgrade
```

**Mac:**
```bash
python3 -m ensurepip --upgrade
```

**Linux (Ubuntu / Debian):**
```bash
sudo apt install python3-pip
```

After installing, close and reopen your terminal and run `pip --version` again to confirm.

---

## Step 2 — Download TUBE2TEXT

Open a terminal and run:

```bash
git clone https://github.com/eqlegendox/TUBE2TEXT.git
cd TUBE2TEXT
```

This downloads the code into a folder called `TUBE2TEXT` and moves you into it.

---

## Step 3 — Set up the Python backend

This installs all the Python packages the app needs. You only need to do this once.

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

After running these commands, you should see `(venv)` at the start of your terminal prompt. This means the virtual environment is active. Always make sure you see `(venv)` before running the server.

---

## Step 4 — Get your API keys

You need at least one AI key. Gemini is recommended — it is free and handles any video length.

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
3. Copy the **Database ID** from the URL — it is the 32-character string after the last `/` and before the `?`:
   `notion.so/`**`6ea2c5cd3252837fa237015d39b81e35`**`?v=...`

**Add a Date column:**
In your Notion database, add a property called exactly `Date Reviewed` with type **Date**.

---

## Step 5 — Start the backend and enter your keys

Make sure you are in the `backend/` folder with `(venv)` visible in your prompt, then run:

```bash
uvicorn main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Now open [http://localhost:8000/setup](http://localhost:8000/setup) in Chrome. Paste your API keys and click **Save Settings** — no restart needed.

---

## Step 6 — Load the Chrome extension

1. Open Chrome and go to `chrome://extensions`
2. Toggle **Developer mode** on (top-right corner)
3. Click **Load unpacked**
4. Select the `extension/` folder inside the cloned TUBE2TEXT folder
5. Pin the TUBE2TEXT icon by clicking the puzzle-piece icon in the Chrome toolbar and pinning it

---

## Using the extension

1. Make sure the backend is running (`uvicorn main:app --reload` in the `backend/` folder with venv active)
2. Open any YouTube video in Chrome
3. Click the TUBE2TEXT icon in the toolbar
4. Click **Generate Notes** and wait 10–30 seconds
5. Read the notes in the popup, or click the Notion link to open the saved page

---

## Starting the backend each time you use it

Every time you want to use TUBE2TEXT, you need to start the backend first. Open a terminal and run:

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

Leave this terminal window open while you are using the extension. Closing it stops the backend.

---

## Limitations

This tool is completely free, but the free tier has real limits.

| | Gemini (recommended) | Groq (fallback) |
|---|---|---|
| Max video length | ~9 hours | ~40 minutes |
| Videos per day | ~10 | ~30–50 |

Gemini handles almost any educational video. Groq is a fallback for shorter content only. If you hit the daily Gemini limit, the server automatically tries Groq. If both are exhausted, wait until midnight Pacific time for Gemini to reset.

**This tool cannot process:**
- Private or age-restricted videos
- Videos with captions disabled
- Live streams (until the stream ends and captions are processed)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `git` not recognised after installing on Windows | Close PowerShell and open a new one. If still broken, restart your computer. |
| `pip: command not found` | Run `python3 -m ensurepip --upgrade` (Mac/Linux) or `python -m ensurepip --upgrade` (Windows), then reopen your terminal |
| `pip install` fails | Make sure `(venv)` is visible in your terminal prompt — run `source venv/bin/activate` (Mac/Linux) or `venv\Scripts\activate` (Windows) first |
| `Form data requires "python-multipart"` error | Your virtual environment is not active — activate it before running `uvicorn` |
| `localhost:8000/setup` shows "Internal Server Error" | Pull the latest code (`git pull`) and restart the server |
| "No AI API key configured" | Open `http://localhost:8000/setup` and enter at least one AI key |
| "Cannot reach the backend" | The `uvicorn` server is not running — open a terminal, activate the venv, and run `uvicorn main:app --reload` |
| Extension not showing | Make sure you selected the `extension/` subfolder, not the root TUBE2TEXT folder |
| Notion save fails | Check that your integration is connected to the database and the Database ID is correct |
| "Transcripts are disabled" | The video has captions turned off — try a different video |
| Gemini quota error | You have hit the free daily limit — wait until tomorrow or add a Groq key as a fallback |
