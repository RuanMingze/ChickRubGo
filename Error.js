// Error.js - 专门用于捕获和处理错误的脚本
// 该脚本应该在所有其他脚本之前加载，以确保能够捕获所有错误

// 全局错误处理
window.onerror = function(message, source, lineno, colno, error) {
    // 排除API请求失败的错误
    if (message && message.toLowerCase().includes('api')) {
        return false;
    }
    if (message && message.toLowerCase().includes('fetch')) {
        return false;
    }
    if (message && message.toLowerCase().includes('network')) {
        return false;
    }
    if (message && message.toLowerCase().includes('404')) {
        return false;
    }
    if (message && message.toLowerCase().includes('500')) {
        return false;
    }
    
    // 构建错误信息
    let errorInfo = '';
    if (message) {
        errorInfo += `错误消息: ${message}\n`;
    }
    if (source) {
        errorInfo += `文件: ${source}\n`;
    }
    if (lineno) {
        errorInfo += `行号: ${lineno}\n`;
    }
    if (colno) {
        errorInfo += `列号: ${colno}\n`;
    }
    if (error && error.stack) {
        errorInfo += `错误堆栈: ${error.stack}\n`;
    }
    
    // 将错误信息存储到localStorage，以便在error.html中显示
    localStorage.setItem('errorInfo', errorInfo);
    
    // 创建全屏iframe显示错误页面
    createErrorIframe();
    
    return true; // 阻止默认错误处理
};

// 捕获未处理的Promise拒绝
window.onunhandledrejection = function(event) {
    // 过滤特定的错误
    if (event.reason) {
        // 过滤AbortError错误
        if (event.reason.name === 'AbortError' || (typeof event.reason === 'string' && event.reason.includes('AbortError'))) {
            return;
        }
        // 过滤deleteProperty错误
        if (typeof event.reason === 'string' && event.reason.includes('deleteProperty') && event.reason.includes('__tm_start')) {
            return;
        }
        // 过滤API请求失败的错误
        if (typeof event.reason === 'string' && event.reason.toLowerCase().includes('api')) {
            return;
        }
        if (typeof event.reason === 'string' && event.reason.toLowerCase().includes('fetch')) {
            return;
        }
        if (typeof event.reason === 'string' && event.reason.toLowerCase().includes('network')) {
            return;
        }
        if (typeof event.reason === 'string' && event.reason.toLowerCase().includes('404')) {
            return;
        }
        if (typeof event.reason === 'string' && event.reason.toLowerCase().includes('500')) {
            return;
        }
    }
    
    // 构建错误信息
    let errorInfo = '';
    if (event.reason) {
        errorInfo += `Promise拒绝原因: ${event.reason}\n`;
    }
    if (event.promise) {
        errorInfo += `Promise对象: ${event.promise}\n`;
    }
    
    // 将错误信息存储到localStorage，以便在error.html中显示
    localStorage.setItem('errorInfo', errorInfo);
    
    // 创建全屏iframe显示错误页面
    createErrorIframe();
};

// 创建全屏iframe显示错误页面
function createErrorIframe() {
    // 检查是否已经存在错误iframe
    if (document.getElementById('error-iframe')) {
        return;
    }
    
    // 创建iframe元素
    const iframe = document.createElement('iframe');
    iframe.id = 'error-iframe';
    
    // 设置iframe样式为全屏显示
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100vw';
    iframe.style.height = '100vh';
    iframe.style.border = 'none';
    iframe.style.zIndex = '999999';
    iframe.style.background = 'white';
    
    // 设置iframe的src属性为error.html
    iframe.src = 'error.html';
    
    // 将iframe添加到document.body中
    document.body.appendChild(iframe);
}

// 检测页面加载错误
window.addEventListener('load', function() {
    console.log('Error.js 已成功加载并初始化');
});
