# 关于将 `loglayer-support` 重构为 Monorepo 架构的综合报告与提案

## 1. 背景与现状

随着 `v0.6.0-alpha.1` 版本的发布，`loglayer-support` 项目取得了阶段性的成功。我们通过引入 `createBrowserLogger`、`createServerLogger` 和 `createLogReceiver` 等全新的框架预设 API，极大地提升了库的易用性，从一个需要手动配置的底层库，向“开箱即用”的日志解决方案迈出了坚实的一步。

当前，所有的功能增强代码（如浏览器、服务端、接收器的实现）都集中在 `src/frameworks` 目录下。这种单包（Single Package）模式在项目初期是合适的，但随着功能的不断丰富和深化，其局限性也日益凸显：

1.  **耦合度高**：所有环境（浏览器、Node.js）的代码都打包在一起，用户无论使用哪种功能，都必须安装完整的包，增加了不必要的体积。
2.  **扩展性受限**：未来若要支持更多框架（如 Express, SvelteKit）或添加新功能插件（如 IndexedDB 输出器），继续在 `src/frameworks` 中堆叠代码将导致架构臃肿，难以维护。
3.  **定位模糊**：单包模式未能清晰地在架构层面体现出我们项目的核心价值——即作为 `loglayer` 的上层应用框架。

因此，为了支撑项目的长期发展，并为未来的功能扩展和社区化运营奠定基础，我们有必要对当前架构进行一次前瞻性的升级。

## 2. `loglayer` 生态系统分析与项目定位

在讨论架构升级前，必须清晰地定义我们与核心依赖 `loglayer` 的关系，以避免功能重叠。

经过深入分析，我们得出以下结论：

*   **`loglayer` 的定位是“日志中间层”**：它的核心价值在于提供统一的日志 API 和一个可插拔的“传输器 (Transport)”及“插件 (Plugin)”生态。它解决了“如何将日志发送到具体目标（如 Pino, Datadog）”的问题。本质上，`loglayer` 提供的是一套灵活的**积木块**。

*   **`loglayer` 生态的缺失环节**：`loglayer` 官方并未提供针对现代 Web 应用（如 Next.js）的、端到端的、高度集成的**日志解决方案**。例如，它没有官方的、集成了会话管理、本地缓存、批量上报的浏览器日志方案。

*   **`loglayer-support` 的核心价值**：我们的项目恰好填补了这一空白。我们利用 `loglayer` 提供的“积木块”，结合业界最佳实践，为开发者提供了可以直接使用的“模型成品”。**我们不是在重新发明轮子，而是在 `loglayer` 之上构建了一个更高层次的“企业级日志应用框架”。**

基于此定位，我们与 `loglayer` 不存在竞争，而是完美的互补与增强关系。这一定位应该在我们的项目架构中得到明确体现。

## 3. Monorepo 架构提案

为了更好地实现我们的项目定位，并解决当前单包模式的弊端，**我们正式提案：将 `loglayer-support` 重构为 Monorepo 架构。**

将核心逻辑与针对不同环境的插件/适配器拆分为独立但统一管理的包，将带来以下核心收益：

1.  **明确的关注点分离**：
    *   `@loglayer-support/core`: 存放类型定义、配置验证等与环境无关的核心逻辑。
    *   `@loglayer-support/browser`: 浏览器端日志解决方案。
    *   `@loglayer-support/server`: 服务端日志管理方案。
    *   用户可以按需取用，项目结构清晰，职责分明。

2.  **绝佳的用户体验与可扩展性**：
    *   **按需安装**：前端开发者只需安装 `@loglayer-support/browser`，无需下载任何 Node.js 相关的代码，减小应用体积。
    *   **插件化未来**：未来新增的功能（如 `@loglayer-support/plugin-indexeddb`）或框架适配（如 `@loglayer-support/express`）都可以作为新包独立开发、测试和发布，完美支持项目的长期演进。

3.  **简化的开发与维护**：
    *   **统一的工具链**：所有包共享同一套构建、测试、Lint 和发布流程，由 `Turborepo` 等工具高效管理。
    *   **原子化提交**：对核心 API 的修改可以和所有依赖它的包的适配在同一个 Pull Request 中完成，保证了重构的安全性和一致性。
    *   **无缝的本地开发**：在 Monorepo 内部，各包之间通过 `workspace:` 协议本地引用，修改可以立即生效，无需发布到 npm，极大提升开发效率。

## 4. 建议的 Monorepo 包结构

我们建议采用 `pnpm workspaces` 进行管理，并使用 `@loglayer-support` 作为统一的 npm scope。

```
loglayer-support/
├── packages/
│   ├── core/              # @loglayer-support/core: 通用类型、配置、核心工具函数
│   ├── browser/           # @loglayer-support/browser: createBrowserLogger 实现
│   ├── server/            # @loglayer-support/server: createServerLogger 实现
│   └── receiver/          # @loglayer-support/receiver: createLogReceiver 实现
│
├── examples/
│   ├── nextjs/            # 示例项目，其 package.json 将依赖 workspace:*
│   └── ...
│
├── docs/                  # 文档
├── package.json           # 根 package.json，管理 workspaces 和全局开发依赖
└── pnpm-workspace.yaml
```

## 5. 实施路线图

建议分三步完成本次重构：

### **第一阶段：基础架构搭建**

*   **目标**：建立 Monorepo 的骨架。
*   **任务**:
    1.  初始化 `pnpm workspaces`。
    2.  引入并配置 `Turborepo` 以优化任务执行（`build`, `test`, `lint`）。
    3.  引入并配置 `Changesets` 以实现多包的版本管理和发布。
    4.  创建 `packages/` 目录和上述规划的核心包目录结构。

### **第二阶段：代码迁移与拆分**

*   **目标**：将现有代码平滑迁移到新的包结构中。
*   **任务**:
    1.  将 `src/` 目录下的通用逻辑迁移到 `packages/core`。
    2.  将 `src/frameworks/browser` 相关代码迁移到 `packages/browser`。
    3.  同理，迁移 `server` 和 `receiver` 的代码。
    4.  重构各包内部的 `package.json`，正确设置包名、依赖关系（使用 `workspace:*` 协议引用内部包）和导出入口。
    5.  调整 TypeScript 的 `tsconfig.json` 以支持 Monorepo 的路径引用。

### **第三阶段：工具链与 CI/CD 适配**

*   **目标**：确保开发和发布流程顺畅。
*   **任务**:
    1.  更新根 `package.json` 中的 `scripts`，使其通过 `turbo run <task>` 执行。
    2.  更新 `examples/` 中的示例项目，使其 `package.json` 依赖新的 `@loglayer-support/*` 包。
    3.  修改 CI/CD (GitHub Actions) 工作流，使其能够利用 `Turborepo` 的缓存和 `Changesets` 的发布机制。

## 6. 结论

将 `loglayer-support` 重构为 Monorepo 架构，是一项具有战略意义的投资。它不仅能优化当前的代码结构、提升用户体验，更能厘清我们的项目定位，为未来的功能扩展、社区参与和长期维护性奠定坚实、专业的基础。

建议团队就此方案进行深入讨论，并规划启动第一阶段的工作。 