import { CoordinateDisplay } from '@/components/coordinate-display';
import { Card, CardTitle } from '@/components/ui/card';

type PositionRecord = Record<string, unknown>;

export function MapReadyPanel({ positions, title = 'Map-ready positions' }: { positions: PositionRecord[]; title?: string }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <p className="mt-2 text-sm text-ink/60">Map rendering is deferred for this stage. Coordinates are structured for a future Leaflet/OpenStreetMap panel without legacy keys.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {positions.slice(0, 12).map((position, index) => (
          <div key={String(position.id ?? index)} className="rounded-2xl bg-ink/5 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink/45">Point {index + 1}</p>
            <div className="mt-2"><CoordinateDisplay latitude={position.latitude} longitude={position.longitude} /></div>
          </div>
        ))}
      </div>
    </Card>
  );
}
