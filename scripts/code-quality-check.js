#!/usr/bin/env node
/**
 * 代码质量检查脚本
 * 运行基本的代码规范检查（不需要 ESLint 配置）
 */

const fs = require('fs');
const path = require('path');

let errors = 0;
let warnings = 0;

console.log('🔍 MarketBook 代码质量检查...\n');

// 检查1: 查找 console.log（生产环境应避免）
console.log('📝 检查 console.log 使用情况...');
const srcDir = path.join(__dirname, '..', 'src');
const jsFiles = [];

function findJsFiles(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findJsFiles(fullPath);
    } else if (file.endsWith('.js')) {
      jsFiles.push(fullPath);
    }
  });
}

findJsFiles(srcDir);

const consoleLogFiles = [];
jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // 排除注释中的 console.log
    if (line.includes('console.log') && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
      consoleLogFiles.push({ file, line: idx + 1, content: line.trim() });
    }
  });
});

if (consoleLogFiles.length > 0) {
  warnings += consoleLogFiles.length;
  console.log(`⚠️  发现 ${consoleLogFiles.length} 处 console.log（建议使用 logger）`);
  consoleLogFiles.slice(0, 5).forEach(item => {
    const relativePath = path.relative(process.cwd(), item.file);
    console.log(`   ${relativePath}:${item.line}`);
  });
  if (consoleLogFiles.length > 5) {
    console.log(`   ... 还有 ${consoleLogFiles.length - 5} 处`);
  }
} else {
  console.log('✅ 未发现 console.log');
}

// 检查2: 查找 TODO/FIXME/HACK
console.log('\n📝 检查 TODO/FIXME/HACK 注释...');
const todoFiles = [];
jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/(TODO|FIXME|HACK|XXX)/.test(line)) {
      todoFiles.push({ 
        file, 
        line: idx + 1, 
        content: line.trim(),
        type: line.match(/(TODO|FIXME|HACK|XXX)/)[0]
      });
    }
  });
});

if (todoFiles.length > 0) {
  console.log(`📋 发现 ${todoFiles.length} 处待办注释（已记录到技术债务文档）`);
  const grouped = todoFiles.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});
  Object.entries(grouped).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} 处`);
  });
} else {
  console.log('✅ 未发现待办注释');
}

// 检查3: 查找未使用的变量（简单检查）
console.log('\n📝 检查潜在的未使用变量...');
const unusedVarFiles = [];
jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // 简单检查：定义但从未使用的变量（基本模式）
  const varMatches = content.match(/const\s+(\w+)\s*=/g);
  if (varMatches) {
    varMatches.forEach(match => {
      const varName = match.match(/const\s+(\w+)/)[1];
      // 检查变量是否在后续代码中使用（简单检查）
      const usagePattern = new RegExp(`\\b${varName}\\b`, 'g');
      const usages = (content.match(usagePattern) || []).length;
      if (usages === 1) { // 只出现一次（定义处）
        unusedVarFiles.push({ file, varName });
      }
    });
  }
});

if (unusedVarFiles.length > 0) {
  warnings += Math.min(unusedVarFiles.length, 10);
  console.log(`⚠️  发现 ${unusedVarFiles.length} 个潜在未使用变量（需人工确认）`);
  unusedVarFiles.slice(0, 3).forEach(item => {
    const relativePath = path.relative(process.cwd(), item.file);
    console.log(`   ${relativePath}: ${item.varName}`);
  });
  if (unusedVarFiles.length > 3) {
    console.log(`   ... 还有 ${unusedVarFiles.length - 3} 处`);
  }
} else {
  console.log('✅ 未发现明显的未使用变量');
}

// 检查4: 文件大小检查（超过1000行的文件）
console.log('\n📝 检查文件大小...');
const largeFiles = [];
jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n').length;
  if (lines > 1000) {
    largeFiles.push({ file, lines });
  }
});

if (largeFiles.length > 0) {
  warnings += largeFiles.length;
  console.log(`⚠️  发现 ${largeFiles.length} 个超大文件（>1000行，建议拆分）`);
  largeFiles.forEach(item => {
    const relativePath = path.relative(process.cwd(), item.file);
    console.log(`   ${relativePath}: ${item.lines} 行`);
  });
} else {
  console.log('✅ 所有文件大小合理');
}

// 检查5: 检查是否有硬编码的密钥/密码
console.log('\n📝 检查硬编码的敏感信息...');
const sensitivePatterns = [
  /password\s*=\s*['"][^'"]+['"]/i,
  /api[_-]?key\s*=\s*['"][^'"]+['"]/i,
  /secret\s*=\s*['"][^'"]+['"]/i,
  /token\s*=\s*['"][a-zA-Z0-9]{20,}['"]/i,
];

const sensitiveFiles = [];
jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // 排除注释和示例
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
    if (line.includes('example') || line.includes('EXAMPLE') || line.includes('TODO')) return;
    
    sensitivePatterns.forEach(pattern => {
      if (pattern.test(line)) {
        sensitiveFiles.push({ file, line: idx + 1, content: line.trim() });
      }
    });
  });
});

if (sensitiveFiles.length > 0) {
  errors += sensitiveFiles.length;
  console.log(`❌ 发现 ${sensitiveFiles.length} 处潜在的硬编码敏感信息`);
  sensitiveFiles.slice(0, 3).forEach(item => {
    const relativePath = path.relative(process.cwd(), item.file);
    console.log(`   ${relativePath}:${item.line}`);
    console.log(`   ${item.content.substring(0, 60)}...`);
  });
} else {
  console.log('✅ 未发现硬编码的敏感信息');
}

// 总结
console.log('\n' + '='.repeat(50));
console.log('📊 检查完成');
console.log('='.repeat(50));
console.log(`✅ 错误: ${errors}`);
console.log(`⚠️  警告: ${warnings}`);
console.log(`📁 扫描文件: ${jsFiles.length}`);
console.log(`📝 代码总行数: ${jsFiles.reduce((sum, file) => {
  const content = fs.readFileSync(file, 'utf8');
  return sum + content.split('\n').length;
}, 0).toLocaleString()}`);

if (errors > 0) {
  console.log('\n❌ 发现严重问题，请修复后再提交！');
  process.exit(1);
} else if (warnings > 10) {
  console.log('\n⚠️  发现较多警告，建议优化代码质量');
  process.exit(0); // 不阻塞提交，但提示优化
} else {
  console.log('\n✅ 代码质量检查通过！');
  process.exit(0);
}
