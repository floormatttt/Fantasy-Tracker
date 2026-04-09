import { useEffect, useMemo, useRef, useState } from 'react';
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

function normalizeBounds(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 1, step: 0.01 };
  }

  if (min === max) {
    const padding = Math.max(Math.abs(min) * 0.1, 1);
    return {
      min: min - padding,
      max: max + padding,
      step: padding / 250,
    };
  }

  return {
    min,
    max,
    step: (max - min) / 500,
  };
}

function createDefaultRange(bounds) {
  return {
    min: bounds.min,
    max: bounds.max,
  };
}

function formatRangeValue(value, decimals) {
  return formatNumber(value, decimals);
}

function RangeSlider({
  label,
  bounds,
  decimals,
  values,
  onChange,
  draggingRef,
}) {
  const sliderRef = useRef(null);
  const latestValuesRef = useRef(values);
  const span = bounds.max - bounds.min || 1;
  const minPercent = ((values.min - bounds.min) / span) * 100;
  const maxPercent = ((values.max - bounds.min) / span) * 100;

  useEffect(() => {
    latestValuesRef.current = values;
  }, [values]);

  useEffect(() => {
    const handlePointerMove = (event) => {
      const dragState = sliderRef.current?.dragState;
      const rect = sliderRef.current?.getBoundingClientRect();
      if (!dragState || !rect) return;

      const rawRatio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const rawValue = bounds.min + (rawRatio * span);
      const steppedValue = Math.round(rawValue / bounds.step) * bounds.step;
      const currentValues = latestValuesRef.current;
      let nextValue;
      if (dragState.edge === 'min') {
        nextValue = Math.min(steppedValue, currentValues.max);
      } else {
        nextValue = Math.max(steppedValue, currentValues.min);
      }
      onChange(dragState.edge, nextValue);
    };

    const handlePointerUp = () => {
      if (sliderRef.current) {
        sliderRef.current.dragState = null;
      }
      draggingRef.current = false;
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [bounds.max, bounds.min, bounds.step, onChange, span, draggingRef]);

  const beginDrag = (edge, event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!sliderRef.current) return;
    sliderRef.current.dragState = { edge };
    draggingRef.current = true;
  };

  const handleTrackPointerDown = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return;

    const rawRatio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const rawValue = bounds.min + (rawRatio * span);
    const currentValues = latestValuesRef.current;
    const distanceToMin = Math.abs(rawValue - currentValues.min);
    const distanceToMax = Math.abs(rawValue - currentValues.max);
    const edge = distanceToMin <= distanceToMax ? 'min' : 'max';

    beginDrag(edge, event);
    const steppedValue = Math.round(rawValue / bounds.step) * bounds.step;
    if (edge === 'min') {
      onChange('min', Math.min(steppedValue, currentValues.max));
    } else {
      onChange('max', Math.max(steppedValue, currentValues.min));
    }
  };

  return (
    <div className="metric-filter-group">
      <div className="metric-filter-header">
        <span>{label}</span>
        <span>{formatRangeValue(values.min, decimals)} to {formatRangeValue(values.max, decimals)}</span>
      </div>
      <div
        className="metric-range-slider"
        ref={sliderRef}
        onPointerDown={handleTrackPointerDown}
      >
        <div className="metric-range-track" />
        <div
          className="metric-range-selection"
          style={{
            left: `${minPercent}%`,
            width: `${Math.max(maxPercent - minPercent, 0)}%`,
          }}
        />
        <button
          type="button"
          className="metric-range-handle metric-range-handle-min"
          style={{ left: `${minPercent}%` }}
          onPointerDown={(event) => beginDrag('min', event)}
          aria-label={`${label} minimum`}
        />
        <button
          type="button"
          className="metric-range-handle metric-range-handle-max"
          style={{ left: `${maxPercent}%` }}
          onPointerDown={(event) => beginDrag('max', event)}
          aria-label={`${label} maximum`}
        />
      </div>
      <div className="metric-filter-endpoints">
        <span>{formatRangeValue(bounds.min, decimals)}</span>
        <span>{formatRangeValue(bounds.max, decimals)}</span>
      </div>
    </div>
  );
}

function FilterPopover({
  config,
  bounds,
  range,
  hasCustomFilter,
  onChange,
  onClear,
  open,
  onToggle,
}) {
  const popoverRef = useRef(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (draggingRef.current) return;
      if (popoverRef.current?.contains(event.target)) {
        return;
      }
      onToggle(false);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [onToggle, open]);

  if (!bounds) {
    return null;
  }

  return (
    <div
      className="metric-filter-popover-wrap"
      ref={popoverRef}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className={`metric-graph-tool-button ${hasCustomFilter ? 'active' : ''}`}
        onClick={(event) => {
          event.stopPropagation();
          onToggle(!open);
        }}
      >
        Filter
      </button>
      {open && (
        <div
          className="metric-filter-popover"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="metric-filter-popover-title">Metric Range Filter</div>
          <RangeSlider
            label={config.xLabel}
            bounds={bounds.x}
            decimals={config.xDecimals}
            values={range.x}
            onChange={(edge, value) => onChange('x', edge, value)}
            draggingRef={draggingRef}
          />
          <RangeSlider
            label={config.yLabel}
            bounds={bounds.y}
            decimals={config.yDecimals}
            values={range.y}
            onChange={(edge, value) => onChange('y', edge, value)}
            draggingRef={draggingRef}
          />
          <div className="metric-filter-actions">
            <button type="button" className="metric-graph-tool-button" onClick={onClear}>
              Clear Range
            </button>
            <button type="button" className="metric-graph-tool-button" onClick={() => onToggle(false)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ScatterMetricCard({
  data,
  config,
  range,
  bounds,
  hasCustomFilter,
  onRangeChange,
  onRangeClear,
}) {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const dragStateRef = useRef(null);
  const plotRef = useRef(null);

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

  useEffect(() => {
    const element = plotRef.current;
    if (!element) return undefined;

    const handleWheel = (event) => {
      event.preventDefault();
      event.stopPropagation();

      const rect = element.getBoundingClientRect();
      const ratioX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const ratioY = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      const intensity = event.ctrlKey ? 0.006 : 0.0025;
      const factor = Math.exp(-event.deltaY * intensity);
      applyZoom(zoom * factor, ratioX, ratioY);
    };

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [zoom, viewState, plotData]);

  const handlePointerDown = (event) => {
    if (!plotData || !viewState) return;
    event.preventDefault();
    event.stopPropagation();
    dragStateRef.current = {
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
          <button type="button" className="metric-graph-tool-button" onClick={() => applyZoom(zoom / ZOOM_STEP)}>-</button>
          <button type="button" className="metric-graph-tool-button" onClick={() => applyZoom(zoom * ZOOM_STEP)}>+</button>
          <button type="button" className="metric-graph-tool-button" onClick={resetZoom}>Reset</button>
          <FilterPopover
            config={config}
            bounds={bounds}
            range={range}
            hasCustomFilter={hasCustomFilter}
            onChange={onRangeChange}
            onClear={onRangeClear}
            open={filterOpen}
            onToggle={setFilterOpen}
          />
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
              ref={plotRef}
              className={`metric-graph-plot ${isDragging ? 'is-dragging' : ''}`}
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
        <span>Scroll to zoom and drag the plot to pan.</span>
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

  const bounds = useMemo(() => {
    if (!playerData.length) return null;

    const xValues = playerData.map((player) => Number(player[selectedGraph.xKey])).filter(Number.isFinite);
    const yValues = playerData.map((player) => Number(player[selectedGraph.yKey])).filter(Number.isFinite);
    if (!xValues.length || !yValues.length) return null;

    return {
      x: normalizeBounds(Math.min(...xValues), Math.max(...xValues)),
      y: normalizeBounds(Math.min(...yValues), Math.max(...yValues)),
    };
  }, [playerData, selectedGraph.xKey, selectedGraph.yKey]);

  const selectedRange = useMemo(() => {
    if (!bounds) {
      return null;
    }

    const stored = rangeFilters[selectedGraph.key];
    return {
      x: stored?.x ? stored.x : createDefaultRange(bounds.x),
      y: stored?.y ? stored.y : createDefaultRange(bounds.y),
    };
  }, [bounds, rangeFilters, selectedGraph.key]);

  const filteredPlayerData = useMemo(() => {
    if (!selectedRange) return [];

    return playerData.filter((player) => {
      const xValue = Number(player[selectedGraph.xKey]);
      const yValue = Number(player[selectedGraph.yKey]);
      return (
        xValue >= selectedRange.x.min &&
        xValue <= selectedRange.x.max &&
        yValue >= selectedRange.y.min &&
        yValue <= selectedRange.y.max
      );
    });
  }, [playerData, selectedGraph.xKey, selectedGraph.yKey, selectedRange]);

  const summary = useMemo(() => {
    if (!filteredPlayerData.length) return null;

    return {
      players: filteredPlayerData.length,
      avgWar: average(filteredPlayerData.map((player) => player.war)),
      avgConsistency: average(filteredPlayerData.map((player) => player.consistencyScore)),
      avgImprovement: average(filteredPlayerData.map((player) => player.improvementScore)),
    };
  }, [filteredPlayerData]);

  const updateRange = (axis, edge, value) => {
    if (!bounds || !selectedRange) return;

    const axisBounds = bounds[axis];
    const currentAxis = selectedRange[axis];
    const nextAxis = {
      ...currentAxis,
      [edge]: clamp(value, axisBounds.min, axisBounds.max),
    };

    if (edge === 'min' && nextAxis.min > nextAxis.max) {
      nextAxis.max = nextAxis.min;
    }

    if (edge === 'max' && nextAxis.max < nextAxis.min) {
      nextAxis.min = nextAxis.max;
    }

    setRangeFilters((current) => ({
      ...current,
      [selectedGraph.key]: {
        x: axis === 'x' ? nextAxis : (current[selectedGraph.key]?.x || selectedRange.x),
        y: axis === 'y' ? nextAxis : (current[selectedGraph.key]?.y || selectedRange.y),
      },
    }));
  };

  const clearRange = () => {
    if (!bounds) return;

    setRangeFilters((current) => ({
      ...current,
      [selectedGraph.key]: {
        x: createDefaultRange(bounds.x),
        y: createDefaultRange(bounds.y),
      },
    }));
  };

  const hasCustomFilter = Boolean(
    bounds &&
    selectedRange &&
    (
      selectedRange.x.min !== bounds.x.min ||
      selectedRange.x.max !== bounds.x.max ||
      selectedRange.y.min !== bounds.y.min ||
      selectedRange.y.max !== bounds.y.max
    )
  );

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

  if (!summary || !selectedRange || !bounds) {
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
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-label">Filtered Player-Seasons</div>
          <div className="stat-card-value">{summary.players.toLocaleString()}</div>
          <div className="stat-card-sub">Each dot represents one player-season in the active filter window</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Average WAR</div>
          <div className="stat-card-value">{formatNumber(summary.avgWar, 3)}</div>
          <div className="stat-card-sub">Computed from the filtered graph population</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Average Consistency</div>
          <div className="stat-card-value">{formatNumber(summary.avgConsistency, 1)}</div>
          <div className="stat-card-sub">Computed from the filtered graph population</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Average Improvement</div>
          <div className="stat-card-value">{formatNumber(summary.avgImprovement, 1)}</div>
          <div className="stat-card-sub">Computed from the filtered graph population</div>
        </div>
      </div>

      <div className="metric-graph-grid">
        <ScatterMetricCard
          key={selectedGraph.key}
          data={filteredPlayerData}
          config={selectedGraph}
          range={selectedRange}
          bounds={bounds}
          hasCustomFilter={hasCustomFilter}
          onRangeChange={updateRange}
          onRangeClear={clearRange}
        />
      </div>
    </div>
  );
}
