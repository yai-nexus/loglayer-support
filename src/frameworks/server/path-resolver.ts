/**
 * 服务端路径解析器
 * 负责解析项目根目录和日志目录路径
 */

import * as path from 'path'
import * as fs from 'fs'
import type { PathConfig } from '../server'

export class PathResolver {
  private readonly config: Required<PathConfig>

  constructor(config: PathConfig = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      logsDir: config.logsDir || './logs',
      autoDetectRoot: config.autoDetectRoot ?? true,
      pathStrategy: config.pathStrategy || 'auto'
    }
  }

  /**
   * 解析项目根目录
   */
  resolveProjectRoot(): string {
    if (!this.config.autoDetectRoot) {
      return this.config.projectRoot
    }

    // 自动检测项目根目录
    const cwd = process.cwd()
    
    // 检查是否在 examples/nextjs 等子目录中
    if (cwd.includes('examples/nextjs')) {
      // 向上查找到项目根目录
      let currentDir = cwd
      while (currentDir !== path.dirname(currentDir)) {
        const packageJsonPath = path.join(currentDir, 'package.json')
        if (fs.existsSync(packageJsonPath)) {
          try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
            // 检查是否是主项目的 package.json
            if (packageJson.name === 'loglayer-support' || packageJson.workspaces) {
              return currentDir
            }
          } catch {
            // 忽略解析错误，继续向上查找
          }
        }
        currentDir = path.dirname(currentDir)
      }
    }

    return cwd
  }

  /**
   * 解析日志目录
   */
  resolveLogsDir(): string {
    const projectRoot = this.resolveProjectRoot()
    
    switch (this.config.pathStrategy) {
      case 'absolute':
        return path.isAbsolute(this.config.logsDir) 
          ? this.config.logsDir
          : path.resolve(this.config.logsDir)
      
      case 'relative':
        return path.resolve(projectRoot, this.config.logsDir)
      
      case 'auto':
      default:
        if (path.isAbsolute(this.config.logsDir)) {
          return this.config.logsDir
        }
        return path.resolve(projectRoot, this.config.logsDir)
    }
  }

  /**
   * 确保日志目录存在
   */
  ensureLogsDir(): string {
    const logsDir = this.resolveLogsDir()
    
    try {
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true })
      }
      return logsDir
    } catch (error) {
      console.warn(`Failed to create logs directory ${logsDir}:`, error)
      // 回退到临时目录
      const tempLogsDir = path.join(require('os').tmpdir(), 'loglayer-logs')
      try {
        if (!fs.existsSync(tempLogsDir)) {
          fs.mkdirSync(tempLogsDir, { recursive: true })
        }
        return tempLogsDir
      } catch (tempError) {
        console.error('Failed to create temp logs directory:', tempError)
        throw new Error(`Cannot create logs directory: ${error.message}`)
      }
    }
  }

  /**
   * 解析文件路径
   */
  resolveFilePath(filename: string, subDir?: string): string {
    const logsDir = this.ensureLogsDir()
    const fullDir = subDir ? path.join(logsDir, subDir) : logsDir
    
    // 确保子目录存在
    if (subDir && !fs.existsSync(fullDir)) {
      try {
        fs.mkdirSync(fullDir, { recursive: true })
      } catch (error) {
        console.warn(`Failed to create subdirectory ${fullDir}:`, error)
        // 回退到主日志目录
        return path.join(logsDir, filename)
      }
    }
    
    return path.join(fullDir, filename)
  }

  /**
   * 获取配置信息
   */
  getConfig(): Required<PathConfig> {
    return { ...this.config }
  }

  /**
   * 获取解析结果
   */
  getResolvedPaths(): {
    projectRoot: string
    logsDir: string
    config: Required<PathConfig>
  } {
    return {
      projectRoot: this.resolveProjectRoot(),
      logsDir: this.resolveLogsDir(),
      config: this.getConfig()
    }
  }

  /**
   * 验证路径配置
   */
  validatePaths(): {
    valid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      const projectRoot = this.resolveProjectRoot()
      
      // 检查项目根目录是否存在
      if (!fs.existsSync(projectRoot)) {
        errors.push(`Project root directory does not exist: ${projectRoot}`)
      } else if (!fs.statSync(projectRoot).isDirectory()) {
        errors.push(`Project root is not a directory: ${projectRoot}`)
      }

      // 检查日志目录
      try {
        const logsDir = this.ensureLogsDir()
        
        // 检查写入权限
        const testFile = path.join(logsDir, '.write-test')
        try {
          fs.writeFileSync(testFile, 'test')
          fs.unlinkSync(testFile)
        } catch (writeError) {
          errors.push(`No write permission for logs directory: ${logsDir}`)
        }
      } catch (logsDirError) {
        errors.push(`Cannot create or access logs directory: ${logsDirError.message}`)
      }

      // 检查路径长度（Windows 限制）
      const logsDir = this.resolveLogsDir()
      if (process.platform === 'win32' && logsDir.length > 260) {
        warnings.push(`Logs directory path is very long (${logsDir.length} chars), may cause issues on Windows`)
      }

    } catch (error) {
      errors.push(`Path validation failed: ${error.message}`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 创建默认路径解析器
   */
  static createDefault(): PathResolver {
    return new PathResolver()
  }

  /**
   * 创建 Next.js 路径解析器
   */
  static createForNextjs(): PathResolver {
    return new PathResolver({
      autoDetectRoot: true,
      pathStrategy: 'auto',
      logsDir: './logs'
    })
  }

  /**
   * 创建 Express.js 路径解析器
   */
  static createForExpress(): PathResolver {
    return new PathResolver({
      autoDetectRoot: false,
      pathStrategy: 'relative',
      logsDir: './logs'
    })
  }
}
