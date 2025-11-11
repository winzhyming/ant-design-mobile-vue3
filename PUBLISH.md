# 发布到 npm 前的检查清单

## 准备工作

1. ✅ 已配置 `package.json` 的基本信息
   - name: ant-design-mobile-vue3
   - version: 1.0.1
   - description: A mobile Ant Design UI library based on Vue 3
   - author: zhangyanming
   - license: MIT

2. ✅ 已添加构建配置
   - vite.config.ts
   - tsconfig.json

3. ✅ 已添加构建脚本
   - `npm run build` - 构建组件库
   - `prepublishOnly` - 发布前自动构建

## 发布步骤

### 1. 登录 npm

如果还没有登录 npm，请先登录：

```bash
npm login
```

### 2. 更新版本号（可选）

如果需要更新版本号：

```bash
# 补丁版本 (1.0.1 -> 1.0.2)
npm version patch

# 次要版本 (1.0.1 -> 1.1.0)
npm version minor

# 主要版本 (1.0.1 -> 2.0.0)
npm version major
```

### 3. 构建项目

```bash
npm run build
```

### 4. 检查构建产物

确保 `dist` 目录包含以下文件：
- index.mjs (ES Module)
- index.cjs (CommonJS)
- global.mjs (全局样式入口)
- global.cjs (全局样式入口)
- locales/*.mjs (多语言入口)
- locales/*.cjs (多语言入口)
- index.css (样式文件)
- index.d.ts、global.d.ts (TypeScript 类型定义)
- locales/*.d.ts (多语言类型定义)
- src/ (类型定义源文件)

### 5. 测试包（可选）

在发布前，可以先进行本地测试：

```bash
npm pack
```

这会生成一个 `.tgz` 文件，你可以在其他项目中安装测试：

```bash
npm install /path/to/ant-design-mobile-vue3-1.0.1.tgz
```

### 6. 发布到 npm

```bash
npm publish
```

如果是第一次发布且包名被占用，你可能需要使用作用域：

```bash
npm publish --access public
```

## 发布后

### 检查包是否发布成功

访问 npm 官网：
```
https://www.npmjs.com/package/ant-design-mobile-vue3
```

### 在新项目中测试安装

```bash
npm install ant-design-mobile-vue3
```

## 注意事项

1. 确保 `.npmignore` 配置正确，不要将源代码和开发文件发布到 npm
2. 发布前确保所有测试通过
3. 建议使用语义化版本号
4. 发布前可以使用 `npm pack` 预览将要发布的内容
5. 在测试项目中确认 `import 'ant-design-mobile-vue3/global'` 能够正确引入全局样式与 px 测试器
6. 在测试项目中确认 `import zhCN from 'ant-design-mobile-vue3/locales/zh-CN'` 能够正常获取语言包
7. 如果需要撤销发布（24小时内）：`npm unpublish ant-design-mobile-vue3@版本号`

## 常见问题

### Q: 包名已被占用怎么办？
A: 可以添加作用域，如 `@yourusername/ant-design-mobile-vue3`

### Q: 如何更新已发布的包？
A: 更新版本号后重新 `npm publish`

### Q: 如何发布 beta 版本？
A: 使用 `npm publish --tag beta`
