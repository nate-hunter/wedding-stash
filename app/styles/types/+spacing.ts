import { spacingMap, fractionMap, justifyAlignMap, stretchMap } from '../constants';

// TODO: Remove any types not used.

export type SpacingMap = typeof spacingMap;
export type SpacingMapKey = keyof typeof spacingMap;

export type FractionMap = typeof fractionMap;
export type FractionMapKey = keyof typeof fractionMap;

export type JustifyAlignMap = typeof justifyAlignMap;
export type JustifyAlignMapKey = keyof typeof justifyAlignMap;

export type StretchMap = typeof stretchMap;
export type StretchMapKey = keyof typeof stretchMap;

export type Unit =
  | 'vmin'
  | 'vmax'
  | 'vh'
  | 'vw'
  | '%'
  | 'ch'
  | 'ex'
  | 'em'
  | 'rem'
  | 'in'
  | 'cm'
  | 'mm'
  | 'pt'
  | 'pc'
  | 'px';

export type SizeUnit = `${number}${Unit}`;

export type PaddedSpace = SpacingMapKey | SizeUnit | number | Array<SpacingMapKey | SizeUnit | number>;

export type SizeKeyword = 'auto' | 'inherit' | 'none' | 'min-content' | 'max-content' | 'fit-content';

export type CSSLength = SizeKeyword;

export type GapSpace = SpacingMapKey | number | SizeUnit;
