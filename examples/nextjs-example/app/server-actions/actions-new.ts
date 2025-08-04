/**
 * Server Actions 示例 - 展示新架构的服务端日志使用
 */

'use server';

import { logger } from '@/lib/server-logger';

export async function createUserNew(formData: FormData) {
  // 🚀 新架构：使用服务端日志器的模块功能
  const actionLogger = logger.forModule('server-actions');

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  actionLogger.info('开始创建用户', {
    action: 'createUser',
    name,
    email,
    timestamp: new Date().toISOString(),
  });

  try {
    // 模拟用户创建逻辑
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 模拟验证
    if (!name || !email) {
      throw new Error('姓名和邮箱都是必填项');
    }

    if (!email.includes('@')) {
      throw new Error('邮箱格式不正确');
    }

    const user = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      createdAt: new Date().toISOString(),
    };

    actionLogger.info('用户创建成功', {
      action: 'createUser',
      userId: user.id,
      name: user.name,
      email: user.email,
      success: true
    });

    return { success: true, user };
  } catch (error) {
    actionLogger.error('用户创建失败', {
      action: 'createUser',
      name,
      email,
      error: error instanceof Error ? error.message : String(error),
      success: false
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : '创建用户时发生未知错误',
    };
  }
}

export async function deleteUserNew(userId: string) {
  const actionLogger = logger.forModule('server-actions');

  actionLogger.info('开始删除用户', {
    action: 'deleteUser',
    userId,
    timestamp: new Date().toISOString(),
  });

  try {
    // 模拟删除逻辑
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!userId) {
      throw new Error('用户ID不能为空');
    }

    actionLogger.info('用户删除成功', {
      action: 'deleteUser',
      userId,
      success: true
    });

    return { success: true };
  } catch (error) {
    actionLogger.error('用户删除失败', {
      action: 'deleteUser',
      userId,
      error: error instanceof Error ? error.message : String(error),
      success: false
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : '删除用户时发生未知错误',
    };
  }
}

export async function fetchDataDemo() {
  const actionLogger = logger.forModule('data-fetch');
  
  actionLogger.info('开始获取演示数据', {
    action: 'fetchDataDemo',
    timestamp: new Date().toISOString()
  });

  try {
    // 模拟数据库查询
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const data = {
      items: [
        { id: 1, name: '项目A', status: 'active' },
        { id: 2, name: '项目B', status: 'pending' },
        { id: 3, name: '项目C', status: 'completed' }
      ],
      total: 3,
      timestamp: new Date().toISOString()
    };

    actionLogger.info('数据获取成功', {
      action: 'fetchDataDemo',
      itemCount: data.items.length,
      success: true
    });

    return { success: true, data };
    
  } catch (error) {
    actionLogger.error('数据获取失败', {
      action: 'fetchDataDemo',
      error: error instanceof Error ? error.message : String(error),
      success: false
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : '获取数据时发生错误'
    };
  }
}
