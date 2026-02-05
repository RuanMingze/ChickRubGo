const { exec } = require('child_process');
const path = require('path');

console.log('🔍 开始校验 JavaScript 文件...\n');

exec('eslint *.js', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ 校验失败！');
    console.error('错误信息:', error.message);
    if (stderr) {
      console.error('\n错误输出:');
      console.error(stderr);
    }
    process.exit(1);
  }

  if (stdout.trim()) {
    console.log('⚠️  发现问题：\n');
    console.log(stdout);
    process.exit(1);
  }

  console.log('✅ 校验通过！所有 JavaScript 文件语法正确。');
  process.exit(0);
});