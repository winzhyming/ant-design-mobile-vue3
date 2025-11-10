import type { CascaderOption, CascaderViewConfig } from './types'

export function useCascaderValueExtend(options: CascaderOption[], names: CascaderViewConfig) {
  const valueName = names.valueName || 'value'
  const childrenName = names.childrenName || 'children'
  return (val: (string | number)[], nptions?: CascaderOption[]) => {
    const items: (CascaderOption | null)[] = []
    let currentOptions = nptions ?? options
    for (const v of val) {
      const target = currentOptions.find((option) => option[valueName] === v) || null
      items.push(target)
      if (!target || !target[childrenName]) {
        return { items, isLeaf: !target || !target[childrenName] }
      }
      currentOptions = target[childrenName] as CascaderOption[]
    }
    return { items, isLeaf: false }
  }
}
