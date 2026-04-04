import type {
  AnalyticsAvailability,
  AnalyticsMetric,
  AnalyticsQueryFilters,
  AnalyticsTableRow,
} from '../types/analytics'

const DAY_MS = 24 * 60 * 60 * 1000

export type MetricFormat = 'count' | 'percent' | 'duration' | 'elo' | 'raw'
export type SortDirection = 'asc' | 'desc'

export function createDefaultAnalyticsFilters(now = new Date()): AnalyticsQueryFilters {
  const endDate = formatDateInputValue(now)
  const startDate = formatDateInputValue(new Date(now.getTime() - 29 * DAY_MS))

  return {
    startDate,
    endDate,
    tournamentId: null,
    gameMode: null,
    eloMin: null,
    eloMax: null,
    limit: 12,
  }
}

export function formatDateInputValue(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

export function formatDateLabel(value: string, includeYear = false) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {}),
  }).format(new Date(value))
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return 'Unavailable'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatTimeAgo(value: string | null) {
  if (!value) {
    return 'No recent signal'
  }

  const deltaMs = Date.now() - new Date(value).getTime()
  const deltaMinutes = Math.max(0, Math.round(deltaMs / 60000))

  if (deltaMinutes < 1) {
    return 'Just now'
  }

  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`
  }

  const deltaHours = Math.round(deltaMinutes / 60)
  if (deltaHours < 24) {
    return `${deltaHours}h ago`
  }

  const deltaDays = Math.round(deltaHours / 24)
  return `${deltaDays}d ago`
}

export function formatNumber(value: number | null, maximumFractionDigits = 0) {
  if (value === null || Number.isNaN(value)) {
    return 'Unavailable'
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
  }).format(value)
}

export function formatPercent(value: number | null, maximumFractionDigits = 0) {
  if (value === null || Number.isNaN(value)) {
    return 'Unavailable'
  }

  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
  }).format(value)}%`
}

export function formatDurationSeconds(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return 'Unavailable'
  }

  if (value < 60) {
    return `${Math.round(value)}s`
  }

  const minutes = Math.floor(value / 60)
  const seconds = Math.round(value % 60)

  if (minutes < 60) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

export function formatMetricValue(metric: AnalyticsMetric, format: MetricFormat) {
  switch (format) {
    case 'percent':
      return formatPercent(metric.value, 1)
    case 'duration':
      return formatDurationSeconds(metric.value)
    case 'elo':
      return formatNumber(metric.value, 0)
    case 'raw':
      return metric.value === null ? 'Unavailable' : String(metric.value)
    case 'count':
    default:
      return formatNumber(metric.value, 0)
  }
}

export function formatMetricChange(metric: AnalyticsMetric, format: MetricFormat) {
  if (metric.value === null || metric.previousValue === null) {
    return 'Previous period comparison unavailable'
  }

  const delta = metric.value - metric.previousValue
  if (delta === 0) {
    return 'Flat versus previous equivalent period'
  }

  const direction = delta > 0 ? 'up' : 'down'
  const absoluteDelta = Math.abs(delta)
  const valueLabel =
    format === 'percent'
      ? formatPercent(absoluteDelta, 1)
      : format === 'duration'
        ? formatDurationSeconds(absoluteDelta)
        : formatNumber(absoluteDelta, 0)

  return `${direction} ${valueLabel} versus previous equivalent period`
}

export function formatRatioLabel(metric: AnalyticsMetric, numeratorLabel: string, denominatorLabel: string) {
  if (metric.numerator === null || metric.denominator === null) {
    return `${numeratorLabel} and ${denominatorLabel} counts unavailable`
  }

  return `${formatNumber(metric.numerator)}/${formatNumber(metric.denominator)} ${numeratorLabel.toLowerCase()}`
}

export function getAvailabilityTone(status: AnalyticsAvailability['status']) {
  switch (status) {
    case 'available':
      return 'success'
    case 'partial':
      return 'accent'
    case 'tracking_missing':
      return 'warning'
    case 'not_enough_data':
    case 'no_data':
    default:
      return 'default'
  }
}

export function getAvailabilityLabel(status: AnalyticsAvailability['status']) {
  switch (status) {
    case 'available':
      return 'Live'
    case 'partial':
      return 'Partial'
    case 'tracking_missing':
      return 'Tracking missing'
    case 'not_enough_data':
      return 'Not enough data'
    case 'no_data':
    default:
      return 'No data'
  }
}

export function canRenderAvailability(availability: AnalyticsAvailability) {
  return availability.hasData && (availability.status === 'available' || availability.status === 'partial')
}

export function summarizeAvailabilityNotes(availability: AnalyticsAvailability) {
  if (availability.notes.length === 0) {
    return null
  }

  return availability.notes[0] ?? null
}

export function getMetricTone(metric: AnalyticsMetric) {
  switch (metric.availability.status) {
    case 'available':
      return 'accent'
    case 'partial':
      return 'warning'
    default:
      return 'default'
  }
}

function compareValues(left: number | string | null, right: number | string | null) {
  if (left === null && right === null) {
    return 0
  }

  if (left === null) {
    return 1
  }

  if (right === null) {
    return -1
  }

  if (typeof left === 'number' && typeof right === 'number') {
    return left - right
  }

  return String(left).localeCompare(String(right))
}

export function sortAnalyticsRows(
  rows: AnalyticsTableRow[],
  accessor: (row: AnalyticsTableRow) => number | string | null,
  direction: SortDirection,
) {
  const multiplier = direction === 'asc' ? 1 : -1

  return [...rows].sort((left, right) => multiplier * compareValues(accessor(left), accessor(right)))
}

export function trimGameModeLabel(value: string | null) {
  if (!value) {
    return 'All modes'
  }

  return value
    .replace(/^gameMode_/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
