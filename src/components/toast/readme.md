# Vue Toast 组件

基于 Ant Design Mobile 的 Toast 组件移植的 Vue 版本。

## 特性

- 🎯 支持多种图标类型：success、fail、loading
- 📍 支持多种位置：top、bottom、center
- ⏰ 支持自定义持续时间
- 🎨 支持自定义样式和类名
- 🔧 支持全局配置
- 💫 支持命令式调用

## 基本用法

```typescript
import Toast from './vue-toast'

// 简单文本提示
Toast.show('操作成功')

// 成功提示
Toast.success('保存成功')

// 失败提示
Toast.fail('操作失败')

// 加载中提示
Toast.loading('加载中...')

// 自定义配置
Toast.show({
  content: '自定义内容',
  duration: 3000,
  position: 'top',
  icon: 'success',
})
```

## 高级用法

```typescript
// 手动控制关闭
const handler = Toast.loading('加载中...', { duration: 0 })
setTimeout(() => {
  handler.close()
}, 3000)

// 全局配置
Toast.config({
  duration: 3000,
  position: 'center',
  maskClickable: true,
})

// 清除所有 Toast
Toast.clear()
```

## API

### Toast.show(options)

| 参数            | 说明                                    | 类型                                        | 默认值      |
| --------------- | --------------------------------------- | ------------------------------------------- | ----------- |
| content         | 提示内容                                | `string \| VNode`                           | -           |
| icon            | 图标类型                                | `'success' \| 'fail' \| 'loading' \| VNode` | -           |
| duration        | 持续时间，单位毫秒，设为 0 时不自动关闭 | `number`                                    | `2000`      |
| position        | 位置                                    | `'top' \| 'bottom' \| 'center'`             | `'center'`  |
| maskClickable   | 是否允许背景点击                        | `boolean`                                   | `true`      |
| maskStyle       | 遮罩样式                                | `Record<string, any>`                       | -           |
| maskClassName   | 遮罩类名                                | `string`                                    | -           |
| afterClose      | 关闭后回调                              | `() => void`                                | -           |
| getContainer    | 自定义容器                              | `any`                                       | -           |
| stopPropagation | 阻止事件冒泡                            | `string[]`                                  | `['click']` |

### Toast.success(content, options)

显示成功提示。

### Toast.fail(content, options)

显示失败提示。

### Toast.loading(content, options)

显示加载提示。

### Toast.clear()

清除所有显示中的 Toast。

### Toast.config(options)

全局配置。

| 参数          | 说明                 | 类型                            | 默认值     |
| ------------- | -------------------- | ------------------------------- | ---------- |
| duration      | 默认持续时间         | `number`                        | `2000`     |
| position      | 默认位置             | `'top' \| 'bottom' \| 'center'` | `'center'` |
| maskClickable | 默认是否允许背景点击 | `boolean`                       | `true`     |

## 依赖组件

确保你已经封装好以下组件：

- `CheckOutline` - 成功图标组件
- `CloseOutline` - 失败图标组件
- `SpinLoading` - 加载动画组件
- `AutoCenter` - 自动居中组件
- `Mask` - 遮罩组件

## 样式

组件使用了与 Ant Design Mobile 相同的样式结构，你可以根据需要自定义 CSS 变量：

```css
:root {
  --adm-font-size-7: 14px;
}
```
