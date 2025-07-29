type ClassNameBuilderArgs = Record<string, string | boolean | number>;

// TODO: Use an object of `options` as params
// TODO: Add "flexibility" for a given prefix to the className?
//       FOR EXAMPLE: className = `${className} ${withPrefix}${styleValue}-${styleProperty}`.trim();

const nonAppliedValues = new Set(['default', 'normal', false, 0]);

/** Builds an element's 'className'
 * @param baseClassName - string: The base className to build upon
 * @param args - object: The arguments to build the className from
 * @param prefix - string: The prefix to add to the className (optional)
 * @returns string: The built className
 */
export function cN(baseClassName: string, args: ClassNameBuilderArgs, prefix?: string) {
  let className = baseClassName;
  const withPrefix = prefix ? `${prefix}` : '';
  for (const [styleProperty, styleValue] of Object.entries(args)) {
    if (nonAppliedValues.has(styleValue)) continue;
    if (typeof styleValue === 'boolean') {
      className = `${className} ${withPrefix}${styleProperty}`.trim();
      continue;
    }
    if (withPrefix) {
      className = `${className} ${withPrefix}${styleValue}`.trim();
    } else {
      className = `${className} ${styleProperty}-${styleValue}`.trim();
    }
  }
  return className;
}
