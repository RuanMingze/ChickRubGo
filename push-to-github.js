#!/usr/bin/env node

const { execSync, exec } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 备份功能已禁用

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
