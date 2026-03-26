export type RuntimeRecord = Record<string, unknown>

export function asRecord(value: unknown): RuntimeRecord | null {
  return typeof value === 'object' && value !== null ? (value as RuntimeRecord) : null
}

export function readStringField(value: unknown, keys: string[]): string | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  for (const key of keys) {
    const field = record[key]
    if (typeof field === 'string' && field.trim().length > 0) {
      return field.trim()
    }
  }

  return null
}

export function readNumberField(value: unknown, keys: string[]): number | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  for (const key of keys) {
    const field = record[key]
    if (typeof field === 'number' && Number.isFinite(field)) {
      return field
    }

    if (typeof field === 'string' && field.trim().length > 0) {
      const parsed = Number(field)
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return null
}

export function readBooleanField(value: unknown, keys: string[]): boolean | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  for (const key of keys) {
    const field = record[key]
    if (typeof field === 'boolean') {
      return field
    }
  }

  return null
}

export function readArrayField(value: unknown, keys: string[]): unknown[] {
  const record = asRecord(value)
  if (!record) {
    return []
  }

  for (const key of keys) {
    const field = record[key]
    if (Array.isArray(field)) {
      return field
    }
  }

  return []
}
