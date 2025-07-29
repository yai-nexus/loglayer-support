# SLS 结构化字段上报方案建议

## 字段分析与重要性评估

基于项目当前的日志上报实现和SLS结构化字段示例，以下是各字段的分析和建议：

### 🔴 必需字段（高优先级）

#### 1. `level` - 日志级别
- **重要性**: ⭐⭐⭐⭐⭐
- **当前状态**: ✅ 已实现
- **用途**: 日志过滤、告警配置、问题排查
- **实现位置**: `convertLogToSlsItem()` 函数中已包含

#### 2. `app_name` - 应用名称
- **重要性**: ⭐⭐⭐⭐⭐
- **当前状态**: ✅ 已实现
- **用途**: 多应用环境下的日志区分
- **实现位置**: `server-transport.ts` 中已配置

#### 3. `datetime` - 时间戳
- **重要性**: ⭐⭐⭐⭐⭐
- **当前状态**: ✅ 已实现
- **用途**: 时间序列分析、问题定位
- **实现位置**: SLS 标准时间字段 `__time__`

#### 4. `hostname` - 主机名
- **重要性**: ⭐⭐⭐⭐
- **当前状态**: ✅ 已实现
- **用途**: 分布式环境下的实例识别
- **实现位置**: `server-transport.ts` 中已获取

#### 5. `__pack_id__` - 日志上下文标识 🆕
- **重要性**: ⭐⭐⭐⭐⭐
- **当前状态**: ❌ 未实现
- **用途**: 关联同一上下文的日志，支持上下文查询
- **格式**: `上下文前缀-日志组ID`，如 `5FA51423DDB54FDA-1E3`
- **特性**:
  - 同一进程使用相同的上下文前缀
  - 日志组ID递增，便于追踪日志序列
  - 支持SLS控制台的上下文浏览功能

### 🟡 推荐字段（中优先级）

#### 6. `environment` - 环境标识
- **重要性**: ⭐⭐⭐⭐
- **当前状态**: ❌ 未实现
- **用途**: 区分开发/测试/生产环境
- **建议**: 从环境变量 `NODE_ENV` 或 `ENVIRONMENT` 获取

#### 7. `version` - 应用版本
- **重要性**: ⭐⭐⭐⭐
- **当前状态**: ❌ 未实现
- **用途**: 版本发布问题追踪、回滚决策
- **建议**: 从 `package.json` 或环境变量获取

#### 8. `category` - 日志分类
- **重要性**: ⭐⭐⭐
- **当前状态**: ❌ 未实现
- **用途**: 业务模块分类（如 api、database、auth）
- **建议**: 基于 logger 名称或上下文自动分类

#### 9. `host_ip` - 主机IP
- **重要性**: ⭐⭐⭐
- **当前状态**: ❌ 未实现
- **用途**: 网络问题排查、负载均衡分析
- **建议**: 获取本机IP地址

### 🟢 可选字段（低优先级）

#### 10. `thread` - 线程信息
- **重要性**: ⭐⭐
- **当前状态**: ❌ 未实现
- **用途**: Node.js 中意义有限（单线程）
- **建议**: 可用进程ID (PID) 替代，已在 `server-transport.ts` 中实现

#### 11. `logger` - 日志器名称
- **重要性**: ⭐⭐⭐
- **当前状态**: ❌ 未实现
- **用途**: 代码模块追踪
- **建议**: 添加 logger 实例名称

## PackID 机制详解

### 工作原理
PackID 格式为 `上下文前缀-日志组ID`，例如 `5FA51423DDB54FDA-1E3`：
- **上下文前缀**: 由大写十六进制数字组成，同一进程内保持不变
- **日志组ID**: 递增的十六进制数字，标识同一上下文内的不同日志组

### 生成策略
- **一个进程一个PackID生成器**: 确保同一进程的所有日志具有相同的上下文前缀
- **批量日志共享组ID**: 同一批次发送的日志使用相同的日志组ID
- **跨批次递增**: 不同批次的日志组ID自动递增

### 上下文查询优势
- 在SLS控制台可直接点击"上下文浏览"查看相关日志
- 自动关联同一请求/事务的所有日志
- 支持时间序列的日志追踪

## 实现方案

### 阶段一：添加PackID支持（立即实施）

```typescript
// 新增 PackID 生成器类
class PackIdGenerator {
  private packIdPrefix: string;
  private batchId: number = 0;

  constructor() {
    this.packIdPrefix = this.generatePackIdPrefix();
  }

  generateNewPackId(): string {
    return `${this.packIdPrefix}-${(++this.batchId).toString(16).toUpperCase()}`;
  }

  private generatePackIdPrefix(): string {
    const crypto = require('crypto');
    const os = require('os');

    const input = `${os.hostname()}-${process.pid}-${Date.now()}`;
    return crypto.createHash('md5').update(input).digest('hex').toUpperCase();
  }
}

// 在 SlsTransport 中集成
export class SlsTransport extends LoggerlessTransport {
  private packIdGenerator: PackIdGenerator;

  constructor(config: SlsTransportConfig) {
    super(config);
    this.packIdGenerator = new PackIdGenerator(); // 每个进程一个生成器
  }

  private async sendLogs(logs: SlsLogItem[]): Promise<void> {
    const packId = this.packIdGenerator.generateNewPackId();

    // 将 packId 添加到 LogTags 中
    const logTags = [
      { key: '__pack_id__', value: packId }
    ];

    await this.restClient.putLogs(logs, logTags);
  }
}
```

### 阶段二：补充其他必需字段

```typescript
// 在 convertLogToSlsItem 函数中添加
export function convertLogToSlsItem(logData: {
  level: LogLevelType;
  message: string;
  time: Date;
  context: Record<string, unknown>;
  err?: Error;
}): SlsLogItem {
  const contents: SlsLogContent[] = [
    { key: 'level', value: logData.level },
    { key: 'message', value: logData.message },

    // 新增必需字段
    { key: 'environment', value: process.env.NODE_ENV || 'unknown' },
    { key: 'version', value: process.env.APP_VERSION || getPackageVersion() },
    { key: 'host_ip', value: getLocalIP() },
  ];

  // ... 其他逻辑
}
```

### 阶段三：增强字段配置（后续优化）

```typescript
// 新增配置接口
export interface SlsFieldConfig {
  enablePackId?: boolean;           // 是否启用PackID
  includeEnvironment?: boolean;
  includeVersion?: boolean;
  includeHostIP?: boolean;
  includeCategory?: boolean;
  includeLogger?: boolean;
  customFields?: Record<string, string>;
}

// 在 SlsTransportConfig 中添加
export interface SlsTransportConfig {
  // ... 现有配置
  fields?: SlsFieldConfig;
}
```

### 阶段四：动态字段映射（高级功能）

```typescript
// 支持字段映射和过滤
export interface SlsFieldMapping {
  [key: string]: {
    source: string | (() => string);
    required?: boolean;
    transform?: (value: any) => string;
  };
}
```

## 配置建议

### 环境变量配置
```bash
# 必需配置
export NODE_ENV=production
export APP_VERSION=1.2.3
export APP_NAME=my-application

# PackID 配置
export SLS_ENABLE_PACK_ID=true

# 可选配置
export LOG_CATEGORY_MAPPING=api:API,db:Database,auth:Authentication
export INCLUDE_HOST_IP=true
export INCLUDE_LOGGER_NAME=true
```

### 代码配置示例
```typescript
const slsTransport = new SlsTransport({
  // ... 现有配置
  fields: {
    enablePackId: true,              // 启用PackID支持
    includeEnvironment: true,
    includeVersion: true,
    includeHostIP: true,
    includeCategory: true,
    customFields: {
      service: 'user-service',
      region: 'us-west-2'
    }
  }
});
```

## 实施优先级

### 🚀 第一优先级（本周完成）
1. ✅ `level` - 已完成
2. ✅ `app_name` - 已完成
3. ✅ `datetime` - 已完成
4. ✅ `hostname` - 已完成
5. ❌ `__pack_id__` - **需要添加（最高优先级）**

### 🎯 第二优先级（下周完成）
6. ❌ `environment` - **需要添加**
7. ❌ `version` - **需要添加**
8. ❌ `host_ip` - **需要添加**
9. ❌ `category` - **需要添加**

### 📋 第三优先级（后续迭代）
10. ❌ `logger` - 可选
11. ❌ `thread` - 使用PID替代

## 性能考虑

1. **PackID生成成本**: PackID生成器初始化一次，后续生成成本极低
2. **字段获取成本**: `hostname` 和 `host_ip` 获取有IO成本，建议缓存
3. **字段数量**: 建议控制在15个字段以内，避免影响传输性能
4. **动态字段**: 避免在热路径中进行复杂计算
5. **批量发送**: PackID机制天然支持批量发送，提升传输效率

## 监控建议

1. **PackID完整性**: 监控PackID的生成和传输成功率
2. **上下文关联**: 监控同一上下文的日志是否正确关联
3. **字段完整性**: 监控必需字段的缺失率
4. **字段长度**: 监控字段值长度，避免超出SLS限制
5. **上报成功率**: 监控因字段问题导致的上报失败

## PackID 使用场景

### 典型应用场景
1. **HTTP请求追踪**: 同一请求的所有日志共享PackID
2. **数据库事务**: 事务内的所有操作日志关联
3. **异步任务**: 任务执行过程中的所有日志串联
4. **错误排查**: 快速定位错误前后的相关日志

### 最佳实践
1. **进程级别**: 每个进程使用独立的PackID生成器
2. **批量发送**: 同一批次的日志使用相同的日志组ID
3. **上下文传递**: 在微服务间传递PackID前缀，保持上下文连续性

## 总结

**PackID机制是SLS日志上下文查询的核心功能**，建议作为最高优先级实现。结合其他结构化字段，将显著提升：

1. **问题排查效率**: 一键查看相关日志上下文
2. **系统可观测性**: 完整的请求链路追踪
3. **运维体验**: 在SLS控制台直接使用上下文浏览功能

当前项目已具备良好的日志基础，添加PackID支持后将具备企业级的日志分析能力。
