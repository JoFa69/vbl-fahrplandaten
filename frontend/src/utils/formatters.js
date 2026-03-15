/**
 * Shared formatter utilities for the VBL Fahrplandaten app.
 * Import from here instead of defining locally in each component.
 */

/**
 * Formats seconds-since-midnight to HH:MM.
 * Handles 24h+ overflow (e.g. 25:30 stays 25:30, not 01:30).
 * @param {number|null} seconds
 * @returns {string}
 */
export function formatTime(seconds) {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Formats a duration in seconds to a human-readable string (e.g. "12 Min" or "3 Min 45s").
 * @param {number|null} sec
 * @returns {string}
 */
export function formatFahrzeit(sec) {
    if (sec == null || isNaN(sec)) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    if (s === 0) return `${m} Min`;
    return `${m} Min ${s}s`;
}

/**
 * Formats a number using Swiss locale (de-CH).
 * @param {number} num
 * @param {number} decimals
 * @returns {string}
 */
export function formatNumber(num, decimals = 0) {
    return new Intl.NumberFormat('de-CH', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num);
}
