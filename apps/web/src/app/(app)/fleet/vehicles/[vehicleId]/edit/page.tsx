'use client';

import { useParams } from 'next/navigation';

import { VehicleRegistryForm } from '@/components/vehicle-registry-form';

export default function EditVehiclePage() {
  const params = useParams<{ vehicleId: string }>();
  return <VehicleRegistryForm vehicleId={params.vehicleId} />;
}
