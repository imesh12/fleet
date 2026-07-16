export function CoordinateDisplay({ latitude, longitude }: { latitude: unknown; longitude: unknown }) {
  const lat = latitude === null || latitude === undefined ? null : Number(latitude);
  const lng = longitude === null || longitude === undefined ? null : Number(longitude);

  if (lat === null || lng === null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return <span className="text-sm text-ink/45">No coordinates</span>;
  }

  return (
    <span className="font-mono text-sm text-ink">
      {lat.toFixed(6)}, {lng.toFixed(6)}
    </span>
  );
}
