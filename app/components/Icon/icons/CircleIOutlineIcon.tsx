import { type IconProps } from '../+types';

export function CircleIOutlineIcon({ size = 24, color = 'currentColor', ...props }: Partial<IconProps>) {
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
      <circle cx='12' cy='12' r='10'></circle>
      <line x1='12' y1='16' x2='12' y2='12'></line>
      <line x1='12' y1='8' x2='12.01' y2='8'></line>
    </svg>
  );
}
