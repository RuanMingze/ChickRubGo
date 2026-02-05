// Nginx服务器启动脚本
const { exec, spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 配置
const CONFIG = {
  // Nginx命令（使用系统环境变量中的nginx）
  nginxCommand: 'nginx',
  // Nginx配置文件路径
  nginxConfPath: path.join(__dirname, 'nginx', 'error-handling.conf'),
  // 网站根目录
  webRoot: __dirname,
  // 默认端口
  port: 8080
};

// 检查系统是否安装了Nginx
function checkNginxInstalled() {
  return new Promise((resolve) => {
    // 检查nginx命令是否可用
    exec(`${CONFIG.nginxCommand} -v`, (err, stdout, stderr) => {
      if (err) {
        resolve(false);
        return;
      }
      resolve(true);
    });
  });
}

// 启动Nginx服务器
function startNginx() {
  return new Promise((resolve, reject) => {
    console.log('🚀 正在启动Nginx服务器...');
    
    // 检查Nginx配置文件是否存在
    if (!fs.existsSync(CONFIG.nginxConfPath)) {
      reject(new Error(`Nginx配置文件不存在: ${CONFIG.nginxConfPath}`));
      return;
    }
    
    // 确保当前目录有必要的nginx目录结构
    ensureNginxDirectories();
    
    // 启动Nginx，指定工作目录为当前项目目录
    console.log(`🚀 正在启动Nginx服务器...`);
    exec(`${CONFIG.nginxCommand} -c conf/nginx.conf`, { cwd: __dirname }, (err, stdout, stderr) => {
      if (err) {
        console.log(`⚠️ 启动Nginx时遇到错误: ${err.message}`);
        console.log(`⚠️ 尝试直接启动Nginx（不使用reload）...`);
        // 直接启动Nginx，不使用reload
        exec(`${CONFIG.nginxCommand} -c conf/nginx.conf`, { cwd: __dirname }, (startErr) => {
          if (startErr) {
            reject(new Error(`启动Nginx失败: ${startErr.message}`));
            return;
          }
          resolve('Nginx已成功启动');
        });
        return;
      }
      resolve('Nginx已成功启动');
    });
  });
}

// 检查Nginx是否正在运行
function checkNginxStatus() {
  return new Promise((resolve) => {
    exec('netstat -ano | findstr :8080', (err, stdout) => {
      if (err || !stdout) {
        resolve(false);
        return;
      }
      resolve(true);
    });
  });
}

// 停止Nginx服务器
function stopNginx() {
  return new Promise((resolve, reject) => {
    console.log('🛑 正在停止Nginx服务器...');
    exec(`${CONFIG.nginxCommand} -s stop`, { cwd: __dirname }, (err) => {
      if (err) {
        reject(new Error(`停止Nginx失败: ${err.message}`));
        return;
      }
      resolve('Nginx已成功停止');
    });
  });
}

// 显示Nginx版本信息
function showNginxVersion() {
  return new Promise((resolve) => {
    exec(`${CONFIG.nginxCommand} -v`, (err, stdout, stderr) => {
      if (err) {
        resolve('无法获取Nginx版本信息');
        return;
      }
      resolve(stderr.trim()); // Nginx版本信息输出到stderr
    });
  });
}

// 确保当前目录有必要的nginx目录结构
function ensureNginxDirectories() {
  // 创建conf目录
  const confDir = path.join(__dirname, 'conf');
  if (!fs.existsSync(confDir)) {
    fs.mkdirSync(confDir, { recursive: true });
    console.log(`✅ 创建了conf目录: ${confDir}`);
  }
  
  // 创建logs目录
  const logsDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log(`✅ 创建了logs目录: ${logsDir}`);
  }
  
  // 创建temp目录结构
  const tempDir = path.join(__dirname, 'temp');
  const clientBodyTempDir = path.join(tempDir, 'client_body_temp');
  const proxyTempDir = path.join(tempDir, 'proxy_temp');
  const fastcgiTempDir = path.join(tempDir, 'fastcgi_temp');
  const uwsgiTempDir = path.join(tempDir, 'uwsgi_temp');
  const scgiTempDir = path.join(tempDir, 'scgi_temp');
  
  const tempDirs = [clientBodyTempDir, proxyTempDir, fastcgiTempDir, uwsgiTempDir, scgiTempDir];
  tempDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ 创建了temp目录: ${dir}`);
    }
  });
  
  // 检查是否存在mime.types文件，如果不存在则创建一个基本版本
  const localMimeTypes = path.join(__dirname, 'conf', 'mime.types');
  if (!fs.existsSync(localMimeTypes)) {
    const mimeTypesContent = `
types {
    text/html                                        html htm shtml;
    text/css                                         css;
    text/xml                                         xml;
    image/gif                                        gif;
    image/jpeg                                       jpeg jpg;
    application/javascript                           js;
    application/atom+xml                             atom;
    application/rss+xml                              rss;

    text/mathml                                      mml;
    text/plain                                       txt;
    text/vnd.sun.j2me.app-descriptor                 jad;
    text/vnd.wap.wml                                 wml;
    text/x-component                                 htc;

    image/png                                        png;
    image/tiff                                       tif tiff;
    image/vnd.wap.wbmp                               wbmp;
    image/x-icon                                     ico;
    image/x-jng                                      jng;
    image/x-ms-bmp                                   bmp;
    image/svg+xml                                    svg svgz;
    image/webp                                       webp;

    application/font-woff                            woff;
    application/java-archive                         jar war ear;
    application/json                                 json;
    application/mac-binhex40                         hqx;
    application/msword                               doc;
    application/pdf                                  pdf;
    application/postscript                           ps eps ai;
    application/rtf                                  rtf;
    application/vnd.apple.mpegurl                    m3u8;
    application/vnd.google-earth.kml+xml             kml;
    application/vnd.google-earth.kmz                 kmz;
    application/vnd.ms-excel                         xls;
    application/vnd.ms-fontobject                    eot;
    application/vnd.ms-powerpoint                    ppt;
    application/vnd.oasis.opendocument.graphics      odg;
    application/vnd.oasis.opendocument.presentation  odp;
    application/vnd.oasis.opendocument.spreadsheet   ods;
    application/vnd.oasis.opendocument.text          odt;
    application/vnd.openxmlformats-officedocument.presentationml.presentation
                                                    pptx;
    application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
                                                    xlsx;
    application/vnd.openxmlformats-officedocument.wordprocessingml.document
                                                    docx;
    application/vnd.wap.wmlc                         wmlc;
    application/x-7z-compressed                      7z;
    application/x-cocoa                              cco;
    application/x-java-archive-diff                  jardiff;
    application/x-java-jnlp-file                     jnlp;
    application/x-makeself                           run;
    application/x-perl                               pl pm;
    application/x-pilot                              prc pdb;
    application/x-rar-compressed                     rar;
    application/x-redhat-package-manager             rpm;
    application/x-sea                                sea;
    application/x-shockwave-flash                    swf;
    application/x-stuffit                            sit;
    application/x-tcl                                tcl tk;
    application/x-x509-ca-cert                       der pem crt;
    application/x-xpinstall                          xpi;
    application/xhtml+xml                            xhtml;
    application/xspf+xml                             xspf;
    application/zip                                  zip;

    application/octet-stream                         bin exe dll;
    application/octet-stream                         deb;
    application/octet-stream                         dmg;
    application/octet-stream                         iso img;
    application/octet-stream                         msi msp msm;

    audio/midi                                       mid midi kar;
    audio/mpeg                                       mp3;
    audio/ogg                                        ogg;
    audio/x-m4a                                      m4a;
    audio/x-realaudio                                ra;

    video/3gpp                                       3gpp 3gp;
    video/mp2t                                       ts;
    video/mp4                                        mp4;
    video/mpeg                                       mpeg mpg;
    video/quicktime                                  mov;
    video/webm                                       webm;
    video/x-flv                                      flv;
    video/x-m4v                                      m4v;
    video/x-ms-asf                                   asx asf;
    video/x-ms-wmv                                   wmv;
    video/x-msvideo                                  avi;
}
`;
    
    fs.writeFileSync(localMimeTypes, mimeTypesContent);
    console.log(`✅ 创建了mime.types文件: ${localMimeTypes}`);
  }
  
  // 创建nginx.conf配置文件
  const nginxConf = path.join(__dirname, 'conf', 'nginx.conf');
  if (!fs.existsSync(nginxConf)) {
    const configContent = `
# Nginx配置文件
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    ${fs.existsSync(localMimeTypes) ? 'include       mime.types;' : ''}
    default_type  application/octet-stream;
    
    sendfile        on;
    keepalive_timeout  65;
    
    # 临时文件目录
    client_body_temp_path  ${tempDir.replace(/\\/g, '/')}/client_body_temp;
    proxy_temp_path        ${tempDir.replace(/\\/g, '/')}/proxy_temp;
    fastcgi_temp_path      ${tempDir.replace(/\\/g, '/')}/fastcgi_temp;
    uwsgi_temp_path        ${tempDir.replace(/\\/g, '/')}/uwsgi_temp;
    scgi_temp_path         ${tempDir.replace(/\\/g, '/')}/scgi_temp;
    
    # 服务器配置
        server {
            listen       8080;
            server_name  localhost ruanmingze.github.io;
            
            # 网站根目录
            root   ${__dirname.replace(/\\/g, '/')};
            index  index.html index.htm;
            
            # 错误页面配置
            include ${path.join(__dirname, 'nginx', 'error-handling.conf').replace(/\\/g, '/')};
            
            # 静态文件配置
            location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
                expires 30d;
                add_header Cache-Control "public, max-age=2592000";
            }
        }
}
`;
    
    fs.writeFileSync(nginxConf, configContent);
    console.log(`✅ 创建了nginx.conf配置文件: ${nginxConf}`);
  }
}

// 主执行流程
async function main() {
  console.log('📌 Nginx服务器管理脚本');
  console.log('=' . repeat(50));
  
  // 检查Nginx是否安装
  const isInstalled = await checkNginxInstalled();
  if (!isInstalled) {
    console.error('❌ 系统未安装Nginx或nginx命令不可用');
    console.log('📥 请先下载并安装Nginx: https://nginx.org/en/download.html');
    console.log('💡 安装后请将Nginx添加到系统环境变量PATH中');
    process.exit(1);
  }
  
  // 显示Nginx版本
  const version = await showNginxVersion();
  console.log(`✅ ${version}`);
  
  // 检查Nginx状态
  const isRunning = await checkNginxStatus();
  if (isRunning) {
    console.log('⚠️ Nginx已经在运行，尝试重启...');
    // 自动重启Nginx
    try {
      const message = await startNginx();
      console.log(`✅ ${message}`);
      showServerInfo();
    } catch (error) {
      console.error(`❌ ${error.message}`);
      process.exit(1);
    }
  } else {
    // 启动Nginx
    try {
      const message = await startNginx();
      console.log(`✅ ${message}`);
      showServerInfo();
    } catch (error) {
      console.error(`❌ ${error.message}`);
      process.exit(1);
    }
  }
}

// 显示服务器信息
function showServerInfo() {
  console.log('\n📋 服务器信息:');
  console.log(`🌐 网站根目录: ${CONFIG.webRoot}`);
  console.log(`⚙️ Nginx配置: ${CONFIG.nginxConfPath}`);
  console.log(`🔗 访问地址: http://localhost`);
  console.log(`🔗 访问地址(带端口): http://localhost:${CONFIG.port}`);
  console.log('\n📌 常用命令:');
  console.log('  - 停止Nginx: node start-nginx.js stop');
  console.log('  - 重启Nginx: node start-nginx.js restart');
  console.log('  - 检查状态: node start-nginx.js status');
}

// 命令行参数处理
const args = process.argv.slice(2);

if (args.includes('stop')) {
  // 停止Nginx
  stopNginx()
    .then((message) => {
      console.log(`✅ ${message}`);
    })
    .catch((error) => {
      console.error(`❌ ${error.message}`);
    });
} else if (args.includes('restart')) {
  // 重启Nginx
  stopNginx()
    .then(() => startNginx())
    .then((message) => {
      console.log(`✅ ${message}`);
      showServerInfo();
    })
    .catch((error) => {
      console.error(`❌ ${error.message}`);
    });
} else if (args.includes('status')) {
  // 检查状态
  checkNginxStatus()
    .then((isRunning) => {
      if (isRunning) {
        console.log('✅ Nginx正在运行');
        showServerInfo();
      } else {
        console.log('❌ Nginx未运行');
      }
    });
} else {
  // 默认启动
  main().catch((error) => {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  });
}

// 优雅处理进程终止
process.on('SIGINT', () => {
  console.log('\n🛑 正在停止服务...');
  stopNginx()
    .then(() => {
      console.log('✅ Nginx已停止');
      process.exit(0);
    })
    .catch(() => {
      process.exit(0);
    });
});