# 迁移指南

## 从 `@yai-nexus/loglayer-support` 迁移到独立模块

`@yai-nexus/loglayer-support` 统一包已停止维护，请迁移到对应的独立模块。

### 🔄 包名映射

| 旧包 | 新包 | 说明 |
|------|------|------|
| `@yai-nexus/loglayer-support` | `@yai-loglayer/browser` | 浏览器端功能 |
| `@yai-nexus/loglayer-support` | `@yai-loglayer/server` | 服务端功能 |
| `@yai-nexus/loglayer-support` | `@yai-loglayer/receiver` | 日志接收器功能 |
| `@yai-nexus/loglayer-support` | `@yai-loglayer/core` | 核心类型和工具 |
| `@yai-nexus/loglayer-support` | `@yai-loglayer/sls-transport` | SLS 传输功能 |

### 📦 安装新包

```bash
# 卸载旧包
npm uninstall @yai-nexus/loglayer-support

# 安装需要的新包
npm install @yai-loglayer/browser    # 浏览器端
npm install @yai-loglayer/server     # 服务端
npm install @yai-loglayer/receiver   # 日志接收器
npm install @yai-loglayer/core       # 核心功能
npm install @yai-loglayer/sls-transport  # SLS 传输
```

### 🔧 代码迁移

#### 浏览器端代码

**旧代码:**
```typescript
import { createBrowserLogger } from '@yai-nexus/loglayer-support';
```

**新代码:**
```typescript
import { createBrowserLogger } from '@yai-loglayer/browser';
```

#### 服务端代码

**旧代码:**
```typescript
import { createNextjsServerLogger } from '@yai-nexus/loglayer-support';
```

**新代码:**
```typescript
import { createNextjsServerLogger } from '@yai-loglayer/server';
```

#### 日志接收器代码

**旧代码:**
```typescript
import { createNextjsLogReceiver } from '@yai-nexus/loglayer-support';
```

**新代码:**
```typescript
import { createNextjsLogReceiver } from '@yai-loglayer/receiver';
```

#### SLS 传输代码

**旧代码:**
```typescript
import { SlsTransport } from '@yai-nexus/loglayer-support';
```

**新代码:**
```typescript
import { SlsTransport } from '@yai-loglayer/sls-transport';
```

### ✅ 迁移检查清单

- [ ] 卸载 `@yai-nexus/loglayer-support`
- [ ] 安装需要的 `@yai-loglayer/*` 模块
- [ ] 更新所有 import 语句
- [ ] 测试功能是否正常
- [ ] 更新 package.json 依赖
- [ ] 更新文档和注释中的包名引用

### 🎯 迁移优势

- **更小的包体积**: 只安装需要的功能
- **更好的树摇**: 支持精确的 tree-shaking
- **独立更新**: 每个模块可以独立升级
- **清晰的职责**: 功能划分更明确

### 🆘 需要帮助？

如果在迁移过程中遇到问题，请：

1. 查看各模块的 README 文档
2. 在 [GitHub Issues](https://github.com/yai-nexus/loglayer-support/issues) 提问
3. 参考 [examples](./examples/) 目录中的示例代码
