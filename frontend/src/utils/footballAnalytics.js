const WEEK_COLUMNS = Array.from({ length: 18 }, (_, index) => String(index + 1));
const DEFAULT_SAMPLE_COUNT = 600;

export const DEFAULT_LEAGUE_SETTINGS = {
  teams: 10,
  qb: 1,
  rb: 2,
  wr: 2,
  te: 1,
  flex: 2,
};

function parseWeeklyValue(rawValue) {
  if (rawValue == null) return null;
  const value = String(rawValue).trim();
  if (value === '' || value === '-' || value === 'BYE') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPlayerKey(row) {
  return `${row.season}::${row.Player}::${row.Team}::${row.Pos}`;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function populationStdDev(values) {
  if (values.length <= 1) return 0;
  const mean = average(values);
  const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
  return Math.sqrt(variance);
}

function slope(values) {
  const points = values.map((value, index) => [index + 1, value]);
  if (points.length <= 1) return 0;

  const xMean = average(points.map(([x]) => x));
  const yMean = average(points.map(([, y]) => y));
  const numerator = points.reduce((sum, [x, y]) => sum + ((x - xMean) * (y - yMean)), 0);
  const denominator = points.reduce((sum, [x]) => sum + ((x - xMean) ** 2), 0);
  if (Math.abs(denominator) < 1e-9) return 0;
  return numerator / denominator;
}

function trendScore(values) {
  const stddev = populationStdDev(values);
  if (Math.abs(stddev) < 1e-9) return 50;

  const trend = slope(values) / stddev;
  const poweredTrend = Math.sign(trend) * (Math.abs(trend) ** 0.7);
  return 50 + (50 * Math.tanh(poweredTrend));
}

function consistencyScore(stddev, stdevMin, stdevMax) {
  if (Math.abs(stdevMax - stdevMin) < 1e-9) return 100;
  const rawScore = 100 * ((stdevMax - stddev) / (stdevMax - stdevMin));
  return 100 * ((rawScore / 100) ** 0.75);
}

function sortDescending(values) {
  return [...values].sort((a, b) => b.points - a.points);
}

function cutoffAt(scores, count) {
  if (!scores.length) return null;
  if (count < 0) return scores[0].points;
  if (scores.length <= count) return scores[scores.length - 1].points;
  return scores[count].points;
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return function random() {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(parts) {
  const text = parts.join('|');
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function sampleWithoutReplacement(array, count, random) {
  const pool = [...array];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }
  return pool.slice(0, count);
}

function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * absX);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-(absX ** 2));
  return sign * y;
}

function normalCdf(x) {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

function normalInvCdf(p) {
  const clipped = Math.min(Math.max(p, 1e-9), 1 - 1e-9);
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const plow = 0.02425;
  const phigh = 1 - plow;

  if (clipped < plow) {
    const q = Math.sqrt(-2 * Math.log(clipped));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  if (clipped > phigh) {
    const q = Math.sqrt(-2 * Math.log(1 - clipped));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  const q = clipped - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

function percentileRank(values, target) {
  if (!values.length) return 0.5;
  let below = 0;
  let equal = 0;
  for (const value of values) {
    if (value < target) below += 1;
    else if (value === target) equal += 1;
  }
  return (below + (0.5 * equal)) / values.length;
}

function buildSeasonWeekContext(seasonRows, settings) {
  const byWeek = new Map();

  for (const row of seasonRows) {
    for (const week of WEEK_COLUMNS) {
      const points = parseWeeklyValue(row[week]);
      if (points == null) continue;

      if (!byWeek.has(week)) {
        byWeek.set(week, { QB: [], RB: [], WR: [], TE: [] });
      }
      byWeek.get(week)[row.Pos].push({
        id: formatPlayerKey(row),
        points,
        position: row.Pos,
      });
    }
  }

  const contextByWeek = new Map();
  for (const week of WEEK_COLUMNS) {
    const grouped = byWeek.get(week) || { QB: [], RB: [], WR: [], TE: [] };
    const qbs = sortDescending(grouped.QB);
    const rbs = sortDescending(grouped.RB);
    const wrs = sortDescending(grouped.WR);
    const tes = sortDescending(grouped.TE);

    const qbCutoff = settings.qb > 0 ? cutoffAt(qbs, (settings.teams * settings.qb)) : null;

    const reservedCounts = {
      RB: settings.teams * settings.rb,
      WR: settings.teams * settings.wr,
      TE: settings.teams * settings.te,
    };

    const remainingSkillScores = [
      ...rbs.slice(reservedCounts.RB),
      ...wrs.slice(reservedCounts.WR),
      ...tes.slice(reservedCounts.TE),
    ].sort((a, b) => b.points - a.points);

    const flexCutoff = cutoffAt(remainingSkillScores, settings.teams * settings.flex);

    const qbNeeded = settings.qb;
    const rbNeeded = settings.rb;
    const wrNeeded = settings.wr;
    const teNeeded = settings.te;
    const flexNeeded = settings.flex;

    const sampleScores = [];
    const canSample =
      qbs.length >= qbNeeded &&
      rbs.length >= rbNeeded &&
      wrs.length >= wrNeeded &&
      tes.length >= teNeeded &&
      (rbs.length - rbNeeded) + (wrs.length - wrNeeded) + (tes.length - teNeeded) >= flexNeeded;

    if (canSample) {
      const random = mulberry32(hashSeed([
        seasonRows[0]?.season || '',
        week,
        String(settings.teams),
        String(settings.qb),
        String(settings.rb),
        String(settings.wr),
        String(settings.te),
        String(settings.flex),
      ]));

      for (let sample = 0; sample < DEFAULT_SAMPLE_COUNT; sample += 1) {
        const selectedQbs = sampleWithoutReplacement(qbs, qbNeeded, random);
        const selectedRbs = sampleWithoutReplacement(rbs, rbNeeded, random);
        const selectedWrs = sampleWithoutReplacement(wrs, wrNeeded, random);
        const selectedTes = sampleWithoutReplacement(tes, teNeeded, random);

        const takenIds = new Set([
          ...selectedRbs.map((player) => player.id),
          ...selectedWrs.map((player) => player.id),
          ...selectedTes.map((player) => player.id),
        ]);

        const flexPool = [...rbs, ...wrs, ...tes].filter((player) => !takenIds.has(player.id));
        if (flexPool.length < flexNeeded) continue;

        const selectedFlex = sampleWithoutReplacement(flexPool, flexNeeded, random);
        const total = [
          ...selectedQbs,
          ...selectedRbs,
          ...selectedWrs,
          ...selectedTes,
          ...selectedFlex,
        ].reduce((sum, player) => sum + player.points, 0);
        sampleScores.push(total);
      }
    }

    const distributionStdDev = populationStdDev(sampleScores);
    const skillSlotCount = settings.rb + settings.wr + settings.te + settings.flex;
    const replacementScore =
      (qbCutoff == null ? 0 : settings.qb * qbCutoff) +
      (flexCutoff == null ? 0 : skillSlotCount * flexCutoff);
    const replacementWinRate = sampleScores.length ? percentileRank(sampleScores, replacementScore) : 0.5;

    contextByWeek.set(week, {
      qbCutoff,
      flexCutoff,
      replacementWinRate,
      sigmaD: distributionStdDev > 0 ? distributionStdDev * Math.sqrt(2) : null,
    });
  }

  return contextByWeek;
}

function buildPlayerSeasonSummary(row, weekContext) {
  const pointsValues = [];
  const warValues = [];

  for (const week of WEEK_COLUMNS) {
    const actualPoints = parseWeeklyValue(row[week]);
    if (actualPoints == null) continue;

    const context = weekContext.get(week);
    if (!context) continue;

    const cutoff = row.Pos === 'QB' ? context.qbCutoff : context.flexCutoff;
    if (cutoff == null) continue;

    const diff = actualPoints - cutoff;
    pointsValues.push(diff);

    if (context.sigmaD != null && context.sigmaD > 0) {
      const replacementWinRate = Math.min(Math.max(context.replacementWinRate, 1e-9), 1 - 1e-9);
      const war =
        normalCdf(normalInvCdf(replacementWinRate) + (diff / context.sigmaD)) -
        replacementWinRate;
      warValues.push(war);
    }
  }

  const pointsStdDev = populationStdDev(pointsValues);
  const pointsAverage = average(pointsValues);
  const pointsTotal = pointsValues.reduce((sum, value) => sum + value, 0);
  const warTotal = warValues.reduce((sum, value) => sum + value, 0);

  return {
    player: row.Player,
    season: row.season,
    position: row.Pos,
    team: row.Team,
    gp: parseInt(row.GP, 10) || pointsValues.length,
    avg: pointsAverage,
    ttl: pointsTotal,
    war: warTotal,
    consistencyBaseStdDev: pointsStdDev,
    improvementScore: trendScore(pointsValues),
    pointWeekCount: pointsValues.length,
    bestPointWeek: pointsValues.length ? Math.max(...pointsValues) : null,
  };
}

function shouldKeepSummary(summary) {
  const gamesPlayed = summary.pointWeekCount;
  const bestWeek = summary.bestPointWeek;

  if (bestWeek == null) return false;

  if (summary.position === 'RB') {
    if (gamesPlayed <= 4 && bestWeek <= -5) return false;
    return true;
  }

  if (summary.position === 'TE') {
    if (gamesPlayed <= 5 && bestWeek <= -4) return false;
    return true;
  }

  if (summary.position === 'WR') {
    if (bestWeek <= -8) return false;
    if (gamesPlayed <= 5 && bestWeek <= -4) return false;
    return true;
  }

  if (summary.position === 'QB') {
    if (gamesPlayed <= 5 && bestWeek <= -6) return false;
    return true;
  }

  return true;
}

export function computeFootballSeasonSummaries(rawRows, settings) {
  const seasonGroups = new Map();
  for (const row of rawRows) {
    if (!seasonGroups.has(row.season)) {
      seasonGroups.set(row.season, []);
    }
    seasonGroups.get(row.season).push(row);
  }

  const summaries = [];
  for (const seasonRows of seasonGroups.values()) {
    const weekContext = buildSeasonWeekContext(seasonRows, settings);
    for (const row of seasonRows) {
      const summary = buildPlayerSeasonSummary(row, weekContext);
      if (shouldKeepSummary(summary)) {
        summaries.push(summary);
      }
    }
  }

  const stdevsByPosition = new Map();
  for (const summary of summaries) {
    if (!stdevsByPosition.has(summary.position)) {
      stdevsByPosition.set(summary.position, []);
    }
    stdevsByPosition.get(summary.position).push(summary.consistencyBaseStdDev);
  }

  return summaries.map((summary) => {
    const positionStdDevs = stdevsByPosition.get(summary.position) || [summary.consistencyBaseStdDev];
    const minStdDev = Math.min(...positionStdDevs);
    const maxStdDev = Math.max(...positionStdDevs);

    return {
      player: summary.player,
      season: summary.season,
      position: summary.position,
      team: summary.team,
      gp: summary.gp,
      avg: summary.avg,
      ttl: summary.ttl,
      war: summary.war,
      consistencyScore: consistencyScore(summary.consistencyBaseStdDev, minStdDev, maxStdDev),
      improvementScore: summary.improvementScore,
    };
  });
}
