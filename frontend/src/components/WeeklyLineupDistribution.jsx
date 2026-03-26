import { useMemo, useState } from 'react';
import { formatNumber } from '../utils/dataLoader';

const METRIC_OPTIONS = [
  { value: 'mean', label: 'Mean Score', colorVar: 'var(--accent)' },
  { value: 'p50', label: 'Median Score', colorVar: 'var(--blue)' },
  { value: 'p75', label: '75th Percentile', colorVar: 'var(--green)' },
  { value: 'p90', label: '90th Percentile', colorVar: 'var(--amber)' },
  { value: 'scoreGe100Rate', label: '100+ Rate', colorVar: 'var(--purple)' },
];

const OVERALL_AVERAGE_METRICS = [
  { key: 'eligibleQb', label: 'Eligible QB', decimals: 1 },
  { key: 'eligibleRb', label: 'Eligible RB', decimals: 1 },
  { key: 'eligibleWr', label: 'Eligible WR', decimals: 1 },
  { key: 'eligibleTe', label: 'Eligible TE', decimals: 1 },
  { key: 'samples', label: 'Samples', decimals: 0 },
  { key: 'mean', label: 'Mean', decimals: 1 },
  { key: 'stdev', label: 'Stdev', decimals: 1 },
  { key: 'min', label: 'Min', decimals: 1 },
  { key: 'p05', label: 'P05', decimals: 1 },
  { key: 'p10', label: 'P10', decimals: 1 },
  { key: 'p25', label: 'P25', decimals: 1 },
  { key: 'p50', label: 'Median', decimals: 1 },
  { key: 'p75', label: 'P75', decimals: 1 },
  { key: 'p90', label: 'P90', decimals: 1 },
  { key: 'p95', label: 'P95', decimals: 1 },
  { key: 'max', label: 'Max', decimals: 1 },
  { key: 'scoreGe100Rate', label: '100+ Rate', isPercent: true },
];

function buildLinePath(points) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function buildBandPath(upperPoints, lowerPoints) {
  if (!upperPoints.length || !lowerPoints.length) return '';
  const topPath = upperPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const bottomPath = [...lowerPoints].reverse().map((point) => `L ${point.x} ${point.y}`).join(' ');
  return `${topPath} ${bottomPath} Z`;
}

function formatMetricValue(metric, value) {
  if (metric === 'scoreGe100Rate') {
    return `${(value * 100).toFixed(1)}%`;
  }
  return formatNumber(value, 1);
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export default function WeeklyLineupDistribution({ data, loading, error }) {
  const [selectedSeason, setSelectedSeason] = useState('ALL');
  const [selectedMetric, setSelectedMetric] = useState('mean');

  const seasons = useMemo(
    () => [...new Set(data.map((row) => row.season))].sort((a, b) => parseInt(b) - parseInt(a)),
    [data]
  );

  const resolvedSeason = selectedSeason === 'ALL' || seasons.includes(selectedSeason)
    ? selectedSeason
    : seasons[0] || '';

  const seasonRows = useMemo(
    () => {
      if (resolvedSeason === 'ALL') {
        const seasonMap = new Map();
        for (const row of data) {
          if (!seasonMap.has(row.season)) {
            seasonMap.set(row.season, []);
          }
          seasonMap.get(row.season).push(row);
        }

        return [...seasonMap.entries()]
          .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
          .map(([season, rows]) => ({
            season,
            week: parseInt(season),
            eligibleQb: average(rows.map((row) => row.eligibleQb)),
            eligibleRb: average(rows.map((row) => row.eligibleRb)),
            eligibleWr: average(rows.map((row) => row.eligibleWr)),
            eligibleTe: average(rows.map((row) => row.eligibleTe)),
            samples: average(rows.map((row) => row.samples)),
            mean: average(rows.map((row) => row.mean)),
            stdev: average(rows.map((row) => row.stdev)),
            min: average(rows.map((row) => row.min)),
            p05: average(rows.map((row) => row.p05)),
            p10: average(rows.map((row) => row.p10)),
            p25: average(rows.map((row) => row.p25)),
            p50: average(rows.map((row) => row.p50)),
            p75: average(rows.map((row) => row.p75)),
            p90: average(rows.map((row) => row.p90)),
            p95: average(rows.map((row) => row.p95)),
            max: average(rows.map((row) => row.max)),
            scoreGe100Rate: average(rows.map((row) => row.scoreGe100Rate)),
          }));
      }

      return data
        .filter((row) => row.season === resolvedSeason)
        .sort((a, b) => a.week - b.week);
    },
    [data, resolvedSeason]
  );

  const chartState = useMemo(() => {
    if (!seasonRows.length) {
      return { points: [], yTicks: [], linePath: '', bandPath: '' };
    }

    const metricValues = seasonRows.map((row) => row[selectedMetric]);
    const lowerBandValues = selectedMetric === 'scoreGe100Rate' ? seasonRows.map(() => 0) : seasonRows.map((row) => row.p25);
    const upperBandValues = selectedMetric === 'scoreGe100Rate' ? seasonRows.map((row) => row.scoreGe100Rate) : seasonRows.map((row) => row.p75);
    const minValue = Math.min(...metricValues, ...lowerBandValues);
    const maxValue = Math.max(...metricValues, ...upperBandValues);
    const padding = maxValue === minValue ? Math.max(1, maxValue * 0.1) : (maxValue - minValue) * 0.12;
    const chartMin = Math.max(0, minValue - padding);
    const chartMax = maxValue + padding;
    const chartWidth = 760;
    const chartHeight = 320;
    const xValues = seasonRows.map((row) => row.week);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const xForWeek = (week) => (maxX === minX ? chartWidth / 2 : ((week - minX) / (maxX - minX)) * chartWidth);
    const yForValue = (value) => chartHeight - ((value - chartMin) / (chartMax - chartMin || 1)) * chartHeight;

    const points = seasonRows.map((row) => ({
      week: row.week,
      value: row[selectedMetric],
      x: xForWeek(row.week),
      y: yForValue(row[selectedMetric]),
    }));

    const p25Points = seasonRows.map((row) => ({
      x: xForWeek(row.week),
      y: yForValue(selectedMetric === 'scoreGe100Rate' ? 0 : row.p25),
    }));

    const p75Points = seasonRows.map((row) => ({
      x: xForWeek(row.week),
      y: yForValue(selectedMetric === 'scoreGe100Rate' ? row.scoreGe100Rate : row.p75),
    }));

    const yTicks = Array.from({ length: 5 }, (_, index) => {
      const ratio = index / 4;
      const value = chartMax - ratio * (chartMax - chartMin);
      return {
        value,
        y: yForValue(value),
      };
    });

    return {
      points,
      yTicks,
      linePath: buildLinePath(points),
      bandPath: buildBandPath(p75Points, p25Points),
    };
  }, [seasonRows, selectedMetric]);

  const seasonSummary = useMemo(() => {
    if (!seasonRows.length) return null;
    const latestWeek = seasonRows[seasonRows.length - 1];
    const highestMean = seasonRows.reduce((best, row) => (row.mean > best.mean ? row : best), seasonRows[0]);
    const strongestHitRate = seasonRows.reduce(
      (best, row) => (row.scoreGe100Rate > best.scoreGe100Rate ? row : best),
      seasonRows[0]
    );
    return { latestWeek, highestMean, strongestHitRate };
  }, [seasonRows]);

  const overallAverages = useMemo(() => {
    if (!data.length) return [];

    return OVERALL_AVERAGE_METRICS.map((metric) => {
      const total = data.reduce((sum, row) => sum + row[metric.key], 0);
      const average = total / data.length;
      return {
        ...metric,
        average,
      };
    });
  }, [data]);

  if (error) {
    return (
      <div className="section active">
        <div className="error-box">
          Could not load weekly lineup distribution data. {error}
          <br />
          Make sure to run <code>python python/build_ff_json.py</code> to generate the football JSON files.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="section active">
        <div className="loading-bar">
          <div className="spinner"></div>
          Loading...
        </div>
      </div>
    );
  }

  if (!seasonRows.length || !seasonSummary) {
    return (
      <div className="section active">
        <div className="error-box">No weekly lineup distribution data is available yet.</div>
      </div>
    );
  }

  const activeMetric = METRIC_OPTIONS.find((option) => option.value === selectedMetric) || METRIC_OPTIONS[0];

  return (
    <div className="section active">
      <div className="page-title">
        <div>
          <h1>Weekly Lineup Distribution</h1>
          <p>Simulated weekly lineup scores with percentile bands and 100+ hit rates</p>
        </div>
      </div>

      <div className="filters">
        <label>Season</label>
        <select value={resolvedSeason} onChange={(e) => setSelectedSeason(e.target.value)}>
          <option value="ALL">All Seasons</option>
          {seasons.map((season) => (
            <option key={season} value={season}>
              {season}
            </option>
          ))}
        </select>

        <label>Metric</label>
        <select value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)}>
          {METRIC_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="filter-spacer"></div>
        <span className="last-updated">Weekly simulation summary</span>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-label">Latest Week</div>
          <div className="stat-card-value">W{seasonSummary.latestWeek.week}</div>
          <div className="stat-card-sub">
            Mean {formatNumber(seasonSummary.latestWeek.mean, 1)} | 100+ {formatMetricValue('scoreGe100Rate', seasonSummary.latestWeek.scoreGe100Rate)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Best Mean Week</div>
          <div className="stat-card-value">{formatNumber(seasonSummary.highestMean.mean, 1)}</div>
          <div className="stat-card-sub">Week {seasonSummary.highestMean.week}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Best 100+ Hit Rate</div>
          <div className="stat-card-value">{formatMetricValue('scoreGe100Rate', seasonSummary.strongestHitRate.scoreGe100Rate)}</div>
          <div className="stat-card-sub">Week {seasonSummary.strongestHitRate.week}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Player Pool</div>
          <div className="stat-card-value">
            {formatNumber(
              seasonSummary.latestWeek.eligibleQb
                + seasonSummary.latestWeek.eligibleRb
                + seasonSummary.latestWeek.eligibleWr
                + seasonSummary.latestWeek.eligibleTe,
              2
            )}
          </div>
          <div className="stat-card-sub">
            QB {formatNumber(seasonSummary.latestWeek.eligibleQb, 2)} | RB {formatNumber(seasonSummary.latestWeek.eligibleRb, 2)} | WR {formatNumber(seasonSummary.latestWeek.eligibleWr, 2)} | TE {formatNumber(seasonSummary.latestWeek.eligibleTe, 2)}
          </div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <div>
            <h2>{activeMetric.label} by {resolvedSeason === 'ALL' ? 'Season' : 'Week'}</h2>
            <p>
              {resolvedSeason === 'ALL'
                ? 'Each point shows that season\'s average weekly value for the selected metric.'
                : selectedMetric === 'scoreGe100Rate'
                ? 'Area shows the share of simulated lineups scoring 100 points or more.'
                : 'Shaded band shows the interquartile range between the 25th and 75th percentiles.'}
            </p>
          </div>
          <div className="chart-key">
            <span className="chart-key-band">IQR Band</span>
            <span className="chart-key-line" style={{ '--line-color': activeMetric.colorVar }}>Selected Metric</span>
          </div>
        </div>

        <div className="chart-shell">
          <div className="chart-y-axis">
            {chartState.yTicks.map((tick, index) => (
              <span key={`${tick.value}-${index}`}>{formatMetricValue(selectedMetric, tick.value)}</span>
            ))}
          </div>
          <div className="chart-plot">
            <svg viewBox="0 0 760 320" role="img" aria-label={`${activeMetric.label} trend for ${resolvedSeason === 'ALL' ? 'all seasons' : resolvedSeason}`}>
              {chartState.yTicks.map((tick, index) => (
                <line key={`${tick.value}-${index}`} x1="0" x2="760" y1={tick.y} y2={tick.y} className="chart-grid-line" />
              ))}
              {chartState.bandPath && <path d={chartState.bandPath} className="chart-band" />}
              {chartState.linePath && <path d={chartState.linePath} className="chart-line" style={{ '--line-color': activeMetric.colorVar }} />}
              {chartState.points.map((point) => (
                <g key={`week-${point.week}`}>
                  <circle cx={point.x} cy={point.y} r="4.5" className="chart-point" style={{ '--line-color': activeMetric.colorVar }} />
                  <title>{`${resolvedSeason === 'ALL' ? `Season ${seasonRows.find((row) => row.week === point.week)?.season}` : `Week ${point.week}`}: ${formatMetricValue(selectedMetric, point.value)}`}</title>
                </g>
              ))}
            </svg>
            <div className="chart-x-axis">
              {seasonRows.map((row) => (
                <span key={`x-week-${row.week}`}>{resolvedSeason === 'ALL' ? row.season : `W${row.week}`}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="distribution-table-card">
        <div className="distribution-table-header">
          <h2>Weekly Snapshot</h2>
          <p>
            {resolvedSeason === 'ALL'
              ? 'Season-level averages across all weeks, with overall averages shown in the first row.'
              : 'The same source data behind the chart, with overall averages shown in the first row.'}
          </p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{resolvedSeason === 'ALL' ? 'Season' : 'Week'}</th>
                <th className="num">Mean</th>
                <th className="num">Stdev</th>
                <th className="num">Median</th>
                <th className="num">P25</th>
                <th className="num">P75</th>
                <th className="num">P90</th>
                <th className="num">100+ Rate</th>
                <th className="num">Samples</th>
              </tr>
            </thead>
            <tbody>
              <tr className="highlight-row">
                <td className="player-cell">Overall Avg</td>
                <td className="num">{formatNumber(overallAverages.find((metric) => metric.key === 'mean')?.average ?? 0, 1)}</td>
                <td className="num">{formatNumber(overallAverages.find((metric) => metric.key === 'stdev')?.average ?? 0, 1)}</td>
                <td className="num">{formatNumber(overallAverages.find((metric) => metric.key === 'p50')?.average ?? 0, 1)}</td>
                <td className="num">{formatNumber(overallAverages.find((metric) => metric.key === 'p25')?.average ?? 0, 1)}</td>
                <td className="num">{formatNumber(overallAverages.find((metric) => metric.key === 'p75')?.average ?? 0, 1)}</td>
                <td className="num">{formatNumber(overallAverages.find((metric) => metric.key === 'p90')?.average ?? 0, 1)}</td>
                <td className="num">{`${((overallAverages.find((metric) => metric.key === 'scoreGe100Rate')?.average ?? 0) * 100).toFixed(1)}%`}</td>
                <td className="num">{formatNumber(overallAverages.find((metric) => metric.key === 'samples')?.average ?? 0, 0)}</td>
              </tr>
              {seasonRows.map((row) => (
                <tr key={`${row.season}-${row.week}`}>
                  <td className="player-cell">{resolvedSeason === 'ALL' ? row.season : `Week ${row.week}`}</td>
                  <td className="num">{formatNumber(row.mean, 1)}</td>
                  <td className="num">{formatNumber(row.stdev, 1)}</td>
                  <td className="num">{formatNumber(row.p50, 1)}</td>
                  <td className="num">{formatNumber(row.p25, 1)}</td>
                  <td className="num">{formatNumber(row.p75, 1)}</td>
                  <td className="num">{formatNumber(row.p90, 1)}</td>
                  <td className="num">{formatMetricValue('scoreGe100Rate', row.scoreGe100Rate)}</td>
                  <td className="num">{row.samples.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
