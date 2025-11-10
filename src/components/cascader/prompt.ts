import { createApp, h } from 'vue'
import type { CascaderOption, CascaderValue } from '../cascader-view/types'
import Cascader from './cascader.vue'

export interface PromptProps {
  options?: CascaderOption[]
  title?: string
  defaultValue?: CascaderValue[]
  placeholder?: string | ((index: number) => string)
}

export function prompt(props: PromptProps) {
  return new Promise<CascaderValue[] | null>((resolve) => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const handleResolve = (value: CascaderValue[] | null) => {
      app.unmount()
      container.remove()
      resolve(value)
    }

    const app = createApp({
      render() {
        return h(Cascader, {
          placeholder: props.placeholder,
          options: props.options,
          defaultValue: props.defaultValue,
          title: props.title,
          visible: true,
          onVisibleChange: (v: boolean) => {
            if (!v) handleResolve(null)
          },
          onChange: (v: CascaderValue[]) => {
            handleResolve(v)
          },
        })
      },
    })

    app.mount(container)
  })
}
