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
  formatBytes
} from './utils';