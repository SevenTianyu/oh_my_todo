# 面试工作台原型

## 目标

验证一个桌面 Web 面试管理工作台是否能同时承载：

- 未来 7 天已定面试
- 按分组查看的活跃公司流程
- 公司级和轮次级感受记录

## 本地运行

```bash
npm install
npm run dev
```

## 测试

```bash
npm run test
npm run e2e
```

首次运行 e2e 前，若本机没有 Playwright 浏览器，可执行：

```bash
npx playwright install
```

## 当前范围

- 桌面 Web
- 纯手动录入
- localStorage 持久化
- 不含自动导入和多端同步
