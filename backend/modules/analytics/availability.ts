import type { AnalyticsAvailability, AnalyticsAvailabilityStatus } from "./types";

const STATUS_PRIORITY: Record<AnalyticsAvailabilityStatus, number> = {
  tracking_missing: 5,
  not_enough_data: 4,
  no_data: 3,
  partial: 2,
  available: 1,
};

const uniqueNotes = (notes: string[]): string[] => Array.from(new Set(notes.filter((note) => note.trim().length > 0)));

export const createAvailability = (
  status: AnalyticsAvailabilityStatus,
  options?: {
    sampleSize?: number | null;
    notes?: string[];
  },
): AnalyticsAvailability => ({
  status,
  hasData: status === "available" || status === "partial",
  sampleSize: typeof options?.sampleSize === "number" ? options.sampleSize : null,
  notes: uniqueNotes(options?.notes ?? []),
});

export const available = (sampleSize?: number | null): AnalyticsAvailability =>
  createAvailability("available", { sampleSize });

export const partial = (notes: string[], sampleSize?: number | null): AnalyticsAvailability =>
  createAvailability("partial", { notes, sampleSize });

export const noData = (note: string, sampleSize?: number | null): AnalyticsAvailability =>
  createAvailability("no_data", { notes: [note], sampleSize });

export const notEnoughData = (note: string, sampleSize?: number | null): AnalyticsAvailability =>
  createAvailability("not_enough_data", { notes: [note], sampleSize });

export const trackingMissing = (note: string): AnalyticsAvailability =>
  createAvailability("tracking_missing", { notes: [note] });

export const mergeAvailability = (...items: AnalyticsAvailability[]): AnalyticsAvailability => {
  if (items.length === 0) {
    return available();
  }

  const status = items.reduce<AnalyticsAvailabilityStatus>((current, item) => {
    if (STATUS_PRIORITY[item.status] > STATUS_PRIORITY[current]) {
      return item.status;
    }

    return current;
  }, "available");

  const sampleSizes = items
    .map((item) => item.sampleSize)
    .filter((sampleSize): sampleSize is number => typeof sampleSize === "number" && Number.isFinite(sampleSize));

  return createAvailability(status, {
    sampleSize: sampleSizes.length > 0 ? Math.max(...sampleSizes) : null,
    notes: items.flatMap((item) => item.notes),
  });
};

export const toResponseAvailability = (availability: AnalyticsAvailability): {
  hasEnoughData: boolean;
  notes: string[];
} => ({
  hasEnoughData: availability.status === "available" || availability.status === "partial",
  notes: availability.notes,
});
