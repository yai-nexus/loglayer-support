'use server';

import { createNextjsServerLogger } from '@yai-loglayer/next/server-only';

// 创建专门用于 Server Actions 的日志器实例
let actionLogger: any = null;

async function getActionLogger() {
  if (!actionLogger) {
    actionLogger = await createNextjsServerLogger({
      appName: 'server',
      environment: (process.env.NODE_ENV as any) || 'development',
      level: 'debug',
      enableFileLogging: true,
      logDir: './logs',
      outputs: {
        console: { enabled: true },
        file: { enabled: true, path: './logs/server.log' },
      },
    });
  }
  return actionLogger;
}

// 简单的用户数据存储（演示用）
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt?: string;
}

const users = new Map<string, User>();

/**
 * 创建用户 - Server Action
 */
export async function createUser(formData: FormData) {
  const startTime = Date.now();
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const logger = await getActionLogger();

  logger.info('开始创建用户', {
    name,
    email,
    action: 'createUser',
  });

  try {
    // 验证输入
    if (!name || !email) {
      logger.warn('创建用户失败：缺少必要字段', { name, email });
      return { success: false, error: '姓名和邮箱都是必需的' };
    }

    // 检查邮箱是否已存在
    for (const user of users.values()) {
      if (user.email === email) {
        logger.warn('创建用户失败：邮箱已存在', { email });
        return { success: false, error: '邮箱已存在' };
      }
    }

    // 模拟数据库操作延迟
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 创建用户
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name,
      email,
      createdAt: new Date().toISOString(),
    };

    // 保存用户
    users.set(user.id, user);

    const duration = Date.now() - startTime;
    logger.info('用户创建成功', {
      userId: user.id,
      name: user.name,
      email: user.email,
      duration: `${duration}ms`,
      action: 'createUser',
    });

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('创建用户时发生错误', {
      name,
      email,
      error: (error as Error).message,
      duration: `${duration}ms`,
      action: 'createUser',
    });

    return { success: false, error: '创建用户时发生内部错误' };
  }
}

/**
 * 获取所有用户
 */
export async function getUsers() {
  const logger = await getActionLogger();
  logger.debug('获取用户列表', {
    count: users.size,
    action: 'getUsers',
  });

  return Array.from(users.values());
}

/**
 * 删除用户
 */
export async function deleteUser(formData: FormData) {
  const id = formData.get('id') as string;
  const logger = await getActionLogger();

  logger.info('开始删除用户', {
    userId: id,
    action: 'deleteUser',
  });

  try {
    if (!id) {
      logger.warn('删除用户失败：缺少用户ID', { userId: id });
      return { success: false, error: '用户ID是必需的' };
    }

    const user = users.get(id);
    if (!user) {
      logger.warn('删除用户失败：用户不存在', { userId: id });
      return { success: false, error: '用户不存在' };
    }

    users.delete(id);

    logger.info('用户删除成功', {
      userId: id,
      userName: user.name,
      action: 'deleteUser',
    });

    return { success: true };
  } catch (error) {
    logger.error('删除用户时发生错误', {
      userId: id,
      error: (error as Error).message,
      action: 'deleteUser',
    });

    return { success: false, error: '删除用户时发生内部错误' };
  }
}
