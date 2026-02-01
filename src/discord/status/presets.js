/**
 * Rotation presets shown in the dropdown.
 * Key = preset id stored in state + used in menu values.
 */
const ROTATION_PRESETS = {
  regular: {
    name: "Regular",
    description: "Mixed modes + maps for variety",
  },
  competitive: {
      name: "Competitive (FFA → LTS → TO)",
    description: "Short warmup then structured comp flow",
  },
  clan: {
    name: "Clan",
    description: "Longer sessions for practice/coordinated play",
  },
};
module.exports = { ROTATION_PRESETS };
