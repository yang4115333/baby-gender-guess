# 🍼 Baby Guess

A fun, minimalist web app for friends to guess the gender of an upcoming baby — and leave blessings!

![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green) ![Zero Dependencies](https://img.shields.io/badge/dependencies-zero-blue)

**Live Demo:** The original instance was used for a real baby gender reveal party 🎉

## Features

- 🗳️ **Vote** — Boy or Girl? One vote per name (can re-vote to change)
- 📊 **Live Stats** — Real-time vote count and percentage bar
- 💬 **Blessings** — Friends can leave sweet messages for the baby
- 🔒 **Admin Reveal** — Set the answer with a secret token to reveal results
- 📱 **Mobile-friendly** — Clean, responsive design
- ⚡ **Zero dependencies** — Pure Node.js, no framework needed

## Quick Start

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/baby-guess.git
cd baby-guess

# Set up data files
cp votes.example.json votes.json
cp blessings.example.json blessings.json
cp answer.example.json answer.json

# Set admin token (optional, defaults to "change-me")
export ADMIN_TOKEN="your-secret-token"

# Run
node server.js
```

Open `http://localhost:8899` 🎉

## How It Works

- **Vote:** POST `/api/vote` with `{ name, vote: "boy"|"girl" }`
- **Stats:** GET `/api/stats` returns votes + answer (if revealed)
- **Blessings:** POST `/api/blessing` with `{ name, text }` / GET `/api/blessings`
- **Reveal:** POST `/api/reveal` with `{ answer: "boy"|"girl", token: "..." }`

All data is stored in JSON files — no database needed.

## Customization

- Replace `public/hero.jpg` with your own photo
- Edit `public/index.html` to change colors, text, and styling
- Set `ADMIN_TOKEN` env var for the reveal endpoint

## Deploy

Works behind any reverse proxy (Nginx, Caddy, Cloudflare Tunnel, etc.).

```bash
# Example: run on port 8899
ADMIN_TOKEN=mytoken node server.js
```

## License

MIT
