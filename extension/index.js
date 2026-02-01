// 页面加载完成后执行（确保能获取到 iframe 元素）
document.addEventListener('DOMContentLoaded', function() {
    // 配置项：可根据需要修改的URL和超时时间
    const CONFIG = {
        iframeId: 'main-frame',    // iframe的ID
        primaryUrl: 'https://ruanmingze.github.io/ChickRubGo/',  // 主地址
        backupUrl: 'https://chickrubgo.kesug.com/',              // 备用地址
        finalUrl: 'https://cn.bing.com',                         // 最终跳转地址
        timeout: 5000,             // 加载超时时间（毫秒）
        maxRetry: 1                // 最大重试次数
    };

    // 获取iframe元素
    const iframe = document.getElementById(CONFIG.iframeId);
    if (!iframe) {
        console.error(`未找到ID为 ${CONFIG.iframeId} 的iframe元素`);
        return;
    }

    // 状态变量
    let currentUrl = CONFIG.primaryUrl;
    let loadTimeout = null;
    let retryCount = 0;

    /**
     * 检查加载超时的函数
     */
    function checkLoad() {
        // 清除之前的超时器，避免重复触发
        clearTimeout(loadTimeout);
        
        loadTimeout = setTimeout(() => {
            console.log(`[超时] ${currentUrl} 加载超时，尝试切换地址`);
            switchToNextUrl();
        }, CONFIG.timeout);
    }

    /**
     * 切换到下一个备用地址
     */
    function switchToNextUrl() {
        if (currentUrl === CONFIG.primaryUrl && retryCount < CONFIG.maxRetry) {
            // 主地址超时，切换到备用地址
            currentUrl = CONFIG.backupUrl;
            iframe.src = currentUrl;
            retryCount++;
            checkLoad(); // 继续监听备用地址的超时
        } else if (currentUrl === CONFIG.backupUrl) {
            // 备用地址也超时，跳转到最终地址
            redirectToFinalUrl();
        }
    }

    /**
     * 重定向到最终地址
     */
    function redirectToFinalUrl() {
        clearTimeout(loadTimeout);
        console.log(`[最终跳转] 所有地址加载失败，跳转到 ${CONFIG.finalUrl}`);
        window.location.href = CONFIG.finalUrl;
    }

    // 监听iframe加载成功事件
    iframe.addEventListener('load', () => {
        clearTimeout(loadTimeout);
        console.log(`[成功] 页面加载完成: ${currentUrl}`);
    });

    // 监听iframe加载失败事件
    iframe.addEventListener('error', () => {
        clearTimeout(loadTimeout);
        console.log(`[失败] ${currentUrl} 加载失败`);
        switchToNextUrl();
    });

    // 初始化：设置初始地址并开始超时检查
    iframe.src = currentUrl;
    checkLoad();
});