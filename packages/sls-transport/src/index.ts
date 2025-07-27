/**
 * @yai-loglayer/sls-transport
 * 阿里云 SLS Transport for LogLayer
 */

export { SlsTransport } from './SlsTransport';
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
  createInternalConfig,
  convertLogToSlsItem,
  calculateRetryDelay,
  delay,
  extractErrorMessage,
  isRetriableError,
  getCurrentTimestamp,
  formatBytes
} from './utils';