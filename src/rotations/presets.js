const PRESETS = {
    regular: {
        name: 'regular',
        description: 'Standard mixed rotation for public play',
        rotation: [
            'LTS_Wardenglade',
            'LTS_TournamentGrounds',
            'LTS_FightingPit',
            'TO_Falmire',
            'TO_RudhelmSiege',
            'TO_DarkForest',
            'TO_Stronghold',
            'TO_Citadel',
            'FFA_Courtyard',
            'FFA_Wardenglade',
            'FFA_TournamentGrounds'
        ]
    },

    competitive: {
        name: 'competitive',
        description: '30m FFA warmup → 3 LTS → 3 TO',
        rotation: [
            'FFA_TournamentGrounds',
            'LTS_Wardenglade',
            'LTS_TournamentGrounds',
            'LTS_FightingPit',
            'TO_Galencourt',
            'TO_RudhelmSiege',
            'TO_Lionspire'
        ]
    },

    staging: {
        name: 'staging',
        description: 'Long FFA used to gather players before events',
        rotation: ['FFA_TournamentGrounds']
    },

    mason_defense: {
        name: 'mason_defense',
        description: 'Team Objective maps where Mason always defends',
        rotation: [
            'TO_RudhelmSiege',
            'TO_DarkForest'
        ]
    },

    agatha_defense: {
        name: 'agatha_defense',
        description: 'Team Objective maps where Agatha always defends',
        rotation: [
            'TO_Falmire',
            'TO_Citadel'
        ]
    }
};

function getPreset(name) {
    return PRESETS[name] || null;
}

module.exports = { PRESETS, getPreset };