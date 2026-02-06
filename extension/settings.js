// 默认配置
const DEFAULT_CONFIG = {
    primaryUrl: 'https://ruanmingze.github.io/ChickRubGo/',
    backupUrl: 'https://chickrubgo.kesug.com/',
    finalUrl: 'https://cn.bing.com',
    timeout: 5000,
    maxRetry: 1
};

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化主题
    initTheme();
    
    // 加载保存的设置
    loadSettings();
    
    // 绑定事件监听器
    document.getElementById('save-btn').addEventListener('click', saveSettings);
    document.getElementById('reset-btn').addEventListener('click', resetSettings);
    document.getElementById('back-btn').addEventListener('click', goBack);
});

/**
 * 初始化主题
 */
function initTheme() {
    // 读取系统主题设置
    const body = document.body;
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    // 根据系统设置设置初始主题
    if (prefersDarkScheme.matches) {
        body.classList.add('dark-mode');
    } else {
        body.classList.remove('dark-mode');
    }

    // 监听系统主题变化
    prefersDarkScheme.addEventListener('change', function(e) {
        if (e.matches) {
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
        }
    });
}

/**
 * 加载保存的设置
 */
function loadSettings() {
    chrome.storage.local.get(['config'], function(result) {
        const config = result.config || DEFAULT_CONFIG;
        
        // 填充表单
        document.getElementById('primary-url').value = config.primaryUrl;
        document.getElementById('backup-url').value = config.backupUrl;
        document.getElementById('final-url').value = config.finalUrl;
        document.getElementById('timeout').value = config.timeout;
        document.getElementById('max-retry').value = config.maxRetry;
    });
}

/**
 * 保存设置
 */
function saveSettings() {
    // 获取表单值
    const config = {
        primaryUrl: document.getElementById('primary-url').value || DEFAULT_CONFIG.primaryUrl,
        backupUrl: document.getElementById('backup-url').value || DEFAULT_CONFIG.backupUrl,
        finalUrl: document.getElementById('final-url').value || DEFAULT_CONFIG.finalUrl,
        timeout: parseInt(document.getElementById('timeout').value) || DEFAULT_CONFIG.timeout,
        maxRetry: parseInt(document.getElementById('max-retry').value) || DEFAULT_CONFIG.maxRetry
    };
    
    // 保存到本地存储
    chrome.storage.local.set({ config }, function() {
        // 显示保存成功提示
        alert('设置已保存！');
    });
}

/**
 * 恢复默认设置
 */
function resetSettings() {
    if (confirm('确定要恢复默认设置吗？')) {
        // 填充默认值
        document.getElementById('primary-url').value = DEFAULT_CONFIG.primaryUrl;
        document.getElementById('backup-url').value = DEFAULT_CONFIG.backupUrl;
        document.getElementById('final-url').value = DEFAULT_CONFIG.finalUrl;
        document.getElementById('timeout').value = DEFAULT_CONFIG.timeout;
        document.getElementById('max-retry').value = DEFAULT_CONFIG.maxRetry;
        
        // 保存默认设置
        chrome.storage.local.set({ config: DEFAULT_CONFIG }, function() {
            alert('已恢复默认设置！');
        });
    }
}

/**
 * 返回上一页
 */
function goBack() {
    window.location.href = 'index.html';
}