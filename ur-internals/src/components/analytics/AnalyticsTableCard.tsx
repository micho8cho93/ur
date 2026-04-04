import { useState } from 'react'
import { canRenderAvailability, sortAnalyticsRows, type SortDirection } from '../../analytics/utils'
import type { AnalyticsAvailability, AnalyticsTableRow } from '../../types/analytics'
import { AnalyticsUnavailableState } from './AnalyticsUnavailableState'

export interface AnalyticsTableColumn {
  key: string
  label: string
  accessor: (row: AnalyticsTableRow) => number | string | null
  render?: (row: AnalyticsTableRow) => React.ReactNode
  sortable?: boolean
}

interface AnalyticsTableCardProps {
  title: string
  subtitle: string
  availability: AnalyticsAvailability
  columns: AnalyticsTableColumn[]
  rows: AnalyticsTableRow[]
  defaultSortKey: string
  defaultDirection?: SortDirection
}

function findColumn(columns: AnalyticsTableColumn[], key: string) {
  return columns.find((column) => column.key === key) ?? columns[0]
}

export function AnalyticsTableCard({
  title,
  subtitle,
  availability,
  columns,
  rows,
  defaultSortKey,
  defaultDirection = 'desc',
}: AnalyticsTableCardProps) {
  const [sortKey, setSortKey] = useState(defaultSortKey)
  const [direction, setDirection] = useState<SortDirection>(defaultDirection)
  const activeColumn = findColumn(columns, sortKey)
  const sortedRows = sortAnalyticsRows(rows, activeColumn.accessor, direction)

  return (
    <article className="analytics-card analytics-card--table">
      <header className="analytics-card__header">
        <div className="analytics-card__copy">
          <strong>{title}</strong>
          <p>{subtitle}</p>
        </div>
      </header>

      <div className="analytics-card__body">
        {canRenderAvailability(availability) ? (
          <div className="table-wrap table-wrap--edge">
            <table className="table analytics-table">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key}>
                      {column.sortable === false ? (
                        column.label
                      ) : (
                        <button
                          className="analytics-table__sort"
                          type="button"
                          onClick={() => {
                            if (sortKey === column.key) {
                              setDirection((current) => (current === 'desc' ? 'asc' : 'desc'))
                              return
                            }

                            setSortKey(column.key)
                            setDirection('desc')
                          }}
                        >
                          <span>{column.label}</span>
                          <span aria-hidden="true">
                            {sortKey === column.key ? (direction === 'desc' ? '↓' : '↑') : '↕'}
                          </span>
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
                  <tr key={row.id}>
                    {columns.map((column) => (
                      <td key={column.key}>{column.render ? column.render(row) : column.accessor(row) ?? '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AnalyticsUnavailableState availability={availability} />
        )}
      </div>
    </article>
  )
}
