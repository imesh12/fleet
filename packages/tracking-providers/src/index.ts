export type NormalizedTrackingIngestEvent = {
  organizationId: string;
  vehicleId?: string;
  vehicleDeviceId?: string;
  externalDeviceId?: string;
  trackingProviderId?: string;
  tripId?: string;
  providerEventId?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  accuracy?: number;
  ignition?: boolean;
  battery?: number;
  odometer?: number;
  eventType?: string;
  providerTimestamp: Date;
  rawPayload?: unknown;
};

export type NormalizedTrackingDevice = {
  externalDeviceId: string;
  providerUniqueId?: string;
  name?: string;
  imei?: string;
  model?: string;
  phoneNumber?: string;
  lastSeenAt?: Date;
  metadata?: Record<string, unknown>;
  rawPayload?: unknown;
};

export type NormalizeTelemetryInput<TPayload = unknown> = {
  organizationId: string;
  trackingProviderId?: string;
  payload: TPayload;
};

export interface TrackingProviderAdapter<TDevicePayload = unknown, TPositionPayload = unknown> {
  readonly providerType: string;
  normalizeDevicePayload(input: NormalizeTelemetryInput<TDevicePayload>): NormalizedTrackingDevice;
  normalizePositionPayload(input: NormalizeTelemetryInput<TPositionPayload>): NormalizedTrackingIngestEvent;
}

export type TraccarDevicePayload = {
  id?: number | string;
  uniqueId?: string;
  name?: string;
  phone?: string;
  model?: string;
  attributes?: Record<string, unknown>;
  lastUpdate?: string;
};

export type TraccarPositionPayload = {
  id?: number | string;
  deviceId?: number | string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  course?: number;
  altitude?: number;
  accuracy?: number;
  ignition?: boolean;
  valid?: boolean;
  deviceTime?: string;
  fixTime?: string;
  serverTime?: string;
  attributes?: Record<string, unknown>;
};

function asDate(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function requireFiniteNumber(value: unknown, fieldName: string) {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    throw new Error(`Traccar payload is missing a valid ${fieldName}`);
  }

  return value;
}

function toExternalDeviceId(input: TraccarDevicePayload | TraccarPositionPayload) {
  const uniqueId =
    'uniqueId' in input && typeof input.uniqueId === 'string'
      ? input.uniqueId
      : 'deviceId' in input && input.deviceId !== undefined
        ? String(input.deviceId)
        : 'id' in input && input.id !== undefined
          ? String(input.id)
          : undefined;

  if (!uniqueId) {
    throw new Error('Traccar payload is missing a unique device identifier');
  }

  return uniqueId;
}

export class TraccarAdapter
  implements TrackingProviderAdapter<TraccarDevicePayload, TraccarPositionPayload>
{
  readonly providerType = 'TRACCAR';

  normalizeDevicePayload(input: NormalizeTelemetryInput<TraccarDevicePayload>): NormalizedTrackingDevice {
    const payload = input.payload;
    const lastSeenAt = asDate(payload.lastUpdate);
    return {
      externalDeviceId: toExternalDeviceId(payload),
      ...(payload.uniqueId ? { providerUniqueId: payload.uniqueId } : {}),
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.model ? { model: payload.model } : {}),
      ...(payload.phone ? { phoneNumber: payload.phone } : {}),
      ...(lastSeenAt ? { lastSeenAt } : {}),
      ...(payload.attributes ? { metadata: payload.attributes } : {}),
      rawPayload: payload,
    };
  }

  normalizePositionPayload(input: NormalizeTelemetryInput<TraccarPositionPayload>): NormalizedTrackingIngestEvent {
    const payload = input.payload;
    const attributes = payload.attributes ?? {};
    const providerTimestamp = asDate(payload.fixTime) ?? asDate(payload.deviceTime) ?? asDate(payload.serverTime) ?? new Date();

    return {
      organizationId: input.organizationId,
      ...(input.trackingProviderId ? { trackingProviderId: input.trackingProviderId } : {}),
      externalDeviceId: toExternalDeviceId(payload),
      ...(payload.id !== undefined ? { providerEventId: String(payload.id) } : {}),
      latitude: requireFiniteNumber(payload.latitude, 'latitude'),
      longitude: requireFiniteNumber(payload.longitude, 'longitude'),
      ...(typeof payload.speed === 'number' ? { speed: payload.speed } : {}),
      ...(typeof payload.course === 'number' ? { heading: payload.course } : {}),
      ...(typeof payload.altitude === 'number' ? { altitude: payload.altitude } : {}),
      ...(typeof payload.accuracy === 'number' ? { accuracy: payload.accuracy } : {}),
      ...(typeof payload.ignition === 'boolean'
        ? { ignition: payload.ignition }
        : typeof attributes.ignition === 'boolean'
          ? { ignition: attributes.ignition }
          : {}),
      ...(typeof attributes.batteryLevel === 'number' ? { battery: attributes.batteryLevel } : {}),
      ...(typeof attributes.odometer === 'number' ? { odometer: Math.round(attributes.odometer) } : {}),
      eventType: typeof attributes.event === 'string' ? attributes.event : payload.valid === false ? 'invalid_position' : 'position',
      providerTimestamp,
      rawPayload: payload,
    };
  }
}

export function createTrackingProviderAdapter(providerType: string) {
  const normalized = providerType.trim().toUpperCase();

  switch (normalized) {
    case 'TRACCAR':
      return new TraccarAdapter();
    default:
      throw new Error(`Unsupported tracking provider adapter: ${providerType}`);
  }
}
