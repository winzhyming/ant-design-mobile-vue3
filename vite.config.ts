import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readdirSync } from 'fs'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

function createLocaleEntries() {
  const localeDir = resolve(__dirname, 'src/locales')
  return Object.fromEntries(
    readdirSync(localeDir)
      .filter((file) => file.endsWith('.ts'))
      .map((file) => {
        const entryName = file.replace(/\.ts$/, '')
        return [`locales/${entryName}`, resolve(localeDir, file)]
      })
  )
}

const libEntry = {
  index: resolve(__dirname, 'index.ts'),
  global: resolve(__dirname, 'src/global/index.ts'),
  ...createLocaleEntries(),
}

export default defineConfig({
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true,
      copyDtsFiles: true,
      include: ['src/**/*.ts', 'src/**/*.vue', 'index.ts'],
      staticImport: true,
      rollupTypes: false,
      logLevel: 'silent',
    }),
  ],
  build: {
    lib: {
      entry: libEntry,
      name: 'AntDesignMobileVue3',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'mjs' : 'cjs'
        const normalizedEntry = entryName.replace(/\\/g, '/')
        return `${normalizedEntry}.${ext}`
      },
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: [
        'vue',
        '@antv/g2',
        '@antv/g2plot',
        '@floating-ui/dom',
        '@rc-component/mini-decimal',
        'ant-mobile-icons-vue3',
        'ant-mobile-icons',
        'classnames',
        'dayjs',
        'lorem-ipsum',
        'runes2',
      ],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          vue: 'Vue',
        },
        // 保留原始的导出结构
        preserveModules: false,
        exports: 'named',
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return '[name][extname]'
          if (assetInfo.name === 'style.css') {
            return 'index.css'
          }
          return assetInfo.name
        },
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
    // 清理输出目录
    emptyOutDir: true,
    outDir: 'dist',
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
})
