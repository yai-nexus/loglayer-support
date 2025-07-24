/**
 * 会话管理器
 * 负责管理浏览器端的会话 ID
 */

import { generateSessionId, getSessionStorage } from './utils'

export class SessionManager {
  private sessionId: string
  private readonly storageKey: string

  constructor(customSessionId?: string, storageKey = 'log-session-id') {
    this.storageKey = storageKey
    
    if (customSessionId) {
      this.sessionId = customSessionId
      this.saveSessionId()
    } else {
      this.sessionId = this.getOrCreateSessionId()
    }
  }

  /**
   * 获取当前会话 ID
   */
  getSessionId(): string {
    return this.sessionId
  }

  /**
   * 设置新的会话 ID
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId
    this.saveSessionId()
  }

  /**
   * 生成新的会话 ID
   */
  renewSessionId(): string {
    this.sessionId = generateSessionId()
    this.saveSessionId()
    return this.sessionId
  }

  /**
   * 获取或创建会话 ID
   */
  private getOrCreateSessionId(): string {
    const storage = getSessionStorage()
    
    if (!storage) {
      // 如果没有 sessionStorage，生成临时会话 ID
      return generateSessionId()
    }

    try {
      let sessionId = storage.getItem(this.storageKey)
      
      if (!sessionId) {
        sessionId = generateSessionId()
        storage.setItem(this.storageKey, sessionId)
      }
      
      return sessionId
    } catch (error) {
      // 如果存储操作失败，返回临时会话 ID
      console.warn('Failed to access sessionStorage for session ID:', error)
      return generateSessionId()
    }
  }

  /**
   * 保存会话 ID 到存储
   */
  private saveSessionId(): void {
    const storage = getSessionStorage()
    
    if (!storage) {
      return
    }

    try {
      storage.setItem(this.storageKey, this.sessionId)
    } catch (error) {
      console.warn('Failed to save session ID to sessionStorage:', error)
    }
  }

  /**
   * 清除会话 ID
   */
  clearSessionId(): void {
    const storage = getSessionStorage()
    
    if (storage) {
      try {
        storage.removeItem(this.storageKey)
      } catch (error) {
        console.warn('Failed to clear session ID from sessionStorage:', error)
      }
    }
    
    this.sessionId = generateSessionId()
  }
}
