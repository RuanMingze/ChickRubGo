const agreeBtn = document.getElementById('agree-btn');
const disagreeBtn = document.getElementById('disagree-btn');
const agreeCheckbox = document.getElementById('agree-checkbox');

agreeBtn.addEventListener('click', () => {
    if (!agreeCheckbox.checked) {
        alert('请先阅读并同意许可协议');
        return;
    }

    chrome.storage.local.set({
        agreed: true
    }, () => {
        window.close();
    });
});

disagreeBtn.addEventListener('click', () => {
    if (confirm('您不同意许可协议，扩展将被禁用。确定要继续吗？')) {
        chrome.management.uninstallSelf();
        window.close();
    }
});