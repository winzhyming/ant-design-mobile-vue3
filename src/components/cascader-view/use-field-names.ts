export type FieldNamesType = {
  label?: string
  value?: string
  disabled?: string
  children?: string
}

export function useFieldNames(fieldNames: FieldNamesType = {}) {
  const {
    label = 'label',
    value = 'value',
    disabled = 'disabled',
    children = 'children',
  } = fieldNames

  return [label, value, children, disabled] as const
}
