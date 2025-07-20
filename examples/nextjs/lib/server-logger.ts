/**
 * 服务端专用日志功能
 * 在 API 路由中使用，支持文件输出到项目根目录的 logs 目录
 */

import { detectEnvironment, getEffectiveOutputs, LogLayerWrapper } from '../../../src'
import { CoreServerLogger } from '../../../src/transports'
import type { LoggerConfig, ServerOutput } from '../../../src/types'

// 创建自定义配置，使用相对路径指向项目根目录的 logs 目录
const env = detectEnvironment();

// 获取项目根目录路径（相对于当前工作目录）
const getProjectLogsDir = () => {
  // 如果当前工作目录已经是项目根目录，直接使用 ./logs
  // 如果在 examples/nextjs 目录下运行，使用 ../../logs
  const cwd = process.cwd();
  if (cwd.endsWith('examples/nextjs')) {
    return '../../logs';
  } else {
    return './logs';
  }
};

const logsDir = getProjectLogsDir();

const serverConfig: LoggerConfig = {
  level: {
    default: 'debug',
    loggers: {
      'api': 'info',
      'database': 'debug'
    }
  },
  server: {
    outputs: [
      { type: 'stdout' }, // 控制台输出
      {
        type: 'file',
        config: {
          dir: logsDir,  // 动态计算的相对路径
          filename: 'nextjs.log'  // 与示例名称一致
        }
      }
    ]
  },
  client: {
    outputs: [
      { type: 'console' }
    ]
  }
}

// 创建服务端 logger - 使用自定义配置
console.log('[DEBUG] Creating server logger with custom config...');
console.log('[DEBUG] Current working directory:', process.cwd());
console.log('[DEBUG] Logs directory:', logsDir);

const outputs = getEffectiveOutputs(serverConfig, env);
const serverOutputs = outputs.filter(output =>
  output.type === 'stdout' || output.type === 'file' || output.type === 'sls' || output.type === 'http'
) as ServerOutput[];
const coreLogger = new CoreServerLogger(serverOutputs);
export const serverLogger = new LogLayerWrapper(coreLogger, 'nextjs-server', serverConfig);

console.log('[DEBUG] Server logger created successfully');

// 记录 Next.js 应用启动日志
serverLogger.info('Next.js 应用启动', {
  environment: env.environment,
  nodeVersion: process.version,
  platform: process.platform,
  workingDirectory: process.cwd(),
  logsDirectory: logsDir,
  pid: process.pid
});

// 模块特定的 logger
export const apiLogger = serverLogger.forModule('api')
export const dbLogger = serverLogger.forModule('database')

// 兼容导出
export const logger = serverLogger