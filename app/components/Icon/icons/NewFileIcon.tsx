import { type IconProps } from '../+types';

export const NewFileIcon = ({ size = 24, color = 'currentColor', ...props }: Partial<IconProps>) => {
  return (
    <svg
      stroke={color}
      fill='currentColor'
      strokeWidth='0.25'
      viewBox='0 0 16 16'
      height={size}
      width={size}
      xmlns='http://www.w3.org/2000/svg'
      className='icon new-file'
      {...props}
    >
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M9.5 1.1l3.4 3.5.1.4v2h-1V6H8V2H3v11h4v1H2.5l-.5-.5v-12l.5-.5h6.7l.3.1zM9 2v3h2.9L9 2zm4 14h-1v-3H9v-1h3V9h1v3h3v1h-3v3z'
      ></path>
    </svg>
  );
};
