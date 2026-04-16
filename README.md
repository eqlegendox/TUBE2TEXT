# TUBE2TEXT — YouTube AI Note-Taker

Turn any YouTube video into structured notes — automatically saved to Notion. Just click the extension on any video and get a full breakdown with key terms, examples, and review questions.

---

## Before you start

You need these three things installed. Check each one by running the command in your terminal.

> **How to open a terminal:**
> - **Windows** — Search "PowerShell" in the Start menu
> - **Mac** — Press `Cmd + Space`, type "Terminal", press Enter

**1. Git**
```bash
git --version
```
Not installed? See [Install Git](#install-git) below.

**2. Python 3.10+**
```bash
python3 --version
```
Not installed? Download it from [python.org/downloads](https://www.python.org/downloads/). On Windows, check **"Add Python to PATH"** during install.

**3. Google Chrome** — just needs to be installed, no setup needed.

---

## Install Git

Skip this if `git --version` already worked.

**Windows** — open PowerShell as Administrator and run:
```powershell
winget install --id Git.Git -e --source winget
```

**Mac:**
```bash
xcode-select --install
```
A popup will appear — click Install. Wait for it to finish.

**Linux:**
```bash
sudo apt update && sudo apt install git
```

After installing, close your terminal, open a new one, and run `git --version` to confirm.

---

## Setup (do this once)

### 1. Download the code

```bash
git clone https://github.com/eqlegendox/TUBE2TEXT.git
cd TUBE2TEXT/backend
```

### 2. Create a virtual environment and install packages

**Mac / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

You'll know it worked when you see `(venv)` at the start of your terminal line. Always make sure that's visible before starting the server.

### 3. Get a free Gemini API key

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with Google → click **Create API key** → copy it

That's the only key you need to get started. Notion and Groq are optional.

<details>
<summary>Optional: Groq key (fallback AI for when Gemini hits its daily limit)</summary>

1. Go to [console.groq.com/keys](https://console.groq.com/keys)
2. Create an account → **Create API key** → copy it (starts with `gsk_`)

</details>

<details>
<summary>Optional: Notion (save notes to your Notion workspace)</summary>

**Create an integration:**
1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations) → **New integration** → give it a name → Submit
2. Copy the token (starts with `secret_`)

**Connect it to a database:**
1. Open a Notion database → click `•••` top-right → **Connections** → add your integration
2. Copy the Database ID from the URL — the 32-character part before the `?`:
   `notion.so/`**`6ea2c5cd3252837fa237015d39b81e35`**`?v=...`
3. Add a property called `Date Reviewed` with type **Date** to the database

</details>

### 4. Start the server and enter your keys

Make sure `(venv)` is showing, then run:

```bash
uvicorn main:app --reload
```

Open [http://localhost:8000/setup](http://localhost:8000/setup) in Chrome, paste your Gemini key, and click **Save Settings**.

### 5. Load the Chrome extension

1. Go to `chrome://extensions` in Chrome
2. Turn on **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select the `extension/` folder from the repo
4. Pin the TUBE2TEXT icon from the puzzle-piece menu in the toolbar

---

## Every time you use it

Open a terminal in the `backend/` folder, activate the venv, and start the server:

**Mac / Linux:**
```bash
source venv/bin/activate
uvicorn main:app --reload
```

**Windows:**
```bash
venv\Scripts\activate
uvicorn main:app --reload
```

Leave that terminal open, then go to any YouTube video and click the TUBE2TEXT icon.

---

## Limits

| | Gemini (free) | Groq (free fallback) |
|---|---|---|
| Max video length | ~9 hours | ~40 minutes |
| Videos per day | ~10 | ~30–50 |

Won't work on: private videos, videos with captions disabled, or active live streams.

---

## Something not working?

| Problem | Fix |
|---------|-----|
| `git` not found after installing | Close your terminal and open a new one. If still broken, restart your computer. |
| `pip` not found | Run `python3 -m ensurepip --upgrade`, then reopen your terminal |
| `pip install` fails | Make sure `(venv)` is visible — activate the virtual environment first |
| Setup page shows "Internal Server Error" | Run `git pull` to get the latest code and restart the server |
| "No AI API key configured" | Visit `http://localhost:8000/setup` and enter your Gemini key |
| "Cannot reach the backend" | The server isn't running — start it with `uvicorn main:app --reload` |
| Extension not showing up | Make sure you selected the `extension/` subfolder, not the root folder |
| Notion not saving | Check your integration is connected to the database and the Database ID is correct |
| "Transcripts are disabled" | That video has captions turned off — try a different video |
| Hit the daily Gemini limit | Wait until tomorrow, or add a Groq key as a fallback |
