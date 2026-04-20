interface SkeletonProps {
  width?: string
  height?: string
  className?: string
  rounded?: boolean
}

export function Skeleton({ width, height, className, rounded = false }: SkeletonProps) {
  return (
    <span
      className={['skeleton', rounded ? 'skeleton--rounded' : null, className].filter(Boolean).join(' ')}
      aria-hidden="true"
      style={{ width, height }}
    />
  )
}

interface SkeletonRowProps {
  columns: number
  height?: string
}

export function SkeletonRow({ columns, height = '18px' }: SkeletonRowProps) {
  return (
    <tr className="skeleton-row" aria-hidden="true">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="data-table__cell">
          <Skeleton height={height} width={i === columns - 1 ? '60%' : '80%'} />
        </td>
      ))}
    </tr>
  )
}

interface SkeletonTableProps {
  columns: number
  rows?: number
}

export function SkeletonTable({ columns, rows = 5 }: SkeletonTableProps) {
  return (
    <div className="table-wrap table-wrap--edge">
      <table className="table data-table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="data-table__cell">
                <Skeleton height="12px" width="70%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface SkeletonCardProps {
  height?: string
  className?: string
}

export function SkeletonCard({ height = '108px', className }: SkeletonCardProps) {
  return (
    <div
      className={['skeleton-card', className].filter(Boolean).join(' ')}
      aria-hidden="true"
      style={{ minHeight: height }}
    >
      <Skeleton height="10px" width="40%" />
      <Skeleton height="32px" width="55%" />
      <Skeleton height="12px" width="70%" />
    </div>
  )
}
