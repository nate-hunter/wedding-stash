import React from 'react';
import Link, { LinkProps } from 'next/link';

import { cN } from '@/utils/classname-builder';

import { Variant, VariantBG, VariantShape, VariantSize } from '@/app/styles/types';

// TODO: Better handle Links?

type ButtonProps = React.ComponentPropsWithoutRef<'button'> &
  LinkProps & {
    text: string;
    variant: Variant;
    shape: VariantShape;
    size: VariantSize;
    bg: VariantBG;
    isBordered: boolean;
    isLoading: boolean;
    isDisabled: boolean;
    width: 'fit' | 'full' | 'auto' | number;
    isUppercase: boolean;
    asLink: boolean;
    // ----- DEV -----
    // icon: React.ReactNode;
    // iconPosition: 'start' | 'end';
  };

const Button = React.forwardRef<HTMLButtonElement, Partial<ButtonProps>>(
  (
    {
      children,
      text,
      variant = 'default',
      shape = 'straight',
      size = 'md',
      bg = 'default',
      isBordered = false,
      isLoading = false,
      isDisabled = false,
      width = 'full',
      isUppercase = false,
      asLink = false,
      // ----- DEV -----
      // icon: Icon,
      // iconPosition = 'start',
      ...props
    },
    ref,
  ) => {
    // ~~~~~ LOGGING ~~~~~
    // console.log('######## Button ########');
    // ~~~~~ LOGGING ~~~~~

    // ----- AS -----
    let As: React.ElementType = 'button';
    if (asLink) {
      As = Link as typeof Link;
    }

    // ----- BTN CLASSNAME BUILDER -----
    const btnStyles: React.CSSProperties = {};
    let btnClassName = cN(
      'ws-btn',
      {
        variant,
        size,
        bg,
        shape,
        isLoading,
        isDisabled,
        isUppercase,
        isBordered,
        asLink,
      },
      'ws-btn__',
    );

    // const btnVariant = cN(
    //   'ws-btn',
    //   {
    //     variant,
    //   },
    //   'ws-btn',
    // );

    // ----- WIDTH -----
    if (typeof width === 'number') {
      btnStyles.width = `${width}px`;
    } else {
      btnClassName += ` ws-btn__${width}`;
    }

    // ~~~~~ LOGGING ~~~~~
    // console.log('-> { size } =>', size, '// typeof size:', typeof size);
    // console.log('-> { width } =>', width, '// typeof width:', typeof width);
    // console.log('-> { widthStyles } =>', widthStyles);
    // console.log(`[ ${text} ] `, '\n-> { btnClassName } =>', btnClassName);
    // console.log('-> { btnVariant } =>', btnVariant);
    // console.log('-> { btnStyles } =>', btnStyles);
    // ~~~~~ LOGGING ~~~~~

    return (
      <As ref={ref} {...props} className={btnClassName} style={btnStyles}>
        {children ?? text}
      </As>
    );
  },
);

Button.displayName = 'Button';

export default Button;
