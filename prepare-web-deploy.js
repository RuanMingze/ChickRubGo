#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 源目录
const sourceDir = process.cwd();
// 目标目录
const targetDir = path.join(sourceDir, 'web-deploy');

// 需要复制的文件和目录
const filesToCopy = [
  // HTML文件
  'index.html',
  'login.html',
  'register.html',
  'contact.html',
  'error.html',
  '400.html',
  '401.html',
  '403.html',
  '404.html',
  'sitemap.html',
  'CallBack.html',
  
  // CSS文件
  'style.css',
  'mobile.css',
  
  // JavaScript文件
  'renderer.js',
  'validate.js',
  'Error.js',
  'Supabase-SDK.js',
  
  // 资源文件
  'Assets/',
  'favicon.png',
  '404.png',
  'Error.png',
  
  // 其他必要文件
  'manifest.json',
  'service-worker.js',
  'sitemap.xml',
  
  // 错误页面目录
  'errors/',
  
  // Nginx配置目录
  'nginx/'
];

// 创建目标目录
function createTargetDir() {
  try {
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`✅ 已创建目标目录：${targetDir}`);
  } catch (error) {
    console.error('❌ 创建目标目录失败：', error.message);
    process.exit(1);
  }
}

// 复制文件
function copyFile(source, target) {
  try {
    const targetDir = path.dirname(target);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.copyFileSync(source, target);
    console.log(`✅ 已复制：${source}`);
  } catch (error) {
    console.error(`❌ 复制文件失败 ${source}：`, error.message);
  }
}

// 复制目录
function copyDirectory(source, target) {
  try {
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }
    
    const files = fs.readdirSync(source, { withFileTypes: true });
    for (const file of files) {
      const sourcePath = path.join(source, file.name);
      const targetPath = path.join(target, file.name);
      
      if (file.isDirectory()) {
        copyDirectory(sourcePath, targetPath);
      } else {
        copyFile(sourcePath, targetPath);
      }
    }
  } catch (error) {
    console.error(`❌ 复制目录失败 ${source}：`, error.message);
  }
}

// 开始复制
function startCopying() {
  console.log('📁 正在准备网页部署文件...');
  
  createTargetDir();
  
  for (const item of filesToCopy) {
    const sourcePath = path.join(sourceDir, item);
    const targetPath = path.join(targetDir, item);
    
    if (fs.existsSync(sourcePath)) {
      const stats = fs.statSync(sourcePath);
      if (stats.isDirectory()) {
        copyDirectory(sourcePath, targetPath);
      } else {
        copyFile(sourcePath, targetPath);
      }
    } else {
      console.warn(`⚠️ 文件不存在：${sourcePath}`);
    }
  }
  
  console.log('\n🎉 网页部署文件准备完成！');
  console.log(`📂 部署文件位于：${targetDir}`);
  console.log('\n📤 你可以将这个目录中的所有文件上传到 InfinityFree。');
}

// 执行复制
startCopying();
