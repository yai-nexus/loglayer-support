/**
 * LogLayer 基础使用示例 - 主入口
 * 
 * 这个文件是所有示例的统一入口点，按顺序运行所有示例
 */

import { configPresetsExample } from './details/config-presets.ts';
import { customConfigExample } from './details/custom-config.ts';
import { enhancedFeaturesExample } from './details/enhanced-features.ts';
import { productionConfigExample } from './details/production-config.ts';
import { multipleOutputsExample } from './details/multiple-outputs.ts';

/**
 * 运行所有示例
 */
async function runAllExamples() {
  try {
    // 按顺序运行所有示例
    await configPresetsExample();
    await customConfigExample();
    await enhancedFeaturesExample();
    await productionConfigExample();
    await multipleOutputsExample();
    
    console.log('\n✅ 所有示例执行完成');
  } catch (error) {
    console.error('❌ 示例执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

// 导出所有示例，以便单独引用
export {
  configPresetsExample,
  customConfigExample,
  enhancedFeaturesExample,
  productionConfigExample,
  multipleOutputsExample,
  runAllExamples
};
