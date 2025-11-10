// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function attachPropertiesToComponent<C, P extends Record<string, any>>(
  component: C,
  properties: P,
): C & P {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ret = component as any
  for (const key in properties) {
    if (properties.hasOwnProperty(key)) {
      ret[key] = properties[key]
    }
  }
  return ret
}
