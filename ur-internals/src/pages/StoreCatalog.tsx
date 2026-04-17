import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  deleteCosmetic,
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
import { useSession } from '../auth/useSession'
import type {
  CosmeticAssetMediaType,
  CosmeticDefinition,
  CosmeticTier,
  CosmeticType,
  CurrencyType,
  RotationPool,
  UploadedCosmeticAsset,
} from '../types/store'

const cosmeticTypes: CosmeticType[] = ['board', 'pieces', 'dice_animation', 'emote', 'music', 'sound_effect']
const cosmeticTiers: CosmeticTier[] = ['common', 'rare', 'epic', 'legendary']
const currencies: CurrencyType[] = ['soft', 'premium']
const rotationPools: RotationPool[] = ['daily', 'featured', 'limited']
const maxUploadBytes = 3 * 1024 * 1024

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
  uploadedAsset: UploadedCosmeticAsset | null
  uploadedAsset2: UploadedCosmeticAsset | null
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
  uploadedAsset: null,
  uploadedAsset2: null,
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
    uploadedAsset: item.uploadedAsset ?? null,
    uploadedAsset2: item.uploadedAsset2 ?? null,
    disabled: item.disabled === true,
  }
}

function buildCosmeticPatch(
  form: CatalogForm,
): Omit<CosmeticDefinition, 'uploadedAsset' | 'uploadedAsset2'> & {
  uploadedAsset: UploadedCosmeticAsset | null
  uploadedAsset2: UploadedCosmeticAsset | null
} {
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
    uploadedAsset: form.uploadedAsset,
    uploadedAsset2: form.type === 'dice_animation' ? form.uploadedAsset2 : null,
    disabled: form.disabled,
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileBaseName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toLowerCase()
}

function acceptForCosmeticType(type: CosmeticType): string {
  if (type === 'music' || type === 'sound_effect') {
    return 'audio/*'
  }

  if (type === 'dice_animation' || type === 'emote') {
    return 'image/*,video/*'
  }

  return 'image/*'
}

function inferMediaType(file: File, type: CosmeticType): CosmeticAssetMediaType {
  if (file.type.startsWith('audio/')) {
    return 'audio'
  }

  if (file.type.startsWith('video/')) {
    return 'video'
  }

  if (file.type === 'image/gif' || type === 'dice_animation' || type === 'emote') {
    return 'animation'
  }

  if (file.type.startsWith('image/')) {
    return 'image'
  }

  throw new Error('Unsupported asset file type.')
}

function validateFileForType(file: File, type: CosmeticType) {
  const isAudio = file.type.startsWith('audio/')
  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')

  if ((type === 'music' || type === 'sound_effect') && !isAudio) {
    throw new Error('Music and sound effect assets must be audio files.')
  }

  if ((type === 'board' || type === 'pieces') && !isImage) {
    throw new Error('Board and piece assets must be image files.')
  }

  if ((type === 'dice_animation' || type === 'emote') && !isImage && !isVideo) {
    throw new Error('Animation and emote assets must be images, GIFs, or short videos.')
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('Unable to read asset file.'))
    }
    reader.onerror = () => reject(new Error('Unable to read asset file.'))
    reader.readAsDataURL(file)
  })
}

async function uploadedAssetFromFile(file: File, type: CosmeticType): Promise<UploadedCosmeticAsset> {
  if (file.size > maxUploadBytes) {
    throw new Error(`Asset uploads must be ${formatBytes(maxUploadBytes)} or smaller.`)
  }

  validateFileForType(file, type)

  return {
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    mediaType: inferMediaType(file, type),
    dataUrl: await readFileAsDataUrl(file),
    uploadedAt: new Date().toISOString(),
  }
}

function AssetPreview({
  asset,
  item,
  onOpen,
}: {
  asset?: UploadedCosmeticAsset | null
  item: Pick<CosmeticDefinition, 'name' | 'assetKey'>
  onOpen?: () => void
}) {
  if (!asset) {
    return (
      <div className="asset-preview asset-preview--empty">
        <span className="muted">Bundled asset</span>
        <span className="mono">{item.assetKey}</span>
      </div>
    )
  }

  const label = `${asset.fileName} (${formatBytes(asset.sizeBytes)})`

  if (asset.mediaType === 'audio') {
    return (
      <div className="asset-preview">
        <audio className="asset-preview__audio" controls preload="metadata" src={asset.dataUrl} />
        <span className="muted">{label}</span>
      </div>
    )
  }

  if (asset.mediaType === 'video') {
    return (
      <div className="asset-preview">
        <video className="asset-preview__video" controls muted loop preload="metadata" src={asset.dataUrl} />
        <span className="muted">{label}</span>
      </div>
    )
  }

  return (
    <button className="asset-preview asset-preview__button" type="button" onClick={onOpen}>
      <img className="asset-preview__image" src={asset.dataUrl} alt={item.name} />
      <span className="muted">{label}</span>
    </button>
  )
}

export function StoreCatalogPage() {
  const { adminIdentity } = useSession()
  const [catalog, setCatalog] = useState<CosmeticDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDisabled, setShowDisabled] = useState(false)
  const [typeFilter, setTypeFilter] = useState<'all' | CosmeticType>('all')
  const [form, setForm] = useState<CatalogForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [previewItem, setPreviewItem] = useState<CosmeticDefinition | null>(null)
  const canEditCatalog = adminIdentity?.role === 'operator' || adminIdentity?.role === 'admin'

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
      key: 'asset',
      header: 'Asset',
      render: (item) => (
        <AssetPreview
          asset={item.uploadedAsset}
          item={item}
          onOpen={() => {
            setPreviewItem(item)
          }}
        />
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
          <button
            className="button button--danger"
            type="button"
            disabled={deletingId === item.id}
            onClick={() => {
              void handleDelete(item)
            }}
          >
            {deletingId === item.id ? 'Deleting...' : 'Delete'}
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

  async function handleDelete(item: CosmeticDefinition) {
    if (typeof window !== 'undefined' && !window.confirm(`Delete "${item.name}" from the store catalog?`)) {
      return
    }

    setDeletingId(item.id)
    setError(null)
    try {
      await deleteCosmetic(item.id)
      setCatalog((current) => current.filter((entry) => entry.id !== item.id))
      if (form.id === item.id) {
        setForm(emptyForm)
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete catalog item.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canEditCatalog) {
      setError('Read-only access detected. This account can view the catalog but cannot modify it.')
      return
    }
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

  async function handleAssetUpload(file: File | undefined) {
    if (!file) {
      return
    }

    setError(null)
    try {
      const uploadedAsset = await uploadedAssetFromFile(file, form.type)
      const fallbackAssetKey = form.assetKey.trim() || `${form.id.trim() || fileBaseName(file.name)}_upload`
      updateForm({
        uploadedAsset,
        assetKey: fallbackAssetKey,
      })
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload asset.')
    }
  }

  async function handleAssetUpload2(file: File | undefined) {
    if (!file) {
      return
    }

    setError(null)
    try {
      const uploadedAsset2 = await uploadedAssetFromFile(file, form.type)
      updateForm({ uploadedAsset2 })
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload asset.')
    }
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
      {!canEditCatalog ? (
        <div className="alert alert--warning">
          Read-only access detected. Uploads and catalog edits require operator or admin permissions.
        </div>
      ) : null}

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
          <fieldset className="form-grid" disabled={!canEditCatalog}>
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
            <label className="field field--full">
              <span className="field__label">{form.type === 'dice_animation' ? 'Upload asset (frame 1)' : 'Upload asset'}</span>
              <input
                type="file"
                accept={acceptForCosmeticType(form.type)}
                onChange={(event) => {
                  void handleAssetUpload(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
              <span className="field__hint">
                Uploads are saved inline with the catalog item, so the practical limit is {formatBytes(maxUploadBytes)}.
              </span>
            </label>
            {form.uploadedAsset ? (
              <div className="field field--full">
                <span className="field__label">{form.type === 'dice_animation' ? 'Frame 1 preview' : 'Uploaded preview'}</span>
                <div className="asset-edit-preview">
                  <AssetPreview
                    asset={form.uploadedAsset}
                    item={{
                      name: form.name || form.uploadedAsset.fileName,
                      assetKey: form.assetKey || form.id || 'uploaded',
                    }}
                    onOpen={() => {
                      if (form.uploadedAsset) {
                        setPreviewItem({ ...buildCosmeticPatch(form), uploadedAsset: form.uploadedAsset, uploadedAsset2: form.uploadedAsset2 ?? undefined })
                      }
                    }}
                  />
                  <button className="button button--danger" type="button" onClick={() => updateForm({ uploadedAsset: null })}>
                    Remove uploaded asset
                  </button>
                </div>
              </div>
            ) : null}
            {form.type === 'dice_animation' ? (
              <>
                <label className="field field--full">
                  <span className="field__label">Upload asset (frame 2)</span>
                  <input
                    type="file"
                    accept={acceptForCosmeticType(form.type)}
                    onChange={(event) => {
                      void handleAssetUpload2(event.target.files?.[0])
                      event.target.value = ''
                    }}
                  />
                  <span className="field__hint">Second PNG for the dice animation — both frames required.</span>
                </label>
                {form.uploadedAsset2 ? (
                  <div className="field field--full">
                    <span className="field__label">Frame 2 preview</span>
                    <div className="asset-edit-preview">
                      <AssetPreview
                        asset={form.uploadedAsset2}
                        item={{
                          name: form.name || form.uploadedAsset2.fileName,
                          assetKey: form.assetKey || form.id || 'uploaded',
                        }}
                        onOpen={() => {
                          if (form.uploadedAsset2) {
                            setPreviewItem({ ...buildCosmeticPatch(form), uploadedAsset: form.uploadedAsset2, uploadedAsset2: undefined })
                          }
                        }}
                      />
                      <button className="button button--danger" type="button" onClick={() => updateForm({ uploadedAsset2: null })}>
                        Remove frame 2
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
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
          </fieldset>
          <ActionToolbar>
            <button className="button button--primary" type="submit" disabled={saving || !canEditCatalog}>
              {saving ? 'Saving...' : 'Save item'}
            </button>
            <button className="button button--secondary" type="button" onClick={() => setForm(emptyForm)} disabled={!canEditCatalog}>
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

      {previewItem?.uploadedAsset ? (
        <div className="asset-modal" role="presentation" onClick={() => setPreviewItem(null)}>
          <div className="asset-modal__panel" role="dialog" aria-modal="true" aria-label={`${previewItem.name} preview`} onClick={(event) => event.stopPropagation()}>
            <div className="asset-modal__header">
              <div className="stack stack--compact">
                <strong>{previewItem.name || previewItem.uploadedAsset.fileName}</strong>
                <span className="muted">
                  {previewItem.uploadedAsset.fileName} - {formatBytes(previewItem.uploadedAsset.sizeBytes)}
                </span>
              </div>
              <button className="button button--secondary" type="button" onClick={() => setPreviewItem(null)}>
                Close
              </button>
            </div>
            {previewItem.uploadedAsset.mediaType === 'video' ? (
              <video className="asset-modal__video" controls autoPlay loop src={previewItem.uploadedAsset.dataUrl} />
            ) : previewItem.uploadedAsset.mediaType === 'audio' ? (
              <audio className="asset-modal__audio" controls autoPlay src={previewItem.uploadedAsset.dataUrl} />
            ) : (
              <img className="asset-modal__image" src={previewItem.uploadedAsset.dataUrl} alt={previewItem.name} />
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
