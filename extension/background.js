chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.storage.local.get(['agreed'], (result) => {
            if (!result.agreed) {
                chrome.tabs.create({
                    url: chrome.runtime.getURL('welcome.html'),
                    active: true
                });
            }
        });
    }
});

// 监听扩展图标点击事件
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({
        url: chrome.runtime.getURL('settings.html'),
        active: true
    });
});
