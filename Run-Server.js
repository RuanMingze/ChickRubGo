
// ChickRubGo.local 单文件提权+服务启动脚本（加载本地完整index.html）
const http = require('http');
const fs = require('fs');
const { exec, spawn } = require('child_process');
const os = require('os');
const path = require('path');
const process = require('process');

// 核心配置
const CONFIG = {
  port: 8000,
  domain: 'ChickRubGo.local',
  hostsPath: os.platform() === 'win32' 
    ? 'C:\\Windows\\System32\\drivers\\etc\\hosts' 
    : '/etc/hosts',
  rootDir: process.cwd() // 服务根目录（脚本所在文件夹）
};

// 检测文件MIME类型（支持加载CSS/JS/图片等静态资源）
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.json': 'application/json; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8'
  };
  return mimeMap[ext] || 'application/octet-stream';
}

// 检测管理员权限
function checkAdminRights() {
  return new Promise((resolve) => {
    if (os.platform() !== 'win32') {
      resolve(true);
      return;
    }
    exec('openfiles > nul 2>&1', { windowsHide: true }, (err) => {
      resolve(!err);
    });
  });
}

// 使用VBScript进行UAC提权
async function forceElevate() {
  if (os.platform() !== 'win32') {
    console.error('❌ 提权功能仅支持Windows系统！');
    process.exit(1);
  }

  console.log('🔑 检测到非管理员权限，触发UAC强制提权...');
  const scriptPath = path.resolve(__filename);
  
  // VBS中双引号转义
  const escapedPath = scriptPath.replace(/"/g, '""');
  const vbsScript = `
    Set UAC = CreateObject("Shell.Application")
    UAC.ShellExecute "node.exe", "${escapedPath}", "", "runas", 1
  `.replace(/^\s+/gm, '').trim();
  
  const vbsPath = path.join(os.tmpdir(), 'elevate_temp.vbs');
  
  try {
    fs.writeFileSync(vbsPath, vbsScript, { encoding: 'binary' });
    spawn('wscript.exe', [vbsPath, '/nologo'], {
      detached: true,
      stdio: 'ignore'
    });

    console.log('✅ UAC提权请求已发送，请在弹出的窗口中点击"是"以继续启动服务器');
    setTimeout(() => {
      try { fs.unlinkSync(vbsPath); } catch (e) {}
    }, 3000);
    process.exit(0);
  } catch (err) {
    console.error('❌ 提权失败：', err.message);
    try { fs.unlinkSync(vbsPath); } catch (e) {}
    process.exit(1);
  }
}

// 修改hosts文件
async function updateHosts() {
  try {
    let hostsContent = fs.readFileSync(CONFIG.hostsPath, { encoding: 'utf8' });
    const domainEntry = `127.0.0.1 ${CONFIG.domain}`;

    if (hostsContent.includes(domainEntry)) {
      console.log(`✅ hosts文件已存在 ${CONFIG.domain} 映射`);
      return true;
    }

    fs.appendFileSync(CONFIG.hostsPath, `\n${domainEntry}\n`, { encoding: 'utf8' });
    console.log(`✅ 成功添加 ${domainEntry} 到hosts文件`);
    return true;
  } catch (err) {
    console.error('❌ 修改hosts失败：', err.message);
    return false;
  }
}

// 启动HTTP服务
function startServer() {
  const server = http.createServer((req, res) => {
    // 处理根路径，默认加载index.html
    let requestPath = req.url === '/' ? '/index.html' : req.url;
    // 拼接完整文件路径（防止路径遍历攻击）
    let filePath = path.join(CONFIG.rootDir, requestPath);
    // 解析为绝对路径，限制访问范围在根目录内
    filePath = path.resolve(filePath);
    // 读取并返回文件
    fs.readFile(filePath, (err, data) => {
      if (err) {
        // 文件不存在时返回404
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <h1>404 文件未找到</h1>
          <p>请求的文件：${requestPath}</p>
          <p>服务根目录：${CONFIG.rootDir}</p>
          <p>请确认文件存在且路径正确</p>
        `);
        return;
      }

      // 成功读取文件，返回对应内容和MIME类型
      const mimeType = getMimeType(filePath);
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(data);
    });
  });

  // 启动服务
  server.listen(CONFIG.port, '127.0.0.1', () => {
    console.log(`🚀 HTTP服务已启动：http://127.0.0.1:${CONFIG.port}`);
    console.log(`🔍 自定义域名：http://${CONFIG.domain}:${CONFIG.port}`);
    console.log(`📂 服务根目录：${CONFIG.rootDir}`);
    console.log(`📄 自动加载：${path.join(CONFIG.rootDir, 'index.html')}`);
    // 自动打开浏览器访问根路径
    exec(`start http://${CONFIG.domain}:${CONFIG.port}`, { windowsHide: true });
  });

  // 优雅停止服务
  process.on('SIGINT', () => {
    console.log('\n🛑 正在停止服务...');
    server.close(() => {
      console.log('✅ 服务已停止');
      process.exit(0);
    });
  });
}

// 主执行流程
async function main() {
  console.log(`\n📌 ChickRubGo.local 服务配置启动...`);
  
  const isAdmin = await checkAdminRights();
  if (!isAdmin) {
    await forceElevate();
    return;
  }

  console.log('✅ 已获取管理员权限');
  const hostsOk = await updateHosts();
  if (!hostsOk) {
    process.exit(1);
  }

  startServer();
}

main().catch(err => {
  console.error('❌ 程序异常：', err.message);
  process.exit(1);
});