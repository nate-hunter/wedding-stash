import { type IconProps } from '../+types';

export const ArrowTopRightIcon = ({ size = 24, strokeWidth = 0, ...props }: Partial<IconProps>) => {
  return (
    <svg
      stroke='currentColor'
      fill='currentColor'
      strokeWidth={strokeWidth}
      viewBox='0 0 24 24'
      height={size}
      width={size}
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path
        fillRule='evenodd'
        d='M15.75 2.25H21a.75.75 0 0 1 .75.75v5.25a.75.75 0 0 1-1.5 0V4.81L8.03 17.03a.75.75 0 0 1-1.06-1.06L19.19 3.75h-3.44a.75.75 0 0 1 0-1.5Zm-10.5 4.5a1.5 1.5 0 0 0-1.5 1.5v10.5a1.5 1.5 0 0 0 1.5 1.5h10.5a1.5 1.5 0 0 0 1.5-1.5V10.5a.75.75 0 0 1 1.5 0v8.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V8.25a3 3 0 0 1 3-3h8.25a.75.75 0 0 1 0 1.5H5.25Z'
        clipRule='evenodd'
      ></path>
    </svg>
  );
};
