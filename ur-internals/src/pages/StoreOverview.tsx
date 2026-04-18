import { useEffect, useMemo, useState } from 'react'
import { getAdminFullCatalog, getStoreStats } from '../api/store'
import { ActionToolbar } from '../components/ActionToolbar'
import { DataTable, type DataTableColumn } from '../components/DataTable'
import { EmptyState } from '../components/EmptyState'
import { MetaStrip, MetaStripItem } from '../components/MetaStrip'
import { PageHeader } from '../components/PageHeader'
import { SectionPanel } from '../components/SectionPanel'
import { appRoutes } from '../routes'
import type { CosmeticDefinition, StoreStatsResponse } from '../types/store'
import { Link } from 'react-router-dom'

type PricingLayer = {
  layer: string
  currency: string
  scope: string
  notes: string
}

const pricingLayers: PricingLayer[] = [
  {
    layer: 'Coins',
    currency: 'Soft currency',
    scope: 'Common cosmetics, daily rotation, and small tournament fees.',
    notes: 'The default wallet sink for everyday spend.',
  },
  {
    layer: 'Gems',
    currency: 'Premium currency',
    scope: 'Rare cosmetics, featured drops, and premium tournament fees.',
    notes: 'Reserved for higher-value items and premium participation.',
  },
  {
    layer: 'Tournament fees',
    currency: 'Coins or gems',
    scope: 'Entry charge stored on the tournament run and deducted on join.',
    notes: 'Configure the fee in internals when creating the run.',
  },
  {
    layer: 'Match fees',
    currency: 'Reserved',
    scope: 'No active match-level charge in the live backend.',
    notes: 'Keep this lane open for future match-priced modes.',
  },
]

function sumPrices(items: CosmeticDefinition[], currency: 'soft' | 'premium'): number {
  return items.reduce((total, item) => (item.price.currency === currency ? total + item.price.amount : total), 0)
}

export function StoreOverviewPage() {
  const [catalog, setCatalog] = useState<CosmeticDefinition[]>([])
  const [stats, setStats] = useState<StoreStatsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const [catalogResponse, statsResponse] = await Promise.all([getAdminFullCatalog(), getStoreStats()])

        if (!active) {
          return
        }

        setCatalog(catalogResponse.items)
        setStats(statsResponse)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : 'Unable to load store overview.')
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const softPricedItems = useMemo(() => catalog.filter((item) => item.price.currency === 'soft').length, [catalog])
  const premiumPricedItems = useMemo(
    () => catalog.filter((item) => item.price.currency === 'premium').length,
    [catalog],
  )
  const softPriceTotal = useMemo(() => sumPrices(catalog, 'soft'), [catalog])
  const premiumPriceTotal = useMemo(() => sumPrices(catalog, 'premium'), [catalog])

  const pricingColumns: DataTableColumn<PricingLayer>[] = [
    {
      key: 'layer',
      header: 'Layer',
      render: (item) => (
        <div className="stack stack--compact">
          <strong>{item.layer}</strong>
          <span className="muted">{item.currency}</span>
        </div>
      ),
    },
    {
      key: 'scope',
      header: 'What it covers',
      render: (item) => item.scope,
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (item) => item.notes,
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Store"
        title="Pricing overview"
        description="A compact map of how coins, gems, tournament entry fees, and future match fees fit together."
        actions={
          <ActionToolbar>
            <Link className="button button--secondary" to={appRoutes.store.catalog}>
              Open catalog
            </Link>
          </ActionToolbar>
        }
      />

      {error ? <div className="alert alert--error">{error}</div> : null}

      <MetaStrip>
        <MetaStripItem
          label="Coin-priced items"
          value={isLoading ? '...' : softPricedItems}
          hint={isLoading ? 'Loading catalog.' : `${softPriceTotal} coins across the catalog.`}
          tone="accent"
        />
        <MetaStripItem
          label="Gem-priced items"
          value={isLoading ? '...' : premiumPricedItems}
          hint={isLoading ? 'Loading catalog.' : `${premiumPriceTotal} gems across the catalog.`}
          tone="warning"
        />
        <MetaStripItem
          label="Coins spent"
          value={isLoading ? '...' : (stats?.totalSoftCurrencySpent ?? 0)}
          hint="Observed soft-currency sink from store purchases."
          tone="success"
        />
        <MetaStripItem
          label="Gems spent"
          value={isLoading ? '...' : (stats?.totalPremiumCurrencySpent ?? 0)}
          hint="Observed premium-currency sink from store purchases."
        />
      </MetaStrip>

      <SectionPanel
        title="Pricing map"
        subtitle="The current layout across currency, catalog, and tournament participation."
      >
        <DataTable
          columns={pricingColumns}
          rows={pricingLayers}
          rowKey={(item) => item.layer}
          emptyState={<EmptyState title="No pricing layers" description="The pricing map is still being prepared." />}
        />
      </SectionPanel>

      <SectionPanel
        title="Economy notes"
        subtitle="Short version of how the economy should be read by operators."
      >
        <ul className="list list--dense">
          <li className="list__item">
            <strong>Coins</strong>
            <span className="muted">Soft currency for the main catalog and lower-friction tournament entry fees.</span>
          </li>
          <li className="list__item">
            <strong>Gems</strong>
            <span className="muted">Premium currency for rare catalog items and higher-value entry fees.</span>
          </li>
          <li className="list__item">
            <strong>Tournament fees</strong>
            <span className="muted">Stored on the run as the entry fee and charged automatically when the player joins.</span>
          </li>
          <li className="list__item">
            <strong>Match fees</strong>
            <span className="muted">Reserved for future priced match modes. No live deduction path is active yet.</span>
          </li>
        </ul>
      </SectionPanel>
    </>
  )
}
