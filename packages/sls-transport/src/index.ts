/**
 * @yai-loglayer/sls-transport
 * 阿里云 SLS Transport for LogLayer
 */

export { SlsTransport } from './SlsTransport';

export {
  createSlsConfigFromEnv,
  checkSlsConfig,
  getEnvDiagnosticInfo,
  compareEnvConfigs,
  type EnvDiagnosticInfo
} from './config';

export { configureInternalLogger } from './logger';

export type {
  SlsTransportConfig,
  SlsTransportInternalConfig,
  SlsLogItem,
  SlsLogContent,
  SlsLogGroup,
  SlsLogTag,
  SlsFieldConfig,
  RetryConfig,
  TransportStats
} from './types';

export {
  validateSlsConfig,
  convertLogToSlsItem,
  calculateRetryDelay,
  delay,
  extractErrorMessage,
  isRetriableError,
  getCurrentTimestamp,
  formatBytes,
  getHostname,
  getLocalIP,
  getAppVersion,
  getEnvironment,
  inferCategory,
  extractTraceId,
  extractSpanId,
  getTraceIdForLog,
  getSpanIdForLog
} from './utils';

export {
  PackIdGenerator,
  getGlobalPackIdGenerator,
  resetGlobalPackIdGenerator,
  generatePackId
} from './PackIdGenerator';

export {
  TraceIdGenerator,
  traceContext,
  generateTraceId,
  generateSpanId,
  getOrGenerateTraceId,
  getOrGenerateSpanId
} from './TraceIdGenerator';

export {
  OpenTelemetryIntegration
} from './OpenTelemetryIntegration';