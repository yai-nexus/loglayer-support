# Frameworks 目录结构说明

这个目录包含针对不同框架和环境的开箱即用预设函数。

## 文件组织

```
src/frameworks/
├── index.ts          # 统一导出接口
├── browser.ts        # 浏览器端日志器预设
├── server.ts         # 服务端日志器预设  
├── receiver.ts       # 日志接收器预设
├── nextjs.ts         # Next.js 特定预设
└── README.md         # 本说明文件
```

## 设计原则

1. **单一职责**：每个文件专注于特定环境或框架
2. **组合优于继承**：nextjs.ts 通过组合 browser.ts 和 server.ts 实现
3. **渐进式增强**：从基础功能开始，逐步添加高级特性
4. **类型安全**：完善的 TypeScript 类型定义
5. **向后兼容**：保持与现有 API 的兼容性

## 实现计划

- [x] 目录结构创建
- [ ] browser.ts 实现 (任务 1.3-1.4)
- [ ] receiver.ts 实现 (任务 1.6-1.7)  
- [ ] server.ts 实现 (任务 1.9-1.10)
- [ ] nextjs.ts 实现 (后续任务)
- [ ] 单元测试 (任务 1.11)
- [ ] 导出接口更新 (任务 1.12)

## 使用示例

```typescript
// 浏览器端
import { createBrowserLogger } from '@yai-nexus/loglayer-support/frameworks'

const logger = await createBrowserLogger({
  outputs: {
    console: true,
    localStorage: { maxEntries: 500 },
    http: { endpoint: '/api/logs' }
  }
})

// 服务端
import { createServerLogger } from '@yai-nexus/loglayer-support/frameworks'

const { logger, forModule } = await createServerLogger('my-app', {
  logsDir: './logs',
  modules: {
    api: { level: 'info' },
    database: { level: 'debug' }
  }
})

// 日志接收器
import { createLogReceiver } from '@yai-nexus/loglayer-support/frameworks'

const receiver = createLogReceiver(logger, {
  validation: { requireLevel: true },
  security: { validateOrigin: true }
})

export async function POST(request) {
  return receiver.nextjs(request)
}
```
