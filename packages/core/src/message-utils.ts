/**
 * 消息处理工具函数
 * 
 * 统一处理 LogLayer messages 数组的序列化逻辑，
 * 避免在多个 transport 中重复实现相同的代码
 */

/**
 * 安全地序列化消息数组
 * 
 * 将 LogLayer 的 messages 数组转换为单个字符串，
 * 正确处理字符串、对象和其他类型，避免 [object Object] 问题
 * 
 * @param messages - LogLayer 传递的消息数组
 * @returns 序列化后的消息字符串
 * 
 * @example
 * ```typescript
 * serializeMessages(['Hello', { user: 'John' }, 123])
 * // 返回: 'Hello {"user":"John"} 123'
 * 
 * serializeMessages(['Error occurred', new Error('Failed')])
 * // 返回: 'Error occurred Error: Failed'
 * ```
 */
export function serializeMessages(messages: any[]): string {
  return messages.map(msg => {
    if (typeof msg === 'string') {
      return msg
    } else if (typeof msg === 'object' && msg !== null) {
      // 特殊处理 Error 对象
      if (msg instanceof Error) {
        return msg.toString()
      }
      // 其他对象序列化为 JSON
      try {
        return JSON.stringify(msg)
      } catch (error) {
        // 处理循环引用等序列化错误
        return '[Unserializable Object]'
      }
    } else {
      return String(msg)
    }
  }).join(' ')
}

/**
 * 安全地序列化单个消息
 * 
 * @param message - 单个消息
 * @returns 序列化后的字符串
 */
export function serializeMessage(message: any): string {
  return serializeMessages([message])
}

/**
 * 检查消息数组是否包含对象
 * 
 * @param messages - 消息数组
 * @returns 是否包含对象
 */
export function hasObjectMessages(messages: any[]): boolean {
  return messages.some(msg => 
    typeof msg === 'object' && msg !== null && typeof msg !== 'string'
  )
}

/**
 * 分离字符串消息和对象消息
 * 
 * @param messages - 消息数组
 * @returns 分离后的结果
 */
export function separateMessages(messages: any[]): {
  stringMessages: string[]
  objectMessages: any[]
  serializedMessage: string
} {
  const stringMessages: string[] = []
  const objectMessages: any[] = []
  
  messages.forEach(msg => {
    if (typeof msg === 'string') {
      stringMessages.push(msg)
    } else {
      objectMessages.push(msg)
    }
  })
  
  return {
    stringMessages,
    objectMessages,
    serializedMessage: serializeMessages(messages)
  }
}
