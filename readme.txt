# Reel — Your Personal Movie Companion

A personal movie recommendation and tracking app powered by Claude AI. Get tailored movie and series recommendations based on your taste, log what you’ve watched, and track your ratings — all stored persistently in the cloud.

-----

## What It Does

- **Personalized recommendations** — Claude recommends movies and series matched to your favorite genres, actors, and streaming services
- **Watch history** — log everything you watch with a rating and notes
- **Taste profile** — customize your genres, actors, and streaming services
- **Persistent storage** — your data lives on the server, not in the browser

-----

## What You Need

- A [GitHub](https://github.com) account
- A [Render](https://render.com) account (connected to your GitHub)
- An [Anthropic API key](https://console.anthropic.com) (for recommendations — costs ~$0.01–0.02 per session)

-----

## Step 1 — Fork or Copy the Repo

**Option A — Fork (easiest):**
On the GitHub repo page, click **Fork** in the top right. This copies the repo to your own GitHub account.

**Option B — Create a new repo manually:**

1. Go to [github.com/new](https://github.com/new) and create a new private repo
1. Add these files manually (use GitHub’s built-in editor):
- `server.js`
- `package.json`
- `render.yaml`
- `public/index.html`

-----

## Step 2 — Deploy to Render

1. Go to [render.com](https://render.com) and sign up (connect with GitHub)
1. Click **New → Web Service**
1. Select your forked/copied repo
1. Render will detect `render.yaml` automatically — it configures everything
1. Set these manually if not auto-detected:
- **Build Command:** `npm install`
- **Start Command:** `node server.js`
- **Instance Type:** Starter ($7/month) — required for persistent disk

> ⚠️ **Don’t skip this step:** Under **Disks**, add a disk with:
> 
> - **Name:** `reel-data`
> - **Mount Path:** `/data`
> - **Size:** 1 GB
> 
> Without this disk, the app will crash on startup (it can’t create its data folder) and your watch history won’t survive a redeploy. This is the single most common setup mistake — do it before clicking Deploy.

1. Click **Deploy**

Deployment takes 2–3 minutes. You’ll get a URL like `your-app-name.onrender.com`.

-----

## Step 3 — Add Your API Key

1. Open your app URL in the browser
1. Click **⚙ Profile** in the top right
1. Paste your Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com))
1. Click **Save Profile**

-----

## Step 4 — Customize Your Profile

In **⚙ Profile** you can:

- Add or remove streaming services
- Add or remove favorite genres
- Add or remove favorite actors
- Set your preferred era

Your watch history seeds automatically with some example entries — delete them in the **History** tab if you want a clean start.

-----

## Costs

|Item                           |Cost                   |
|-------------------------------|-----------------------|
|Render Starter instance        |$7/month               |
|Render disk (1 GB)             |~$0.25/month           |
|Anthropic API (recommendations)|~$0.01–0.02 per session|

Total: roughly **$7–8/month** plus a few cents of API usage.

-----

## Updating the App

When you receive updated files:

1. Open the file in your GitHub repo
1. Click the pencil ✏️ icon to edit
1. Select all, paste the new content
1. Click **Commit changes**
1. Render auto-deploys within 1–2 minutes

-----

## File Structure

```
reel-app/
├── server.js          # Node.js server + API endpoints
├── package.json       # Dependencies
├── render.yaml        # Render deployment config
└── public/
    └── index.html     # The entire frontend app
```

-----

## Troubleshooting

**“Could not load recommendations”**

- Check that your API key is saved in ⚙ Profile
- Make sure you have credits at [console.anthropic.com](https://console.anthropic.com)

**Build failed on Render**

- Check that `package.json` is valid JSON (no extra characters)
- Make sure Build Command is `npm install` and Start Command is `node server.js`

**Data not persisting between deploys**

- Make sure the `/data` disk is attached in Render under your service → Disks

**App not loading**

- Check Render logs under your service → Logs
- Make sure `public/index.html` is inside a `public` folder, not at the root
