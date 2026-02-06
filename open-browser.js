const open = require('open');
// 解析命令行参数，默认打开index.html
let openfile = process.argv[2] || 'index.html';
open(openfile);
console.log(`✅ 成功在浏览器中打开 ${openfile}`);
