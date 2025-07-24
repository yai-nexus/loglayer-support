# `loglayer-support` 库能力增强与重构迭代计划

## 1. 背景

经过对 <mcfile name="browser-vs-bff-logging-analysis.md" path="/Users/harrytang/Documents/GitHub/loglayer-support/discuss/browser-vs-bff-logging-analysis.md"></mcfile> 文档的深入分析，以及对 <mcfolder name="examples/nextjs/" path="/Users/harrytang/Documents/GitHub/loglayer-support/examples/nextjs/"></mcfolder> 示例项目的代码审查，我们达成了以下共识：

- **浏览器端日志潜力巨大**：浏览器端在用户行为监控、性能追踪和错误捕获方面具有天然优势，是日志能力建设的关键一环。
- **示例代码是宝贵资产**：`nextjs` 示例中包含的客户端日志实现 (<mcfile name="client-logger.ts" path="/Users/harrytang/Documents/GitHub/loglayer-support/examples/nextjs/lib/client-logger.ts"></mcfile>)、服务端日志接收端点 (<mcfile name="route.ts" path="/Users/harrytang/Documents/GitHub/loglayer-support/examples/nextjs/app/api/client-logs/route.ts"></mcfile>) 和服务端日志初始化模式 (<mcfile name="server-logger.ts" path="/Users/harrytang/Documents/GitHub/loglayer-support/examples/nextjs/lib/server-logger.ts"></mcfile>)，是经过实践检验的、具有高度通用性的最佳实践。
- **重构是必经之路**：将这些最佳实践作为“示例”埋没，极大地限制了其可发现性和可重用性。将其重构并沉淀到核心库中，是提升 `loglayer-support` 价值的关键一步。

本计划旨在将上述发现转化为一个清晰、分阶段的迭代方案，以便我们进行讨论和高效执行。

## 2. 核心目标

本次迭代的核心目标是：

1.  **提升易用性**：提供“开箱即用”的预设（Presets），让开发者能够以最少的配置快速在浏览器和 Next.js 等现代框架中集成功能完备的日志系统。
2.  **增强功能性**：正式将功能丰富的客户端日志方案作为库的核心能力之一，并实现分析报告中提出的高优功能（如批量上报、重试机制等）。
3.  **优化架构**：将通用逻辑从 `examples` 目录迁移至 `src` 目录，实现代码的标准化、模块化和可维护性。

## 3. 迭代计划：三步走战略

我们建议将整个迭代过程分为三个紧密衔接的阶段：

### **第一阶段：核心重构与预设（Preset）建设**

此阶段的重点是将 `nextjs` 示例中的精华代码迁移并抽象为库的核心功能。

- **任务 1：创建框架适配层 `src/frameworks`**
    - 在 `src` 目录下新建 `frameworks` 目录，用于存放针对特定框架（如 Next.js, Browser）的适配器和预设代码。

- **任务 2：打造浏览器端日志预设 `createBrowserLogger`**
    - **来源**：<mcfile name="examples/nextjs/lib/client-logger.ts" path="/Users/harrytang/Documents/GitHub/loglayer-support/examples/nextjs/lib/client-logger.ts"></mcfile>
    - **目标**：在 `src/frameworks/browser.ts` 中创建一个名为 `createBrowserLogger` 的工厂函数。它将封装会话管理、丰富的上下文附加、多目标输出（Console, LocalStorage, Remote）等逻辑，并提供配置项供用户选择开启。

- **任务 3：打造服务端日志接收器 `createLogReceiver`**
    - **来源**：<mcfile name="examples/nextjs/app/api/client-logs/route.ts" path="/Users/harrytang/Documents/GitHub/loglayer-support/examples/nextjs/app/api/client-logs/route.ts"></mcfile>
    - **目标**：在 `src/frameworks/next.ts` (或其他通用位置) 中创建一个名为 `createLogReceiver` 的函数。它接收一个已初始化的 `logger` 实例，并返回一个可直接在 Next.js API Route 中使用的请求处理函数（handler）。

- **任务 4：打造 Node/Next.js 服务端日志预设 `createServerLogger`**
    - **来源**：<mcfile name="examples/nextjs/lib/server-logger.ts" path="/Users/harrytang/Documents/GitHub/loglayer-support/examples/nextjs/lib/server-logger.ts"></mcfile>
    - **目标**：在 `src/frameworks/node.ts` 中创建一个名为 `createServerLogger` 的工厂函数。它将封装异步初始化、Proxy 代理和动态路径处理等逻辑，让服务端日志的初始化变得简单而健壮。

### **第二阶段：实现浏览器端高优功能**

在第一阶段的基础上，根据 <mcfile name="browser-vs-bff-logging-analysis.md" path="/Users/harrytang/Documents/GitHub/loglayer-support/discuss/browser-vs-bff-logging-analysis.md"></mcfile> 的规划，增强 `createBrowserLogger` 的能力。

- **任务 1：实现日志批量处理（Batching）**
    - 在 `createBrowserLogger` 中增加日志缓冲和批量发送机制，减少网络请求，优化性能。

- **任务 2：实现发送失败重试（Retry）**
    - 为日志上报增加自动重试逻辑，提高日志发送的成功率和可靠性。

- **任务 3：集成 IndexedDB**
    - 将本地存储从 `localStorage` 升级到 `IndexedDB`，以支持更大容量、更结构化的日志缓存，为离线日志和更复杂的查询打下基础。

### **第三阶段：文档与示例更新**

让开发者了解并使用我们的新成果。

- **任务 1：编写新版文档**
    - 在 `docs/` 目录下创建新的文档页面，详细介绍 `createBrowserLogger`, `createLogReceiver`, `createServerLogger` 的使用方法和配置选项。

- **任务 2：重构 `nextjs` 示例**
    - 清理旧的 `nextjs` 示例代码，使其完全依赖 `loglayer-support` 库提供的新预设进行初始化，作为一个简洁、标准的最佳实践范例。

- **任务 3：更新 `README.md` 和 `USAGE.md`**
    - 在项目主文档中突出展示新的“开箱即用”特性，吸引用户使用。

## 4. 预期收益

完成本次迭代后，`loglayer-support` 将会：

- **开发者体验极大提升**：从一个需要手动配置的底层库，升级为一个拥有智能化预设、能快速集成到主流环境的“日志解决方案”。
- **核心竞争力增强**：拥有业界领先的浏览器端日志能力，弥补了与 BFF/Server 端日志的功能鸿沟。
- **项目架构更清晰**：代码结构更合理，职责更分明，为未来的功能扩展和社区贡献奠定了坚实的基础。

我们是否可以就此计划达成一致，并开始着手第一阶段的开发工作？