'use client';

import { useParams } from 'next/navigation';

import { DriverRegistryForm } from '@/components/driver-registry-form';

export default function EditDriverPage() {
  const params = useParams<{ driverId: string }>();
  return <DriverRegistryForm driverId={params.driverId} />;
}
