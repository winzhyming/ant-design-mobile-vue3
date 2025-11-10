import type { VNode } from 'vue'
import type { Rule } from './types'

export function toArray<T>(candidate?: T | T[] | false): T[] {
  if (candidate === undefined || candidate === false) return []
  return Array.isArray(candidate) ? candidate : [candidate]
}

// Check if value is Promise
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPromise(value: any): value is Promise<any> {
  return value && typeof value.then === 'function'
}

// Get component name for debugging
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getComponentName(component: any): string {
  if (!component) return 'Unknown'
  if (typeof component === 'string') return component
  if (component.name) return component.name
  if (component.__name) return component.__name
  if (component.displayName) return component.displayName
  return 'Anonymous'
}

// Create a unique field ID
export function createFieldId(formName?: string, namePath?: (string | number)[]): string {
  const nameList = toArray(namePath)
  if (nameList.length === 0) return ''

  const fullPath = formName ? [formName, ...nameList] : nameList
  return fullPath.join('_')
}

// Check if the rule has required property
export function isRequired(rules?: Rule[]): boolean {
  return !!(rules && rules.some((rule) => !!(rule && typeof rule === 'object' && rule.required)))
}

// Safe clone element with new props
export function cloneVNode(
  vnode: VNode,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any> = {},
): VNode {
  if (!vnode) return vnode

  const cloned = { ...vnode }
  cloned.props = { ...vnode.props, ...props }
  return cloned
}

// Merge multiple classes
export function mergeClasses(
  ...classes: (string | undefined | null | false | Record<string, boolean>)[]
): string {
  const result: string[] = []

  classes.forEach((cls) => {
    if (!cls) return

    if (typeof cls === 'string') {
      result.push(cls)
    } else if (typeof cls === 'object') {
      Object.keys(cls).forEach((key) => {
        if (cls[key]) {
          result.push(key)
        }
      })
    }
  })

  return result.join(' ')
}

// Get value from event (commonly used for form controls)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getValueFromEvent(e: any): any {
  if (!e || !e.target) return e

  const { target } = e
  return target.type === 'checkbox' ? target.checked : target.value
}

// Generate a unique key
let keyIndex = 0
export function generateKey(): number {
  return ++keyIndex
}
