import type { SVGProps } from 'react';
import type { SizeUnit, Variant, VariantSize } from '@/app/styles/types';

export type IconProps = SVGProps<SVGSVGElement> & {
  size?: VariantSize | SizeUnit | number;
  variant?: Variant;
};
