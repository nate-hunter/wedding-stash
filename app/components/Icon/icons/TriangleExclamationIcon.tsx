import { type IconProps } from '../+types';

export function TriangleExclamationIcon({
  size = 24,
  color = 'var(--color-warning-500)',
  ...props
}: Partial<IconProps>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke={color}
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}
    >
      <path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'></path>
      <line x1='12' y1='9' x2='12' y2='13'></line>
      <line x1='12' y1='17' x2='12.01' y2='17'></line>
    </svg>
  );
}
