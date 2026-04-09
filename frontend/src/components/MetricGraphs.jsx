import { useMemo, useRef, useState } from 'react';
import { formatNumber } from '../utils/dataLoader';

const GRAPH_CONFIGS = [
  {
    key: 'war-consistency',
    title: 'WAR vs Consistency',
    description: 'Wins above replacement against the 0-100 consistency score.',
    xKey: 'war',
    xLabel: 'WAR',
    xDecimals: 3,
    yKey: 'consistencyScore',
    yLabel: 'Consistency',
    yDecimals: 1,
  },
  {
    key: 'war-improvement',
    title: 'WAR vs Improvement',
    description: 'Wins above replacement against the 0-100 improvement score.',
    xKey: 'war',
    xLabel: 'WAR',
    xDecimals: 3,
    yKey: 'improvementScore',
    yLabel: 'Improvement',
    yDecimals: 1,
  },
  {
    key: 'consistency-improvement',
    title: 'Consistency vs Improvement',
    description: 'Consistency score against the 0-100 improvement score.',
    xKey: 'consistencyScore',
    xLabel: 'Consistency',
    xDecimals: 1,
    yKey: 'improvementScore',
    yLabel: 'Improvement',
    yDecimals: 1,
  },
];

const POSITION_COLORS = {
  QB: 'var(--accent)',
  RB: 'var(--green)',
  WR: 'var(--blue)',
  TE: 'var(--amber)',
};

const SVG_WIDTH = 760;
const SVG_HEIGHT = 420;
const X_TICK_COUNT = 6;
const Y_TICK_COUNT = 6;
const MIN_ZOOM = 1;
const MAX_ZOOM = 12;
const ZOOM_STEP = 1.4;

function parseOptionalNumber(value) {
  const trimmed = String(value ?? '').trim();
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function clampCenter(center, min, max, span) {
  const half = span / 2;
  if ((max - min) <= span) {
    return (min + max) / 2;
  }
  return clamp(center, min + half, max - half);
}

function buildTicks(min, max, count) {
  return Array.from({ length: count }, (_, index) => {
    const ratio = count === 1 ? 0 : index / (count - 1);
    return min + ((max - min) * ratio);
  });
}

function ScatterMetricCard({ data, config }) {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef(null);

  const plotData = useMemo(() => {
    const points = data
      .map((player, index) => ({
        id: `${player.player}-${player.season}-${player.team}-${index}`,
        player: player.player,
        season: player.season,
        team: player.team,
        position: player.position,
        x: Number(player[config.xKey]),
        y: Number(player[config.yKey]),
      }))
      .filter((player) => Number.isFinite(player.x) && Number.isFinite(player.y));

    if (!points.length) {
      return null;
    }

    const xValues = points.map((point) => point.x);
    const yValues = points.map((point) => point.y);
    const avgX = average(xValues);
    const avgY = average(yValues);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    const xPadding = (maxX - minX || 1) * 0.12;
    const yPadding = (maxY - minY || 1) * 0.12;

    return {
      points,
      avgX,
      avgY,
      minX: minX - xPadding,
      maxX: maxX + xPadding,
      minY: minY - yPadding,
      maxY: maxY + yPadding,
    };
  }, [config.xKey, config.yKey, data]);

  const viewState = useMemo(() => {
    if (!plotData) return null;

    const baseWidth = plotData.maxX - plotData.minX || 1;
    const baseHeight = plotData.maxY - plotData.minY || 1;
    const width = baseWidth / zoom;
    const height = baseHeight / zoom;
    const resolvedCenter = center || { x: plotData.avgX, y: plotData.avgY };
    const xCenter = clampCenter(resolvedCenter.x, plotData.minX, plotData.maxX, width);
    const yCenter = clampCenter(resolvedCenter.y, plotData.minY, plotData.maxY, height);
    const xMin = xCenter - (width / 2);
    const xMax = xCenter + (width / 2);
    const yMin = yCenter - (height / 2);
    const yMax = yCenter + (height / 2);

    const xScale = (value) => ((value - xMin) / (xMax - xMin || 1)) * SVG_WIDTH;
    const yScale = (value) => SVG_HEIGHT - (((value - yMin) / (yMax - yMin || 1)) * SVG_HEIGHT);

    return {
      xMin,
      xMax,
      yMin,
      yMax,
      xCenter,
      yCenter,
      width,
      height,
      xScale,
      yScale,
      visiblePoints: plotData.points.filter((point) => (
        point.x >= xMin && point.x <= xMax && point.y >= yMin && point.y <= yMax
      )),
      xTicks: buildTicks(xMin, xMax, X_TICK_COUNT),
      yTicks: buildTicks(yMin, yMax, Y_TICK_COUNT),
    };
  }, [center, plotData, zoom]);

  const applyZoom = (nextZoom, focusRatioX = 0.5, focusRatioY = 0.5) => {
    if (!plotData || !viewState) return;

    const boundedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    const baseWidth = plotData.maxX - plotData.minX || 1;
    const baseHeight = plotData.maxY - plotData.minY || 1;
    const focusX = viewState.xMin + (viewState.width * focusRatioX);
    const focusY = viewState.yMax - (viewState.height * focusRatioY);
    const nextWidth = baseWidth / boundedZoom;
    const nextHeight = baseHeight / boundedZoom;
    const nextCenter = {
      x: clampCenter(focusX - ((focusRatioX - 0.5) * nextWidth), plotData.minX, plotData.maxX, nextWidth),
      y: clampCenter(focusY + ((focusRatioY - 0.5) * nextHeight), plotData.minY, plotData.maxY, nextHeight),
    };

    setZoom(boundedZoom);
    setCenter(nextCenter);
  };

  const handleWheel = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const ratioX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const ratioY = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    const nextZoom = event.deltaY < 0 ? zoom * ZOOM_STEP : zoom / ZOOM_STEP;
    applyZoom(nextZoom, ratioX, ratioY);
  };

  const handlePointerDown = (event) => {
    if (!plotData || !viewState) return;
    event.preventDefault();
    event.stopPropagation();
    dragStateRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startCenterX: viewState.xCenter,
      startCenterY: viewState.yCenter,
      valuePerPixelX: viewState.width / event.currentTarget.clientWidth,
      valuePerPixelY: viewState.height / event.currentTarget.clientHeight,
    };
    setIsDragging(true);
    setTooltip(null);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragStateRef.current || !plotData || !viewState) return;

    event.preventDefault();
    event.stopPropagation();

    const dragState = dragStateRef.current;
    const deltaX = event.clientX - dragState.startClientX;
    const deltaY = event.clientY - dragState.startClientY;
    setCenter({
      x: clampCenter(
        dragState.startCenterX - (deltaX * dragState.valuePerPixelX),
        plotData.minX,
        plotData.maxX,
        viewState.width
      ),
      y: clampCenter(
        dragState.startCenterY + (deltaY * dragState.valuePerPixelY),
        plotData.minY,
        plotData.maxY,
        viewState.height
      ),
    });
  };

  const endDrag = (event) => {
    if (!dragStateRef.current) return;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStateRef.current = null;
    setIsDragging(false);
  };

  const resetZoom = () => {
    setZoom(1);
    setCenter(plotData ? { x: plotData.avgX, y: plotData.avgY } : null);
  };

  if (!plotData || !viewState) {
    return null;
  }

  return (
    <div className="metric-graph-card">
      <div className="metric-graph-head">
        <div>
          <h2>{config.title}</h2>
          <p>{config.description}</p>
        </div>
        <div className="metric-graph-tools">
          <span className="metric-graph-zoom-label">Zoom {formatNumber(zoom, 1)}x</span>
          <button type="button" onClick={() => applyZoom(zoom / ZOOM_STEP)}>-</button>
          <button type="button" onClick={() => applyZoom(zoom * ZOOM_STEP)}>+</button>
          <button type="button" onClick={resetZoom}>Reset</button>
        </div>
      </div>

      <div className="metric-graph-shell">
        <div className="metric-graph-axis-title metric-graph-axis-title-y">{config.yLabel}</div>
        <div className="metric-graph-frame">
          <div className="metric-graph-y-axis">
            {viewState.yTicks.slice().reverse().map((tick) => (
              <span key={`${config.key}-y-${tick}`}>{formatNumber(tick, config.yDecimals)}</span>
            ))}
          </div>
          <div className="metric-graph-plot-wrap">
            <div
              className={`metric-graph-plot ${isDragging ? 'is-dragging' : ''}`}
              onWheel={handleWheel}
              onMouseLeave={() => setTooltip(null)}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} role="img" aria-label={config.title}>
                {viewState.yTicks.map((tick) => (
                  <line
                    key={`${config.key}-grid-y-${tick}`}
                    className="metric-grid-line"
                    x1="0"
                    x2={SVG_WIDTH}
                    y1={viewState.yScale(tick)}
                    y2={viewState.yScale(tick)}
                  />
                ))}
                {viewState.xTicks.map((tick) => (
                  <line
                    key={`${config.key}-grid-x-${tick}`}
                    className="metric-grid-line"
                    x1={viewState.xScale(tick)}
                    x2={viewState.xScale(tick)}
                    y1="0"
                    y2={SVG_HEIGHT}
                  />
                ))}

                {plotData.avgY >= viewState.yMin && plotData.avgY <= viewState.yMax && (
                  <line
                    className="metric-average-line"
                    x1="0"
                    x2={SVG_WIDTH}
                    y1={viewState.yScale(plotData.avgY)}
                    y2={viewState.yScale(plotData.avgY)}
                  />
                )}
                {plotData.avgX >= viewState.xMin && plotData.avgX <= viewState.xMax && (
                  <line
                    className="metric-average-line"
                    x1={viewState.xScale(plotData.avgX)}
                    x2={viewState.xScale(plotData.avgX)}
                    y1="0"
                    y2={SVG_HEIGHT}
                  />
                )}

                {viewState.visiblePoints.map((point) => {
                  const cx = viewState.xScale(point.x);
                  const cy = viewState.yScale(point.y);
                  const fill = POSITION_COLORS[point.position] || 'var(--ink)';

                  return (
                    <circle
                      key={point.id}
                      cx={cx}
                      cy={cy}
                      r="4.5"
                      className="metric-dot"
                      style={{ '--dot-color': fill }}
                      onMouseEnter={(event) => {
                        if (dragStateRef.current) return;
                        const rect = event.currentTarget.ownerSVGElement.getBoundingClientRect();
                        setTooltip({
                          player: point,
                          left: event.clientX - rect.left + 14,
                          top: event.clientY - rect.top - 14,
                          boundsWidth: rect.width,
                          boundsHeight: rect.height,
                        });
                      }}
                      onMouseMove={(event) => {
                        if (dragStateRef.current) return;
                        const rect = event.currentTarget.ownerSVGElement.getBoundingClientRect();
                        setTooltip({
                          player: point,
                          left: event.clientX - rect.left + 14,
                          top: event.clientY - rect.top - 14,
                          boundsWidth: rect.width,
                          boundsHeight: rect.height,
                        });
                      }}
                    />
                  );
                })}
              </svg>

              {tooltip && (
                <div
                  className="metric-tooltip"
                  style={{
                    left: `${Math.min(tooltip.left, tooltip.boundsWidth - 210)}px`,
                    top: `${Math.min(Math.max(tooltip.top, 12), tooltip.boundsHeight - 96)}px`,
                  }}
                >
                  <div className="metric-tooltip-name">{tooltip.player.player}</div>
                  <div className="metric-tooltip-meta">
                    {tooltip.player.position} | {tooltip.player.team} | {tooltip.player.season}
                  </div>
                  <div>{config.xLabel}: {formatNumber(tooltip.player.x, config.xDecimals)}</div>
                  <div>{config.yLabel}: {formatNumber(tooltip.player.y, config.yDecimals)}</div>
                </div>
              )}
            </div>
            <div className="metric-graph-x-axis">
              {viewState.xTicks.map((tick) => (
                <span key={`${config.key}-x-${tick}`}>{formatNumber(tick, config.xDecimals)}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="metric-graph-axis-title metric-graph-axis-title-x">{config.xLabel}</div>
      </div>

      <div className="metric-graph-note">
        <span>Dashed lines mark average {config.xLabel} and average {config.yLabel}.</span>
        <span>Scroll on the chart or use the controls to zoom.</span>
      </div>
    </div>
  );
}

export default function MetricGraphs({ data, loading, error }) {
  const [selectedGraphKey, setSelectedGraphKey] = useState(GRAPH_CONFIGS[0].key);
  const [rangeFilters, setRangeFilters] = useState({});
  const playerData = useMemo(
    () => data.filter((player) => (
      Number.isFinite(player.war) &&
      Number.isFinite(player.consistencyScore) &&
      Number.isFinite(player.improvementScore)
    )),
    [data]
  );
  const selectedGraph = GRAPH_CONFIGS.find((graph) => graph.key === selectedGraphKey) || GRAPH_CONFIGS[0];
  const selectedRange = rangeFilters[selectedGraph.key] || { xMin: '', xMax: '', yMin: '', yMax: '' };

  const graphBounds = useMemo(() => {
    if (!playerData.length) return null;

    const xValues = playerData.map((player) => Number(player[selectedGraph.xKey])).filter(Number.isFinite);
    const yValues = playerData.map((player) => Number(player[selectedGraph.yKey])).filter(Number.isFinite);

    if (!xValues.length || !yValues.length) return null;

    return {
      xMin: Math.min(...xValues),
      xMax: Math.max(...xValues),
      yMin: Math.min(...yValues),
      yMax: Math.max(...yValues),
    };
  }, [playerData, selectedGraph.xKey, selectedGraph.yKey]);

  const filteredPlayerData = useMemo(() => {
    const xMin = parseOptionalNumber(selectedRange.xMin);
    const xMax = parseOptionalNumber(selectedRange.xMax);
    const yMin = parseOptionalNumber(selectedRange.yMin);
    const yMax = parseOptionalNumber(selectedRange.yMax);

    return playerData.filter((player) => {
      const xValue = Number(player[selectedGraph.xKey]);
      const yValue = Number(player[selectedGraph.yKey]);

      if (xMin != null && xValue < xMin) return false;
      if (xMax != null && xValue > xMax) return false;
      if (yMin != null && yValue < yMin) return false;
      if (yMax != null && yValue > yMax) return false;
      return true;
    });
  }, [playerData, selectedGraph.xKey, selectedGraph.yKey, selectedRange.xMax, selectedRange.xMin, selectedRange.yMax, selectedRange.yMin]);

  const summary = useMemo(() => {
    if (!filteredPlayerData.length) return null;

    return {
      players: filteredPlayerData.length,
      avgWar: average(filteredPlayerData.map((player) => player.war)),
      avgConsistency: average(filteredPlayerData.map((player) => player.consistencyScore)),
      avgImprovement: average(filteredPlayerData.map((player) => player.improvementScore)),
    };
  }, [filteredPlayerData]);

  const updateRangeFilter = (field, value) => {
    setRangeFilters((current) => ({
      ...current,
      [selectedGraph.key]: {
        xMin: current[selectedGraph.key]?.xMin ?? '',
        xMax: current[selectedGraph.key]?.xMax ?? '',
        yMin: current[selectedGraph.key]?.yMin ?? '',
        yMax: current[selectedGraph.key]?.yMax ?? '',
        [field]: value,
      },
    }));
  };

  const clearRangeFilters = () => {
    setRangeFilters((current) => ({
      ...current,
      [selectedGraph.key]: { xMin: '', xMax: '', yMin: '', yMax: '' },
    }));
  };

  if (error) {
    return (
      <div className="section active">
        <div className="error-box">
          Could not load football graph data. {error}
          <br />
          Make sure to run <code>python "python/FF pipeline/build_ff_json.py"</code> to generate the football JSON file.
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

  if (!summary) {
    return (
      <div className="section active">
        <div className="error-box">No football player-seasons match the current graph filters.</div>
      </div>
    );
  }

  return (
    <div className="section active">
      <div className="page-title">
        <div>
          <h1>Metric Graphs</h1>
          <p>Scatter plots for WAR, consistency, and improvement across every football player-season</p>
        </div>
      </div>

      <div className="filters filters-compact">
        <div className="filter-card filter-card-sort">
          <label>Graph</label>
          <select value={selectedGraph.key} onChange={(event) => setSelectedGraphKey(event.target.value)}>
            {GRAPH_CONFIGS.map((graph) => (
              <option key={graph.key} value={graph.key}>
                {graph.title}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-card metric-range-card">
          <label>{selectedGraph.xLabel} Range</label>
          <div className="metric-range-inputs">
            <input
              type="number"
              step="any"
              value={selectedRange.xMin}
              onChange={(event) => updateRangeFilter('xMin', event.target.value)}
              placeholder={graphBounds ? `Min ${formatNumber(graphBounds.xMin, selectedGraph.xDecimals)}` : 'Min'}
            />
            <input
              type="number"
              step="any"
              value={selectedRange.xMax}
              onChange={(event) => updateRangeFilter('xMax', event.target.value)}
              placeholder={graphBounds ? `Max ${formatNumber(graphBounds.xMax, selectedGraph.xDecimals)}` : 'Max'}
            />
          </div>
        </div>
        <div className="filter-card metric-range-card">
          <label>{selectedGraph.yLabel} Range</label>
          <div className="metric-range-inputs">
            <input
              type="number"
              step="any"
              value={selectedRange.yMin}
              onChange={(event) => updateRangeFilter('yMin', event.target.value)}
              placeholder={graphBounds ? `Min ${formatNumber(graphBounds.yMin, selectedGraph.yDecimals)}` : 'Min'}
            />
            <input
              type="number"
              step="any"
              value={selectedRange.yMax}
              onChange={(event) => updateRangeFilter('yMax', event.target.value)}
              placeholder={graphBounds ? `Max ${formatNumber(graphBounds.yMax, selectedGraph.yDecimals)}` : 'Max'}
            />
          </div>
        </div>
        <div className="filter-card metric-range-action">
          <label>Range Filters</label>
          <button type="button" className="metric-filter-reset" onClick={clearRangeFilters}>
            Clear Range
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-label">Filtered Player-Seasons</div>
          <div className="stat-card-value">{summary.players.toLocaleString()}</div>
          <div className="stat-card-sub">Each dot represents one player-season in the selected range</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Average WAR</div>
          <div className="stat-card-value">{formatNumber(summary.avgWar, 3)}</div>
          <div className="stat-card-sub">Used as the vertical average guide on WAR charts</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Average Consistency</div>
          <div className="stat-card-value">{formatNumber(summary.avgConsistency, 1)}</div>
          <div className="stat-card-sub">Used as the average guide on consistency charts</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Average Improvement</div>
          <div className="stat-card-value">{formatNumber(summary.avgImprovement, 1)}</div>
          <div className="stat-card-sub">Used as the average guide on improvement charts</div>
        </div>
      </div>

      <div className="metric-graph-grid">
        <ScatterMetricCard
          key={`${selectedGraph.key}-${selectedRange.xMin}-${selectedRange.xMax}-${selectedRange.yMin}-${selectedRange.yMax}`}
          data={filteredPlayerData}
          config={selectedGraph}
        />
      </div>
    </div>
  );
}
