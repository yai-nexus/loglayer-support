# Release Notes v0.7.0-alpha.1

## 🚀 重大架构重构：拥抱 LogLayer 生态

这是 0.7.0-alpha.1 版本，实现了提案 [refactoring-to-align-with-loglayer-ecosystem.md](./discuss/refactoring-to-align-with-loglayer-ecosystem.md) 的**阶段一**：服务端重构。

### ⚠️ 破坏性变更

#### 1. 移除了 LogLayerWrapper 系统
- **移除的接口：**`IEnhancedLogger`、`ILogger`
- **移除的模块：**`src/wrapper/` 整个目录
- **影响：**所有工厂函数现在直接返回 `LogLayer` 实例

#### 2. 服务端Logger创建逻辑重构
- **新的返回类型：**
  ```typescript
  // 之前
  createServerLogger(config): Promise<IEnhancedLogger>
  
  // 现在
  createServerLogger(config): Promise<LogLayer>
  ```

#### 3. Log Receiver 简化
- **简化逻辑：**移除复杂的 `LogProcessor`，直接转发到 LogLayer 实例
- **保留功能：**基本验证、框架适配器

### ✨ 新特性

#### 1. 原生 LogLayer Transport 支持
- **优先使用：**`@loglayer/transport-pino`
- **回退支持：**`@loglayer/transport-winston`
- **简单回退：**默认 LogLayer 实例

#### 2. 更简洁的API
- 直接使用 LogLayer API，无需学习额外的包装器接口
- 减少代码复杂度和维护负担

### 🔄 迁移指南

#### 服务端代码迁移

```typescript
// 之前的用法
import { createServerLogger } from '@yai-nexus/loglayer-support'
const logger: IEnhancedLogger = await createServerLogger(config)

// 现在的用法
import { LogLayer } from 'loglayer'
import { createServerLogger } from '@yai-nexus/loglayer-support'
const logger: LogLayer = await createServerLogger(config)

// API 调用基本相同
logger.info('Hello world')
logger.error('Something went wrong')
```

#### 注意事项
1. **浏览器端不受影响：**此版本仅重构服务端，浏览器端 API 保持不变
2. **配置格式不变：**现有的配置文件可以继续使用
3. **功能性等价：**核心日志功能保持一致

### 🧪 后续计划

- **0.7.0-alpha.2：**浏览器端重构，实现 `LoglayerBrowserTransport`
- **0.7.0-beta：**完整测试和文档更新
- **0.7.0：**正式发布

### 🐛 已知问题

- 部分示例代码和测试需要更新
- 某些高级功能（如性能测量、错误包装）暂时不可用
- 元数据传递在 LogLayer 中的行为可能与之前不同

### 📝 技术说明

此版本实现了我们向 LogLayer 生态系统对齐的第一步。通过移除自定义包装器，我们：

1. **减少了维护负担**
2. **提高了与 LogLayer 生态的兼容性**  
3. **为未来功能扩展奠定了基础**

这是一个重要的架构里程碑，为后续的完整重构铺平了道路。