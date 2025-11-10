import { inject, provide, type InjectionKey } from 'vue'
import type { FormContextType, Meta } from './types'
import { defaultFormContext } from './types'

export const FormContextKey: InjectionKey<FormContextType> = Symbol('FormContext')
export const NoStyleItemContextKey: InjectionKey<
  (meta: Meta & { destroy?: boolean }, namePath: (string | number)[]) => void
> = Symbol('NoStyleItemContext')

export function useFormContext(): FormContextType {
  return inject(FormContextKey, defaultFormContext)
}

export function provideFormContext(context: FormContextType) {
  provide(FormContextKey, context)
}

export function useNoStyleItemContext() {
  return inject(NoStyleItemContextKey, null)
}

export function provideNoStyleItemContext(
  fn: (meta: Meta & { destroy?: boolean }, namePath: (string | number)[]) => void,
) {
  provide(NoStyleItemContextKey, fn)
}
