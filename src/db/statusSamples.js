function insertStatusSample(store, guildId, sample) {
    if (!store.data.status_samples[guildId]) store.data.status_samples[guildId] = [];
    const arr = store.data.status_samples[guildId];

    arr.push(sample);

    // keep last ~50k samples per guild to prevent runaway file growth
    if (arr.length > 50000) arr.splice(0, arr.length - 50000);

    store.save();
}

function getMonthlyDailyPeaks(store, guildId, yyyyMm) {
    const arr = store.data.status_samples[guildId] || [];

    // yyyyMm like "2026-01"
    const [yy, mm] = String(yyyyMm).split('-');
    if (!yy || !mm) return { peaks: [], bestDay: null, bestPeak: null };

    const prefix = `${yy}-${mm.padStart(2, '0')}-`;

    // day -> peak
    const peaksByDay = new Map();

    for (const s of arr) {
        const ts = String(s.ts || '');
        if (!ts.startsWith(prefix)) continue;

        const day = ts.slice(0, 10); // YYYY-MM-DD
        const p = Number(s.player_count);
        if (!Number.isFinite(p)) continue;

        const existing = peaksByDay.get(day);
        if (existing === undefined || p > existing) peaksByDay.set(day, p);
    }

    const peaks = Array.from(peaksByDay.entries())
        .map(([day, peak]) => ({ day, peak }))
        .sort((a, b) => b.peak - a.peak || a.day.localeCompare(b.day));

    const best = peaks.length ? peaks[0] : null;

    return {
        peaks,
        bestDay: best?.day || null,
        bestPeak: (typeof best?.peak === 'number') ? best.peak : null
    };
}

module.exports = { insertStatusSample, getMonthlyDailyPeaks };