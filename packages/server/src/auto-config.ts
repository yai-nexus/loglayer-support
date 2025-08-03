/**
 * 自动配置系统 - 简化业务接入的配置接口
 */

// ==================== 基础类型定义 ====================

/**
 * 自动模式类型
 */
export type AutoMode = 'auto' | boolean;

/**
 * 环境类型
 */
export type Environment = 'development' | 'production' | 'test' | 'staging' | 'auto';

/**
 * 应用配置
 */
export interface AppConfig {
  /** 应用名称 */
  name: string;
  /** 环境类型，'auto' 表示自动检测 */
  environment?: Environment;
  /** 应用版本，'auto' 表示从 package.json 读取 */
  version?: string | 'auto';
  /** 服务名称，用于日志标识 */
  service?: string;
}

/**
 * 控制台输出配置
 */
export interface ConsoleOutputConfig {
  /** 是否启用，'auto' 表示开发环境自动启用 */
  enabled?: AutoMode;
  /** 输出格式 */
  format?: 'simple' | 'json' | 'pretty';
  /** 颜色支持 */
  colors?: AutoMode;
}

/**
 * 文件输出配置
 */
export interface FileOutputConfig {
  /** 是否启用 */
  enabled?: boolean;
  /** 文件路径，'auto' 表示自动检测项目根目录 */
  path?: string | 'auto';
  /** 文件名 */
  filename?: string;
  /** 日志轮转配置 */
  rotation?: {
    maxSize?: string;
    maxFiles?: number;
    datePattern?: string;
  };
}

/**
 * SLS 输出配置
 */
export interface SlsOutputConfig {
  /** 是否启用，'auto' 表示根据环境变量自动启用 */
  enabled?: AutoMode;
  /** 配置来源，'env' 表示从环境变量读取 */
  config?: 'env' | SlsCredentials;
  /** 主题 */
  topic?: string;
  /** 来源标识 */
  source?: string;
}

/**
 * SLS 凭证配置
 */
export interface SlsCredentials {
  endpoint: string;
  accessKeyId: string;
  accessKeySecret: string;
  project: string;
  logstore: string;
  region?: string;
}

/**
 * 输出配置集合
 */
export interface OutputsConfig {
  /** 控制台输出 */
  console?: ConsoleOutputConfig;
  /** 文件输出 */
  file?: FileOutputConfig;
  /** SLS 输出 */
  sls?: SlsOutputConfig;
}

/**
 * 功能特性配置
 */
export interface FeaturesConfig {
  /** 调试模式 */
  debug?: {
    enabled?: AutoMode;
    verbose?: boolean;
  };
}

/**
 * 自动日志器配置
 */
export interface AutoLoggerConfig {
  /** 应用配置 */
  app: AppConfig;
  /** 输出配置 */
  outputs?: OutputsConfig;
  /** 功能特性 */
  features?: FeaturesConfig;
  /** 日志级别 */
  level?: string | 'auto';
}

// ==================== 解析后的配置类型 ====================

/**
 * 解析后的应用配置
 */
export interface ResolvedAppConfig {
  name: string;
  environment: Exclude<Environment, 'auto'>;
  version: string;
  service: string;
}

/**
 * 解析后的输出配置
 */
export interface ResolvedOutputsConfig {
  console: {
    enabled: boolean;
    format: 'simple' | 'json' | 'pretty';
    colors: boolean;
  };
  file: {
    enabled: boolean;
    path: string;
    filename: string;
    rotation?: {
      maxSize: string;
      maxFiles: number;
      datePattern?: string;
    };
  };
  sls: {
    enabled: boolean;
    credentials?: SlsCredentials;
    topic: string;
    source: string;
  };
}

/**
 * 解析后的完整配置
 */
export interface ResolvedLoggerConfig {
  app: ResolvedAppConfig;
  outputs: ResolvedOutputsConfig;
  features: Required<FeaturesConfig>;
  level: string;
}

// ==================== 默认配置 ====================

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: Partial<AutoLoggerConfig> = {
  outputs: {
    console: {
      enabled: 'auto',
      format: 'pretty',
      colors: 'auto'
    },
    file: {
      enabled: true,
      path: 'auto',
      filename: 'app.log',
      rotation: {
        maxSize: '10MB',
        maxFiles: 5
      }
    },
    sls: {
      enabled: 'auto',
      config: 'env',
      topic: 'loglayer',
      source: 'nodejs'
    }
  },
  features: {
    debug: {
      enabled: 'auto',
      verbose: false
    }
  },
  level: 'auto'
};

// ==================== 环境变量映射 ====================

/**
 * 环境变量映射配置
 */
export const ENV_MAPPINGS = {
  // 应用配置
  APP_NAME: ['NEXT_PUBLIC_SERVICE_NAME', 'SERVICE_NAME', 'APP_NAME'],
  APP_VERSION: ['NEXT_PUBLIC_APP_VERSION', 'APP_VERSION', 'npm_package_version'],
  NODE_ENV: ['NODE_ENV'],
  
  // SLS 配置
  SLS_ENABLED: ['NEXT_PUBLIC_SLS_ENABLED', 'SLS_ENABLED'],
  SLS_ENDPOINT: ['NEXT_PUBLIC_SLS_ENDPOINT', 'SLS_ENDPOINT'],
  SLS_ACCESS_KEY_ID: ['NEXT_PUBLIC_SLS_ACCESS_KEY_ID', 'SLS_ACCESS_KEY_ID'],
  SLS_ACCESS_KEY_SECRET: ['NEXT_PUBLIC_SLS_ACCESS_KEY_SECRET', 'SLS_ACCESS_KEY_SECRET'],
  SLS_PROJECT: ['NEXT_PUBLIC_SLS_PROJECT', 'SLS_PROJECT'],
  SLS_LOGSTORE: ['NEXT_PUBLIC_SLS_LOGSTORE', 'SLS_LOGSTORE'],
  SLS_REGION: ['NEXT_PUBLIC_SLS_REGION', 'SLS_REGION'],
  
  // 日志配置
  LOG_LEVEL: ['LOG_LEVEL', 'LOGLEVEL'],
  LOG_DIR: ['LOG_DIR', 'LOGS_DIR'],
  LOG_FILE: ['LOG_FILE', 'LOG_FILENAME']
} as const;

// ==================== 配置模板 ====================

/**
 * 项目类型特定的配置模板
 */
export const CONFIG_TEMPLATES = {
  nextjs: {
    app: {
      service: 'nextjs-app'
    },
    outputs: {
      file: {
        filename: 'nextjs.log'
      }
    }
  },
  express: {
    app: {
      service: 'express-app'
    },
    outputs: {
      file: {
        filename: 'express.log'
      }
    }
  },
  generic: {
    app: {
      service: 'nodejs-app'
    },
    outputs: {
      file: {
        filename: 'app.log'
      }
    }
  }
} as const;

export type ProjectType = keyof typeof CONFIG_TEMPLATES;
