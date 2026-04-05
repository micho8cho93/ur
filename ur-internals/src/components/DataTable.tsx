import type { ReactNode } from 'react'

export interface DataTableColumn<Row> {
  key: string
  header: ReactNode
  render: (row: Row) => ReactNode
  align?: 'left' | 'right'
}

interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[]
  rows: Row[]
  rowKey: (row: Row) => string
  emptyState?: ReactNode
  className?: string
  rowClassName?: (row: Row) => string | null | undefined
}

export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  emptyState,
  className,
  rowClassName,
}: DataTableProps<Row>) {
  if (rows.length === 0) {
    return <>{emptyState ?? null}</>
  }

  return (
    <div className={['table-wrap', 'table-wrap--edge', className].filter(Boolean).join(' ')}>
      <table className="table data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={column.align === 'right' ? 'data-table__cell data-table__cell--right' : 'data-table__cell'}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className={rowClassName?.(row) ?? undefined}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={column.align === 'right' ? 'data-table__cell data-table__cell--right' : 'data-table__cell'}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
