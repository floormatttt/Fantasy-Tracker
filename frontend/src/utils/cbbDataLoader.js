/**
 * College Basketball Analytics data loader
 */

export async function loadCBBData() {
  try {
    const DATA_URL = 'https://raw.githubusercontent.com/highbrowwharf37/Ishaan-s-coding/main/data.json';
    const res = await fetch(DATA_URL + '?t=' + Date.now());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return {
      teams: parseTeams(json.teams || []),
      players: parsePlayers(json.players || []),
      updated: json.updated || new Date().toISOString()
    };
  } catch (err) {
    console.error('Error loading CBB data:', err);
    throw err;
  }
}

function parseTeams(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(r => {
    if (!Array.isArray(r)) return null;
    const rec = String(r[3] || '0-0').split('-');
    const w = parseInt(rec[0]) || 0;
    const l = parseInt(rec[1]) || 0;
    const adjOE = parseFloat(r[4]) || 0;
    const adjDE = parseFloat(r[6]) || 0;
    const barthag = parseFloat(r[8]) || 0;
    const netEM = parseFloat(r[10]) || (adjOE - adjDE);
    const oppO = parseFloat(r[23]) || 0;
    const oppD = parseFloat(r[24]) || 0;
    const sos = parseFloat(r[40]) || 0;
    const wab = parseFloat(r[38]) || 0;
    const adjT = parseFloat(r[42]) || 0;
    return {
      name: String(r[1] || ''),
      conf: String(r[2] || ''),
      w, l, record: `${w}–${l}`,
      adjOE, adjDE, netEM, barthag,
      sos, wab, adjT, oppO, oppD,
      raw: r
    };
  }).filter(t => t && t.name);
}

function parsePlayers(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter(p => Array.isArray(p) && p[0]);
}

export function getConferences(teams) {
  return [...new Set(teams.map(t => t.conf))].sort();
}

export function formatBarthag(value) {
  return (value * 100).toFixed(1) + '%';
}

export function getSOLBadge(barthag) {
  if (barthag >= 0.80) return { text: 'Elite', class: 'sol-elite' };
  if (barthag >= 0.65) return { text: 'Good', class: 'sol-good' };
  if (barthag >= 0.50) return { text: 'Average', class: 'sol-avg' };
  return { text: 'Poor', class: 'sol-poor' };
}
