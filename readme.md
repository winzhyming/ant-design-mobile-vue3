# Ant Design Mobile For Vue3

A mobile Ant Design UI library based on Vue 3

## Install

```shell
npm install ant-design-mobile-vue3
```

or

```shell
yarn add ant-design-mobile-vue3
```

or

```shell
pnpm add ant-design-mobile-vue3
```

## Usage

### Full Import

```typescript
import { createApp } from 'vue'
import App from './App.vue'

// Import global behaviors & CSS variables (px tester, body styles, etc.)
import 'ant-design-mobile-vue3/global'
// Import all components
import * as AntMobile from 'ant-design-mobile-vue3'
// Import component styles
import 'ant-design-mobile-vue3/dist/index.css'

const app = createApp(App)

// Register all components globally
Object.keys(AntMobile).forEach(key => {
  if (key !== 'default') {
    app.component(key, AntMobile[key])
  }
})

app.mount('#app')
```

### On-Demand Import

```vue
<template>
  <Button color="primary">Primary Button</Button>
</template>

<script setup lang="ts">
import { Button } from 'ant-design-mobile-vue3'
import 'ant-design-mobile-vue3/global'
import 'ant-design-mobile-vue3/dist/index.css'
</script>
```

> ℹ️ Import `ant-design-mobile-vue3/global` **once** in your app entry to enable responsive px conversion and global styles.

## Components

This library includes the following components:

- Button
- Input
- Form
- List
- Dialog
- Toast
- Loading
- Tabs
- Picker
- DatePicker
- Checkbox
- Radio
- Switch
- Stepper
- Badge
- Tag
- Image
- And many more...

## Reference

Refer to [Ant Design Mobile for React](https://mobile.ant.design/components) for component API and usage documentation.

## License

MIT

## Author

zhangyanming