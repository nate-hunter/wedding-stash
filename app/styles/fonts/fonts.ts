import { Playfair_Display, Sono } from 'next/font/google';
import localFont from 'next/font/local';

const playfairDisplay = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
});

const sonoMono = Sono({
  variable: '--font-sono',
  subsets: ['latin'],
  display: 'swap',
});

const wonderUnitSans = localFont({
  src: [
    {
      path: './families/WonderUnitSans/WonderUnitSans-Thin.woff2',
      weight: '100',
      style: 'thin',
    },
    {
      path: './families/WonderUnitSans/WonderUnitSans-Light.woff2',
      weight: '300',
      style: 'light',
    },
    {
      path: './families/WonderUnitSans/WonderUnitSans-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './families/WonderUnitSans/WonderUnitSans-Medium.woff2',
      weight: '500',
      style: 'medium',
    },
    {
      path: './families/WonderUnitSans/WonderUnitSans-Bold.woff2',
      weight: '700',
      style: 'bold',
    },
    {
      path: './families/WonderUnitSans/WonderUnitSans-ExtraBold.woff2',
      weight: '800',
      style: 'extra-bold',
    },
    {
      path: './families/WonderUnitSans/WonderUnitSans-Black.woff2',
      weight: '900',
      style: 'black',
    },
  ],
  fallback: ['sans-serif'],
  variable: '--font-wonder',
  display: 'swap',
});

const thicccboi = localFont({
  src: [
    {
      path: './families/Thicccboi/Thicccboi-Thin.woff2',
      weight: '100',
      style: 'thin',
    },
    {
      path: './families/Thicccboi/Thicccboi-Light.woff2',
      weight: '300',
      style: 'light',
    },
    {
      path: './families/Thicccboi/Thicccboi-Regular.woff2',
      weight: '400',
      style: 'normal',
    },

    {
      path: './families/Thicccboi/Thicccboi-Medium.woff2',
      weight: '500',
      style: 'medium',
    },
    {
      path: './families/Thicccboi/Thicccboi-SemiBold.woff2',
      weight: '600',
      style: 'semi-bold',
    },
    {
      path: './families/Thicccboi/Thicccboi-Bold.woff2',
      weight: '700',
      style: 'bold',
    },
    {
      path: './families/Thicccboi/Thicccboi-ExtraBold.woff2',
      weight: '800',
      style: 'extra-bold',
    },
    {
      path: './families/Thicccboi/Thicccboi-Black.woff2',
      weight: '900',
      style: 'black',
    },
    {
      path: './families/Thicccboi/Thicccboi-ThicccAF.woff2',
      weight: '950',
      style: 'heavy',
    },
  ],
  fallback: ['sans-serif'],
  variable: '--font-thicccboi',
  display: 'swap',
});

const garet = localFont({
  src: [
    {
      path: './families/Garet/Garet-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './families/Garet/Garet-Bold.woff2',
      weight: '700',
      style: 'bold',
    },
  ],
  fallback: ['sans-serif'],
  variable: '--font-garet',
  display: 'swap',
});

export { wonderUnitSans, thicccboi, playfairDisplay, sonoMono, garet };
