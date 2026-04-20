import { useEffect, useMemo, useState } from 'react'
import { getAdminFullCatalog, getStoreStats } from '../api/store'
import { useTopbarActions } from '../layout/TopbarActionsContext'
import { DataTable, type DataTableColumn } from '../components/DataTable'
import { EmptyState } from '../components/EmptyState'
import { SkeletonTable } from '../components/Skeleton'
import { KpiStatCard } from '../components/KpiStatCard'
import { PageHeader } from '../components/PageHeader'
import { SectionPanel } from '../components/SectionPanel'
import type { CosmeticDefinition, StoreStatsItem, StoreStatsResponse } from '../types/store'

export function StoreStatsPage() {
  const [stats, setStats] = useState<StoreStatsResponse | null>(null)
  const [catalog, setCatalog] = useState<CosmeticDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const nameById = useMemo(() => new Map(catalog.map((item) => [item.id, item.name])), [catalog])
  const rows = useMemo(
    () => [...(stats?.items ?? [])].sort((left, right) => right.purchaseCount - left.purchaseCount),
    [stats?.items],
  )

  const columns: DataTableColumn<StoreStatsItem>[] = [
    {
      key: 'item',
      header: 'Cosmetic',
      render: (item) => (
        <div className="stack stack--compact">
          <strong>{nameById.get(item.cosmeticId) ?? item.cosmeticId}</strong>
          <span className="muted mono">{item.cosmeticId}</span>
        </div>
      ),
    },
    {
      key: 'purchases',
      header: 'Purchases',
      align: 'right',
      render: (item) => item.purchaseCount,
    },
    {
      key: 'soft',
      header: 'Coins spent',
      align: 'right',
      render: (item) => item.softCurrencySpent,
    },
    {
      key: 'premium',
      header: 'Gems spent',
      align: 'right',
      render: (item) => item.premiumCurrencySpent,
    },
  ]

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setIsLoading(true)
    setError(null)
    try {
      const [statsResponse, catalogResponse] = await Promise.all([getStoreStats(), getAdminFullCatalog()])
      setStats(statsResponse)
      setCatalog(catalogResponse.items)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load store stats.')
    } finally {
      setIsLoading(false)
    }
  }

  useTopbarActions(
    <button className="button button--secondary" type="button" onClick={() => void load()}>
      Refresh
    </button>,
  )

  return (
    <>
      <PageHeader
        eyebrow="Store"
        title="Store Stats"
        description="Cosmetic purchase totals collected from store analytics events."
      />

      {error ? <div className="alert alert--error">{error}</div> : null}

      <div className="kpi-grid">
        <KpiStatCard label="Purchases" value={isLoading ? '...' : (stats?.totalPurchases ?? 0)} helper="All tracked cosmetic purchases." tone="accent" />
        <KpiStatCard label="Coins spent" value={isLoading ? '...' : (stats?.totalSoftCurrencySpent ?? 0)} helper="Soft currency sinks." tone="success" />
        <KpiStatCard label="Gems spent" value={isLoading ? '...' : (stats?.totalPremiumCurrencySpent ?? 0)} helper="Premium currency sinks." tone="warning" />
      </div>

      <SectionPanel title="Purchases by cosmetic" subtitle={isLoading ? 'Loading stats.' : `${rows.length} cosmetics with purchases.`}>
        {isLoading ? <SkeletonTable columns={4} rows={5} /> : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(item) => item.cosmeticId}
            emptyState={<EmptyState title="No purchases yet" description="Store purchase rows appear after cosmetic_purchase analytics events are written." />}
          />
        )}
      </SectionPanel>
    </>
  )
}
