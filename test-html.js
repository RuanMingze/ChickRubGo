const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testHTML() {
    console.log('🧪 开始测试 HTML 页面...\n');
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
        const htmlPath = path.join(__dirname, 'index.html');
        const fileUrl = `file://${htmlPath}`;
        
        console.log(`📄 加载页面: ${fileUrl}`);
        await page.goto(fileUrl);
        
        console.log('⏳ 等待页面加载...');
        await page.waitForLoadState('networkidle');
        
        console.log('✅ 页面加载成功\n');
        
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        
        console.log('🔍 检查 HTML 结构...');
        
        const checks = [];
        
        if (htmlContent.includes('<!DOCTYPE') || htmlContent.includes('<!doctype')) {
            checks.push({ name: 'DOCTYPE 声明', status: '✅' });
        } else {
            checks.push({ name: 'DOCTYPE 声明', status: '❌' });
        }
        
        if (htmlContent.includes('<html')) {
            checks.push({ name: 'HTML 标签', status: '✅' });
        } else {
            checks.push({ name: 'HTML 标签', status: '❌' });
        }
        
        if (htmlContent.includes('<head>')) {
            checks.push({ name: 'HEAD 标签', status: '✅' });
        } else {
            checks.push({ name: 'HEAD 标签', status: '❌' });
        }
        
        if (htmlContent.includes('<body')) {
            checks.push({ name: 'BODY 标签', status: '✅' });
        } else {
            checks.push({ name: 'BODY 标签', status: '❌' });
        }
        
        if (htmlContent.includes('</html>')) {
            checks.push({ name: 'HTML 闭合标签', status: '✅' });
        } else {
            checks.push({ name: 'HTML 闭合标签', status: '❌' });
        }
        
        if (htmlContent.includes('</head>')) {
            checks.push({ name: 'HEAD 闭合标签', status: '✅' });
        } else {
            checks.push({ name: 'HEAD 闭合标签', status: '❌' });
        }
        
        if (htmlContent.includes('</body>')) {
            checks.push({ name: 'BODY 闭合标签', status: '✅' });
        } else {
            checks.push({ name: 'BODY 闭合标签', status: '❌' });
        }
        
        console.log('\n📋 检查结果:');
        console.log('='.repeat(40));
        checks.forEach(check => {
            console.log(`${check.status} ${check.name}`);
        });
        console.log('='.repeat(40));
        
        const failedChecks = checks.filter(c => c.status === '❌');
        
        if (failedChecks.length === 0) {
            console.log('\n🎉 所有检查通过！页面结构完整。');
        } else {
            console.log(`\n⚠️  发现 ${failedChecks.length} 个问题需要修复。`);
        }
        
        console.log('\n📊 页面信息:');
        const title = await page.title();
        console.log(`   标题: ${title}`);
        
        const viewportSize = page.viewportSize();
        console.log(`   视口: ${viewportSize?.width || 'N/A'}x${viewportSize?.height || 'N/A'}`);
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    } finally {
        await browser.close();
        console.log('\n✨ 测试完成！');
    }
}

testHTML().catch(error => {
    console.error('❌ 测试出错:', error);
    process.exit(1);
});