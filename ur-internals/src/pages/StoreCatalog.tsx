import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  disableCosmetic,
  enableCosmetic,
  getAdminFullCatalog,
  upsertCosmetic,
} from '../api/store'
import { ActionToolbar } from '../components/ActionToolbar'
import { DataTable, type DataTableColumn } from '../components/DataTable'
import { EmptyState } from '../components/EmptyState'
import { FilterBar } from '../components/FilterBar'
import { PageHeader } from '../components/PageHeader'
import { SectionPanel } from '../components/SectionPanel'
import type { CosmeticDefinition, CosmeticTier, CosmeticType, CurrencyType, RotationPool } from '../types/store'

const cosmeticTypes: CosmeticType[] = ['board', 'pieces', 'dice_animation', 'emote', 'music', 'sound_effect']
const cosmeticTiers: CosmeticTier[] = ['common', 'rare', 'epic', 'legendary']
const currencies: CurrencyType[] = ['soft', 'premium']
const rotationPools: RotationPool[] = ['daily', 'featured', 'limited']

type CatalogForm = {
  id: string
  name: string
  tier: CosmeticTier
  type: CosmeticType
  currency: CurrencyType
  amount: string
  rotationPools: RotationPool[]
  rarityWeight: string
  releasedDate: string
  assetKey: string
  disabled: boolean
}

const emptyForm: CatalogForm = {
  id: '',
  name: '',
  tier: 'common',
  type: 'board',
  currency: 'soft',
  amount: '100',
  rotationPools: ['daily'],
  rarityWeight: '0.5',
  releasedDate: new Date().toISOString(),
  assetKey: '',
  disabled: false,
}

function formFromCosmetic(item: CosmeticDefinition): CatalogForm {
  return {
    id: item.id,
    name: item.name,
    tier: item.tier,
    type: item.type,
    currency: item.price.currency,
    amount: String(item.price.amount),
    rotationPools: item.rotationPools,
    rarityWeight: String(item.rarityWeight),
    releasedDate: item.releasedDate,
    assetKey: item.assetKey,
    disabled: item.disabled === true,
  }
}

function buildCosmeticPatch(form: CatalogForm): CosmeticDefinition {
  return {
    id: form.id.trim(),
    name: form.name.trim(),
    tier: form.tier,
    type: form.type,
    price: {
      currency: form.currency,
      amount: Number(form.amount),
    },
    rotationPools: form.rotationPools,
    rarityWeight: Number(form.rarityWeight),
    releasedDate: form.releasedDate.trim(),
    assetKey: form.assetKey.trim() || form.id.trim(),
    disabled: form.disabled,
  }
}

export function StoreCatalogPage() {
  const [catalog, setCatalog] = useState<CosmeticDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDisabled, setShowDisabled] = useState(false)
  const [typeFilter, setTypeFilter] = useState<'all' | CosmeticType>('all')
  const [form, setForm] = useState<CatalogForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  const visibleCatalog = useMemo(
    () =>
      catalog.filter((item) => {
        if (!showDisabled && item.disabled) {
          return false
        }
        return typeFilter === 'all' || item.type === typeFilter
      }),
    [catalog, showDisabled, typeFilter],
  )

  const columns: DataTableColumn<CosmeticDefinition>[] = [
    {
      key: 'item',
      header: 'Item',
      render: (item) => (
        <div className="stack stack--compact">
          <strong>{item.name}</strong>
          <span className="muted mono">{item.id}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (item) => item.type.replace('_', ' '),
    },
    {
      key: 'tier',
      header: 'Tier',
      render: (item) => item.tier,
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      render: (item) => `${item.price.amount} ${item.price.currency}`,
    },
    {
      key: 'state',
      header: 'State',
      render: (item) => (item.disabled ? 'Disabled' : 'Active'),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="table__actions">
          <button className="button button--secondary" type="button" onClick={() => setForm(formFromCosmetic(item))}>
            Edit
          </button>
          <button
            className={item.disabled ? 'button button--primary' : 'button button--danger'}
            type="button"
            onClick={() => {
              void handleToggle(item)
            }}
          >
            {item.disabled ? 'Enable' : 'Disable'}
          </button>
        </div>
      ),
    },
  ]

  useEffect(() => {
    void loadCatalog()
  }, [])

  async function loadCatalog() {
    setIsLoading(true)
    setError(null)
    try {
      const response = await getAdminFullCatalog()
      setCatalog(response.items)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load catalog.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleToggle(item: CosmeticDefinition) {
    setError(null)
    try {
      const response = item.disabled ? await enableCosmetic(item.id) : await disableCosmetic(item.id)
      setCatalog((current) => current.map((entry) => (entry.id === response.item.id ? response.item : entry)))
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Unable to update item.')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await upsertCosmetic(buildCosmeticPatch(form))
      setCatalog((current) => {
        const exists = current.some((item) => item.id === response.item.id)
        return exists
          ? current.map((item) => (item.id === response.item.id ? response.item : item))
          : [...current, response.item]
      })
      setForm(emptyForm)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save catalog item.')
    } finally {
      setSaving(false)
    }
  }

  function updateForm(patch: Partial<CatalogForm>) {
    setForm((current) => ({ ...current, ...patch }))
  }

  return (
    <>
      <PageHeader
        eyebrow="Store"
        title="Catalog"
        description="Create, edit, disable, and inspect cosmetic items stored in Nakama."
        actions={
          <ActionToolbar>
            <button className="button button--secondary" type="button" onClick={() => void loadCatalog()}>
              Refresh
            </button>
          </ActionToolbar>
        }
      />

      {error ? <div className="alert alert--error">{error}</div> : null}

      <FilterBar>
        <label className="field">
          <span className="field__label">Type</span>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as 'all' | CosmeticType)}>
            <option value="all">All types</option>
            {cosmeticTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Visibility</span>
          <select value={showDisabled ? 'all' : 'active'} onChange={(event) => setShowDisabled(event.target.value === 'all')}>
            <option value="active">Hide disabled</option>
            <option value="all">Show disabled</option>
          </select>
        </label>
      </FilterBar>

      <SectionPanel title="Add or edit item" subtitle="Changes write through the admin catalog RPC.">
        <form className="form" onSubmit={(event) => void handleSubmit(event)}>
          <div className="form-grid">
            <label className="field">
              <span className="field__label">ID</span>
              <input value={form.id} required onChange={(event) => updateForm({ id: event.target.value })} />
            </label>
            <label className="field">
              <span className="field__label">Name</span>
              <input value={form.name} required onChange={(event) => updateForm({ name: event.target.value })} />
            </label>
            <label className="field">
              <span className="field__label">Type</span>
              <select value={form.type} onChange={(event) => updateForm({ type: event.target.value as CosmeticType })}>
                {cosmeticTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">Tier</span>
              <select value={form.tier} onChange={(event) => updateForm({ tier: event.target.value as CosmeticTier })}>
                {cosmeticTiers.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">Currency</span>
              <select value={form.currency} onChange={(event) => updateForm({ currency: event.target.value as CurrencyType })}>
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">Amount</span>
              <input type="number" min="0" value={form.amount} onChange={(event) => updateForm({ amount: event.target.value })} />
            </label>
            <label className="field">
              <span className="field__label">Rarity weight</span>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={form.rarityWeight}
                onChange={(event) => updateForm({ rarityWeight: event.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">Asset key</span>
              <input value={form.assetKey} onChange={(event) => updateForm({ assetKey: event.target.value })} />
            </label>
            <label className="field">
              <span className="field__label">Released date</span>
              <input value={form.releasedDate} onChange={(event) => updateForm({ releasedDate: event.target.value })} />
            </label>
            <label className="field">
              <span className="field__label">Rotation pools</span>
              <select
                multiple
                value={form.rotationPools}
                onChange={(event) =>
                  updateForm({
                    rotationPools: Array.from(event.target.selectedOptions).map((option) => option.value as RotationPool),
                  })
                }
              >
                {rotationPools.map((pool) => (
                  <option key={pool} value={pool}>
                    {pool}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">State</span>
              <select value={form.disabled ? 'disabled' : 'active'} onChange={(event) => updateForm({ disabled: event.target.value === 'disabled' })}>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>
          </div>
          <ActionToolbar>
            <button className="button button--primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save item'}
            </button>
            <button className="button button--secondary" type="button" onClick={() => setForm(emptyForm)}>
              Clear
            </button>
          </ActionToolbar>
        </form>
      </SectionPanel>

      <SectionPanel title="Catalog items" subtitle={isLoading ? 'Loading catalog.' : `${visibleCatalog.length} visible items.`}>
        <DataTable
          columns={columns}
          rows={visibleCatalog}
          rowKey={(item) => item.id}
          emptyState={<EmptyState title="No catalog items" description="Adjust the filters or add a new cosmetic." />}
        />
      </SectionPanel>
    </>
  )
}
