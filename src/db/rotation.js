function clearRotation(store, guildId) {
  delete store.data.rotation_queue[guildId];
  store.save();
}

function setRotation(store, guildId, items) {
  store.data.rotation_queue[guildId] = (items || []).map(it => ({ mode: it.mode, map: it.map }));
  store.save();
}

function getRotation(store, guildId) {
  const items = store.data.rotation_queue[guildId] || [];
  // keep compatibility with old shape
  return items.map((it, idx) => ({ position: idx, mode: it.mode, map: it.map }));
}

function addRotationItem(store, guildId, item, position) {
  const current = (store.data.rotation_queue[guildId] || []).map(it => ({ mode: it.mode, map: it.map }));
  const next = (position === 'top') ? [item, ...current] : [...current, item];
  setRotation(store, guildId, next);
  return getRotation(store, guildId);
}

module.exports = { clearRotation, setRotation, getRotation, addRotationItem };
