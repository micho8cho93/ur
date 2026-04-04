interface ChartSeries {
  key: string
  label: string
  color: string
  values: Array<number | null>
}

interface AnalyticsLineChartProps {
  labels: string[]
  series: ChartSeries[]
  valueFormatter?: (value: number | null) => string
}

interface AnalyticsBarChartProps {
  labels: string[]
  series: Array<ChartSeries & { values: number[] }>
  valueFormatter?: (value: number) => string
}

interface AnalyticsFunnelStep {
  key: string
  label: string
  value: number
  tone?: 'default' | 'success' | 'warning' | 'danger'
}

interface AnalyticsFunnelChartProps {
  steps: AnalyticsFunnelStep[]
}

interface AnalyticsRankedSegmentsProps {
  segments: Array<{
    key: string
    label: string
    count: number
    winRate: number | null
    wins: number | null
    losses: number | null
  }>
}

const SVG_WIDTH = 640
const SVG_HEIGHT = 220
const PADDING_X = 28
const PADDING_Y = 20

function getPointX(index: number, total: number) {
  if (total <= 1) {
    return SVG_WIDTH / 2
  }

  const usableWidth = SVG_WIDTH - PADDING_X * 2
  return PADDING_X + (usableWidth * index) / (total - 1)
}

function getPointY(value: number, maxValue: number) {
  const usableHeight = SVG_HEIGHT - PADDING_Y * 2
  const safeMax = Math.max(1, maxValue)
  return SVG_HEIGHT - PADDING_Y - (value / safeMax) * usableHeight
}

function buildSeriesPath(values: Array<number | null>, maxValue: number) {
  let path = ''

  values.forEach((value, index) => {
    if (value === null) {
      return
    }

    const x = getPointX(index, values.length)
    const y = getPointY(value, maxValue)
    path += path.length === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`
  })

  return path
}

function buildAreaPath(values: Array<number | null>, maxValue: number) {
  const numericIndexes = values
    .map((value, index) => ({ value, index }))
    .filter((entry): entry is { value: number; index: number } => entry.value !== null)

  if (numericIndexes.length === 0) {
    return ''
  }

  const first = numericIndexes[0]
  const last = numericIndexes[numericIndexes.length - 1]
  let path = `M ${getPointX(first.index, values.length)} ${SVG_HEIGHT - PADDING_Y}`

  numericIndexes.forEach((entry) => {
    path += ` L ${getPointX(entry.index, values.length)} ${getPointY(entry.value, maxValue)}`
  })

  path += ` L ${getPointX(last.index, values.length)} ${SVG_HEIGHT - PADDING_Y} Z`
  return path
}

export function AnalyticsLineChart({
  labels,
  series,
  valueFormatter = (value) => (value === null ? 'Unavailable' : String(value)),
}: AnalyticsLineChartProps) {
  const maxValue = Math.max(
    1,
    ...series.flatMap((entry) =>
      entry.values.filter((value): value is number => typeof value === 'number' && value >= 0),
    ),
  )

  return (
    <div className="analytics-chart">
      <svg
        className="analytics-line-chart"
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        role="img"
        aria-label="Analytics trend chart"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const value = Math.round(maxValue * ratio)
          const y = getPointY(value, maxValue)

          return (
            <g key={ratio}>
              <line
                x1={PADDING_X}
                y1={y}
                x2={SVG_WIDTH - PADDING_X}
                y2={y}
                className="analytics-line-chart__grid"
              />
              <text x={0} y={y + 4} className="analytics-line-chart__axis">
                {valueFormatter(value)}
              </text>
            </g>
          )
        })}

        {series[0] ? (
          <path
            d={buildAreaPath(series[0].values, maxValue)}
            fill={`${series[0].color}22`}
            stroke="none"
          />
        ) : null}

        {series.map((entry) => (
          <path
            key={entry.key}
            d={buildSeriesPath(entry.values, maxValue)}
            fill="none"
            stroke={entry.color}
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {series.map((entry) =>
          entry.values.map((value, index) => {
            if (value === null) {
              return null
            }

            return (
              <circle
                key={`${entry.key}-${labels[index] ?? index}`}
                cx={getPointX(index, entry.values.length)}
                cy={getPointY(value, maxValue)}
                r="4"
                fill={entry.color}
              />
            )
          }),
        )}
      </svg>

      <div className="analytics-chart__labels">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="analytics-chart__legend">
        {series.map((entry) => (
          <span key={entry.key}>
            <i style={{ backgroundColor: entry.color }} aria-hidden="true" />
            {entry.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function AnalyticsBarChart({
  labels,
  series,
  valueFormatter = (value) => String(value),
}: AnalyticsBarChartProps) {
  const maxValue = Math.max(1, ...series.flatMap((entry) => entry.values))

  return (
    <div className="analytics-bar-chart" role="img" aria-label="Analytics bar chart">
      <div className="analytics-chart__legend">
        {series.map((entry) => (
          <span key={entry.key}>
            <i style={{ backgroundColor: entry.color }} aria-hidden="true" />
            {entry.label}
          </span>
        ))}
      </div>

      <div className="analytics-bar-chart__grid">
        {labels.map((label, index) => (
          <div key={label} className="analytics-bar-chart__group">
            <div className="analytics-bar-chart__bars">
              {series.map((entry) => {
                const value = entry.values[index] ?? 0
                return (
                  <div key={entry.key} className="analytics-bar-chart__bar-wrap" title={`${entry.label}: ${valueFormatter(value)}`}>
                    <span className="analytics-bar-chart__value">{valueFormatter(value)}</span>
                    <span className="analytics-bar-chart__rail">
                      <span
                        className="analytics-bar-chart__bar"
                        style={{
                          backgroundColor: entry.color,
                          height: `${Math.max(10, (value / maxValue) * 100)}%`,
                        }}
                      />
                    </span>
                  </div>
                )
              })}
            </div>
            <span className="analytics-bar-chart__label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AnalyticsFunnelChart({ steps }: AnalyticsFunnelChartProps) {
  const maxValue = Math.max(1, ...steps.map((step) => step.value))

  return (
    <div className="analytics-funnel">
      {steps.map((step) => (
        <div key={step.key} className="analytics-funnel__row">
          <div className="analytics-funnel__copy">
            <strong>{step.label}</strong>
            <span>{step.value}</span>
          </div>
          <span className="analytics-funnel__rail">
            <span
              className={
                step.tone && step.tone !== 'default'
                  ? `analytics-funnel__fill analytics-funnel__fill--${step.tone}`
                  : 'analytics-funnel__fill'
              }
              style={{ width: `${Math.max(8, (step.value / maxValue) * 100)}%` }}
            />
          </span>
        </div>
      ))}
    </div>
  )
}

export function AnalyticsRankedSegments({ segments }: AnalyticsRankedSegmentsProps) {
  const maxCount = Math.max(1, ...segments.map((segment) => segment.count))

  return (
    <div className="analytics-segment-list">
      {segments.map((segment) => (
        <div key={segment.key} className="analytics-segment-list__row">
          <div className="analytics-segment-list__copy">
            <strong>{segment.label}</strong>
            <span>
              {segment.winRate === null
                ? `${segment.count} matches`
                : `${segment.winRate.toFixed(1)}% win rate · ${segment.wins ?? 0}-${segment.losses ?? 0}`}
            </span>
          </div>
          <span className="analytics-segment-list__rail">
            <span
              className="analytics-segment-list__fill"
              style={{ width: `${Math.max(8, (segment.count / maxCount) * 100)}%` }}
            />
          </span>
          <span className="analytics-segment-list__value">{segment.count}</span>
        </div>
      ))}
    </div>
  )
}
