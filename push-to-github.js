#!/usr/bin/env node

const { execSync, exec } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 读取.gitignore文件内容
function getGitignorePatterns() {
  try {
    const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
    return gitignoreContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  } catch (error) {
    console.log('⚠️  未找到.gitignore文件，将备份所有文件');
    return [];
  }
}

// 检查路径是否应该被排除
function shouldExclude(filePath, ignorePatterns) {
  const relativePath = path.relative(process.cwd(), filePath);
  
  for (const pattern of ignorePatterns) {
    // 简单的模式匹配
    if (pattern.endsWith('/')) {
      // 目录模式
      if (fs.statSync(filePath).isDirectory() && relativePath === pattern.slice(0, -1)) {
        return true;
      }
    } else {
      // 文件模式
      if (relativePath === pattern) {
        return true;
      }
    }
  }
  return false;
}

// 复制文件到备份目录
function copyFileToBackup(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

// 备份项目文件
function backupProject() {
  console.log('\n📁 正在备份项目文件...');
  
  const ignorePatterns = getGitignorePatterns();
  const desktopPath = path.join(os.homedir(), 'Desktop');
  const backupDir = path.join(desktopPath, 'ChickRubGo-Copy');
  
  function backupDirectory(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = path.join(dir, file.name);
      
      // 跳过.git目录
      if (file.name === '.git') {
        continue;
      }
      
      // 检查是否应该被排除
      if (shouldExclude(filePath, ignorePatterns)) {
        continue;
      }
      
      const relativePath = path.relative(process.cwd(), filePath);
      const backupPath = path.join(backupDir, relativePath);
      
      if (file.isDirectory()) {
        backupDirectory(filePath);
      } else {
        copyFileToBackup(filePath, backupPath);
      }
    }
  }
  
  // 清空现有的备份目录
  try {
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true, force: true });
    }
    // 重新创建备份目录
    fs.mkdirSync(backupDir, { recursive: true });
  } catch (error) {
    console.error('❌ 清空备份目录失败：', error.message);
    return null;
  }
  
  try {
    backupDirectory(process.cwd());
    console.log(`✅ 备份完成，备份目录：${backupDir}`);
    return backupDir;
  } catch (error) {
    console.error('❌ 备份失败：', error.message);
    return null;
  }
}

// 创建读取用户输入的接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== ChickRubGo 一键推送脚本 ===\n');

// 检查当前目录是否为Git仓库
try {
  execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ 错误：当前目录不是Git仓库');
  process.exit(1);
}

// 检查Git状态
console.log('📋 检查Git状态...');
try {
  const statusOutput = execSync('git status --porcelain', { encoding: 'utf8' });
  
  if (statusOutput.trim() === '') {
    console.log('✅ 没有需要提交的更改');
    process.exit(0);
  }
  
  console.log('\n🔄 更改的文件：');
  console.log(statusOutput);
  
} catch (error) {
  console.error('❌ 检查Git状态失败：', error.message);
  process.exit(1);
}

// 询问用户是否要推送
rl.question('\n🤔 确认要推送这些更改到GitHub吗？(y/n): ', (answer) => {
  if (answer.toLowerCase() !== 'y') {
    console.log('✅ 推送已取消');
    rl.close();
    process.exit(0);
  }
  
  // 备份项目文件
  const backupDir = backupProject();
  if (!backupDir) {
    console.error('❌ 备份失败，推送已取消');
    rl.close();
    process.exit(1);
  }
  
  // 添加所有更改
  console.log('\n📥 添加所有更改...');
  try {
    execSync('git add .');
    console.log('✅ 已添加所有更改');
  } catch (error) {
    console.error('❌ 添加更改失败：', error.message);
    rl.close();
    process.exit(1);
  }
  
  // 询问提交消息
  rl.question('\n📝 请输入提交消息：', (commitMessage) => {
    // 创建提交
    console.log('\n📦 创建提交...');
    try {
      execSync(`git commit -m "${commitMessage}"`);
      console.log('✅ 提交创建成功');
    } catch (error) {
      console.error('❌ 创建提交失败：', error.message);
      rl.close();
      process.exit(1);
    }
    
    // 推送更改（使用强制推送确保不会被覆盖）
    console.log('\n🚀 推送更改到GitHub...');
    try {
      // 使用强制推送确保本地更改完全覆盖远程
      execSync('git push -f', { stdio: 'inherit' });
      console.log('\n✅ 推送成功！');
      console.log('📌 更改已安全推送到GitHub，不会被覆盖');
    } catch (error) {
      console.error('\n❌ 推送失败：', error.message);
      console.log('\n💡 提示：如果遇到认证问题，请确保已在浏览器中完成GitHub认证');
      rl.close();
      process.exit(1);
    }
    
    rl.close();
  });
});

// 处理用户中断
rl.on('SIGINT', () => {
  console.log('\n✅ 操作已取消');
  rl.close();
  process.exit(0);
});
