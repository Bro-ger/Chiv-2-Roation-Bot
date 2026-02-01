# Chivalry 2 Nitrado Discord Bot

A production-ready **Discord.js v14** bot that:
- Auto-creates a `chiv2-server-status` channel (configurable)
- Posts **one** status embed message and keeps it **updated** (and **pinned**)
- Pulls server status from the **Nitrado NitrAPI**
- Supports a simple rotation queue and a “force map” workflow (via optional RCON)
- Tracks **monthly peak player counts** (based on polling) as a lightweight leaderboard

> Notes about player/gamertag lists  
> Many hosted game panels (and some Chivalry 2 server setups) do **not** expose a player list via the hosting API.
> This bot will show **player counts** reliably when the Nitrado endpoint exposes it, and can show **player names**
> only if your server exposes them via RCON and the command output is parseable.

---

## Requirements
- **Node.js 22.12+** (discord.js v14 requirement)  \
  See discord.js docs. 
- A Discord bot application with:
  - `bot` scope
  - permissions: `Send Messages`, `Embed Links`, `Manage Messages` (pin), `Manage Channels` (auto-create)
- A **Nitrado access token** (OAuth2 bearer token)

Nitrado’s API is OAuth2-based (“NitrAPI”).  \
See Nitrado’s overview article for background. 

---

## Setup

### 1) Install
```bash
npm install
```

### 2) Configure environment
Copy `.env.example` to `.env` and fill it in:

```bash
cp .env.example .env
```

Minimum:
- `DISCORD_TOKEN`
- `DISCORD_CLIENT_ID`

Then either:
- Set `NITRADO_TOKEN` and `NITRADO_SERVICE_ID` in `.env`, **or**
- Use `/setnitrado` inside Discord to set them per server (guild).

### 3) Deploy slash commands
For **guild-scoped** commands (fast updates), set `DISCORD_GUILD_ID`, then:

```bash
npm run deploy
```

For **global** commands, leave `DISCORD_GUILD_ID` blank and deploy.  
(Discord can take a while to propagate global commands.)

discord.js guide reference: deploying commands. 

### 4) Run
```bash
npm start
```

---

## Quick start in Discord

1. Run `/setupstatus`  
   - Creates the status channel if missing
   - Posts the embed
   - Pins it
2. Optional: run `/setnitrado` if not set in `.env`
3. Optional: run `/rcon set` if you want kick/ban/map commands

---

## Commands

### Status
- `/setupstatus [channel]` – creates/sets the status channel & pinned message
- `/status` – refresh status now and show a quick response
- `/setnitrado token service_id` – store Nitrado creds for this guild (saved in SQLite)

### Rotation
- `/rotation preset <regular|competitive|clan>` – load a predefined rotation set
- `/rotation add mode map position` – push a map to top or end
- `/rotation show` – show current queue
- `/rotation next` – pops next and attempts to switch (requires RCON)

### Admin (requires RCON configured)
- `/rcon set host port password` – configure RCON for this guild
- `/kick id reason`
- `/ban id duration_minutes reason`
- `/unban id`
- `/map force mode map` – attempts to switch map/mode (implementation is server-dependent)

Kicking/banning command patterns are documented by community references. 

### Leaderboard
- `/leaderboard month [yyyy-mm]` – shows top peak player counts captured by polling

---

## How Nitrado polling works

The bot calls Nitrado’s API (NitrAPI) over HTTPS with:
```
Authorization: Bearer <token>
```
Nitrado confirms the API is OAuth2-authenticated.  

**Endpoints used (common NitrAPI patterns):**
- `GET https://api.nitrado.net/services` (optional discovery)
- `GET https://api.nitrado.net/services/{serviceId}/gameservers` (status payload)

If Nitrado changes/varies the endpoint for your service, update `src/nitrado/client.js`.

---

## Data storage
SA JSON data file is created automatically at:
- `./data/bot.json`

It stores:
- guild config (status channel/message ids, nitrado token/service id, rcon settings)
- rotation queue
- sampled status history for monthly peak leaderboard

---

## Security notes
- If you use `/setnitrado`, the token is stored in SQLite **on disk**.
  Treat that file like a secret and do not commit it.
- Use an `.env` file on your host and keep your repo clean.

---

## Troubleshooting

### Deploy gives `401: Unauthorized`
Common causes:
- Using the **wrong Discord token** (bot token vs client secret)
- Missing `DISCORD_CLIENT_ID`
- Token includes quotes/whitespace

### Status embed not updating
- Confirm the bot has permission to edit messages in the status channel
- Confirm `POLL_INTERVAL_SECONDS` is not set too low

### Player list not showing
- Your server likely doesn’t expose a player list via hosting API
- Configure RCON and ensure the server supports a list/status command

---

## License
MIT
