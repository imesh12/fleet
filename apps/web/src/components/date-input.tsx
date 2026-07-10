import type { InputHTMLAttributes } from 'react';

import { TextInput } from '@/components/text-input';

export function DateInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <TextInput type="date" {...props} />;
}
