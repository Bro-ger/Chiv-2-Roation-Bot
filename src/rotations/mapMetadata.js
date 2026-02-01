// JavaScript source code
/**
 * Map metadata used for embed + semantic presets.
 * Key by the exact rotation token you use (e.g., "TO_RudhelmSiege").
 */
const MAP_META = {
    // --- Team Objective (Agatha vs Mason) ---
    TO_Falmire: { mode: 'TO', attackers: 'Agatha', defenders: 'Mason' },
    TO_RudhelmSiege: { mode: 'TO', attackers: 'Agatha', defenders: 'Mason' },

    TO_DarkForest: { mode: 'TO', attackers: 'Mason', defenders: 'Agatha' },
    TO_Galencourt: { mode: 'TO', attackers: 'Mason', defenders: 'Agatha' },
    TO_Lionspire: { mode: 'TO', attackers: 'Mason', defenders: 'Agatha' },

    // Add more here as needed...
};

function getMapMeta(mapToken) {
    return MAP_META[mapToken] || null;
}

module.exports = { MAP_META, getMapMeta };