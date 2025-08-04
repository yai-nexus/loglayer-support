/**
 * 服务端日志接收器导出
 */

export {
  createLogReceiverHandler,
  createOptionsHandler,
  type LogReceiverConfig,
  type LogReceiverHandler,
} from './handler';

export {
  createAutoApiRoute,
  createDefaultApiRoute,
  createProductionApiRoute,
  createDevelopmentApiRoute,
  createEnvironmentApiRoute,
  generateApiRouteFile,
  writeApiRouteFile,
  generateApiRouteCommand,
  type ApiRouteHandlers,
} from './auto-setup';
