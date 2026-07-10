import type { InputHTMLAttributes } from 'react';

import { TextInput } from '@/components/text-input';

export function NumberInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <TextInput type="number" {...props} />;
}
