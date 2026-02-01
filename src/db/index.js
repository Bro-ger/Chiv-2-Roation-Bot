const fs = require('fs');
const path = require('path');

/**
 * Lightweight JSON-backed store to avoid native module builds on Windows.
 * Data is persisted to ./data/bot.json
 */
function initDb(env, log) {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const filePath = path.join(dataDir, 'bot.json');

  const store = {
    filePath,
    data: {
      guild_config: {},
      rotation_queue: {},
      status_samples: {}
    },
    load() {
      try {
        if (fs.existsSync(filePath)) {
          const raw = fs.readFileSync(filePath, 'utf8');
          const parsed = JSON.parse(raw || '{}');
          // Shallow merge to preserve defaults
          store.data.guild_config = parsed.guild_config || {};
          store.data.rotation_queue = parsed.rotation_queue || {};
          store.data.status_samples = parsed.status_samples || {};
        }
      } catch (e) {
        log?.warn?.({ err: e }, 'DB load failed; starting with empty store');
      }
    },
    save() {
      try {
        fs.writeFileSync(filePath, JSON.stringify(store.data, null, 2), 'utf8');
      } catch (e) {
        log?.error?.({ err: e }, 'DB save failed');
      }
    }
  };

  store.load();
  return store;
}

module.exports = { initDb };
