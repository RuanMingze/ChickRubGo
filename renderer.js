        async function loadWallpaper(skipCache = false) {
            const loading = document.getElementById('loading');
            loading.style.display = 'flex';

            const savedWallpaperBase64 = localStorage.getItem('wallpaperBase64');
            const savedWallpaperTime = localStorage.getItem('wallpaperTime');
            const FIVE_DAYS = 5 * 24 * 60 * 60 * 1000;
            
            const currentTime = Date.now();
            const isExpired = savedWallpaperTime && (currentTime - parseInt(savedWallpaperTime)) > FIVE_DAYS;

            if (!skipCache && savedWallpaperBase64 && !isExpired) {
                document.body.style.backgroundImage = `url(${savedWallpaperBase64})`;
                loading.style.display = 'none';
                return;
            }

            try {
                const timestamp = Date.now();
                const wallpaperUrl = `https://picsum.photos/1920/1080?random=${timestamp}`;
                
                const response = await fetch(wallpaperUrl);
                const blob = await response.blob();
                const base64 = await blobToBase64(blob);
                
                document.body.style.backgroundImage = `url(${base64})`;
                localStorage.setItem('wallpaperBase64', base64);
                localStorage.setItem('wallpaperTime', currentTime.toString());
                loading.style.display = 'none';
            } catch (err) {
                console.error('壁纸加载异常:', err);
                if (savedWallpaperBase64) {
                    document.body.style.backgroundImage = `url(${savedWallpaperBase64})`;
                } else {
                    document.body.style.backgroundImage = 'url(https://picsum.photos/1920/1080/?random)';
                }
                loading.style.display = 'none';
            }
        }

        function blobToBase64(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }

        function updateTime() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const day = now.getDate();
            const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
            const weekday = weekdays[now.getDay()];
            
            document.getElementById('time-display').textContent = `${hours}:${minutes}:${seconds}`;
            document.getElementById('date-display').textContent = `${year}年${month}月${day}日 ${weekday}`;
        }

        window.addEventListener('load', () => loadWallpaper());
        window.addEventListener('load', updateTime);
        setInterval(updateTime, 1000);

        function handleSearch() {
            const input = document.getElementById('search-input');
            const keyword = input.value.trim();

            if (!keyword) {
                input.style.borderColor = '#EF4444';
                setTimeout(() => {
                    // 根据当前模式恢复对应的边框颜色
                    if (document.body.classList.contains('dark-mode')) {
                        input.style.borderColor = '#374151';
                    } else {
                        input.style.borderColor = 'var(--gray-200)';
                    }
                }, 1000);
                return;
            }

            const searchEngineSelect = document.getElementById('search-engine');
            let searchUrl;
            
            if (searchEngineSelect.value === 'custom') {
                const customUrl = document.getElementById('custom-search-url').value.trim();
                if (customUrl) {
                    searchUrl = customUrl.replace('%text%', encodeURIComponent(keyword));
                } else {
                    searchUrl = `https://cn.bing.com/search?q=${encodeURIComponent(keyword)}`;
                }
            } else {
                searchUrl = searchEngineSelect.value.replace('%text%', encodeURIComponent(keyword));
            }
            
            window.open(searchUrl, '_blank');
            input.value = '';
        }

        document.getElementById('search-btn').addEventListener('click', handleSearch);
        document.getElementById('search-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });

        document.querySelectorAll('.search-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const input = document.getElementById('search-input');
                input.value = tag.textContent;
                handleSearch();
            });
        });
        
        const settingsBtn = document.getElementById('settings-btn');
        const modeToggleBtn = document.getElementById('mode-toggle-btn');
        const refreshWallpaperBtn = document.getElementById('refresh-wallpaper-btn');
        const settingsPanel = document.getElementById('settings-panel');
        const closeSettings = document.getElementById('close-settings');
        const cancelSettings = document.getElementById('cancel-settings');
        const resetSettingsBtn = document.getElementById('reset-settings');
        const showWallpaperCheckbox = document.getElementById('show-wallpaper');
        const weatherApiKeyInput = document.getElementById('weather-api-key');
        const searchEngineSelect = document.getElementById('search-engine');
        const customSearchUrlInput = document.getElementById('custom-search-url');
        const customSearchContainer = document.getElementById('custom-search-container');
        const darkModeCheckbox = document.getElementById('dark-mode');
        const timeSection = document.querySelector('.time-section');
        const searchCard = document.querySelector('.search-card');
        const quickSearch = document.querySelector('.quick-search');
        const closeWindowButtons = document.querySelectorAll('.close-window');
        const notepadWindow = document.getElementById('notepad-window');
        const weatherWindow = document.getElementById('weather-window');
        const woodenFishWindow = document.getElementById('wooden-fish-window');
        const notepadContent = document.getElementById('notepad-content');
        const weatherContent = document.getElementById('weather-content');
        const woodenFish = document.getElementById('wooden-fish');
        const woodenFishImage = document.getElementById('wooden-fish-image');
        const meritCount = document.getElementById('merit-count');
        
        function loadSettings() {
            const savedShowWallpaper = localStorage.getItem('showWallpaper');
            const savedWeatherApiKey = localStorage.getItem('weatherApiKey');
            const savedSearchEngine = localStorage.getItem('searchEngine');
            const savedCustomSearchUrl = localStorage.getItem('customSearchUrl');
            const savedNotepadContent = localStorage.getItem('notepadContent');
            const savedMeritCount = localStorage.getItem('meritCount');
            const savedDarkMode = localStorage.getItem('darkMode');
            
            if (savedShowWallpaper !== null) {
                showWallpaperCheckbox.checked = savedShowWallpaper === 'true';
            }
            
            if (savedDarkMode !== null) {
                darkModeCheckbox.checked = savedDarkMode === 'true';
            } else {
                // 默认深色模式
                darkModeCheckbox.checked = true;
                localStorage.setItem('darkMode', 'true');
            }
            
            if (savedWeatherApiKey) {
                weatherApiKeyInput.value = savedWeatherApiKey;
            }
            
            if (savedSearchEngine) {
                searchEngineSelect.value = savedSearchEngine;
                if (savedSearchEngine === 'custom' && savedCustomSearchUrl) {
                    customSearchContainer.style.display = 'block';
                    customSearchUrlInput.value = savedCustomSearchUrl;
                } else {
                    customSearchContainer.style.display = 'none';
                }
            }
            
            if (savedNotepadContent) {
                notepadContent.value = savedNotepadContent;
            }
            
            if (savedMeritCount) {
                meritCount.textContent = savedMeritCount;
            }
            
            updateCustomSearchInput();
        }
        
        function saveSettings() {
            localStorage.setItem('showWallpaper', showWallpaperCheckbox.checked);
            localStorage.setItem('darkMode', darkModeCheckbox.checked);
            localStorage.setItem('weatherApiKey', weatherApiKeyInput.value);
            localStorage.setItem('searchEngine', searchEngineSelect.value);
            localStorage.setItem('customSearchUrl', customSearchUrlInput.value);
        }

        function saveNotepad() {
            localStorage.setItem('notepadContent', notepadContent.value);
        }
        
        function applySettings() {
            if (showWallpaperCheckbox.checked) {
                document.body.classList.remove('no-wallpaper');
            } else {
                document.body.classList.add('no-wallpaper');
                document.body.style.backgroundImage = 'none';
            }
            
            // 应用深色模式
            if (darkModeCheckbox.checked) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        }
        
        settingsBtn.addEventListener('click', () => {
            settingsPanel.classList.add('active');
        });
        
        closeSettings.addEventListener('click', () => {
            saveSettings();
            settingsPanel.classList.remove('active');
            // 刷新页面以应用新设置
            setTimeout(() => {
                window.location.reload();
            }, 100);
        });
        
        cancelSettings.addEventListener('click', () => {
            // 直接关闭设置面板，不保存也不刷新
            settingsPanel.classList.remove('active');
            // 重新加载设置，恢复到之前保存的状态
            loadSettings();
        });
        
        // 模式切换功能
        let isSimpleMode = true; // 默认简洁模式
        
        function toggleMode() {
            isSimpleMode = !isSimpleMode;
            localStorage.setItem('isSimpleMode', isSimpleMode);
            updateModeUI();
        }
        
        function updateModeUI() {
            const modeIcon = modeToggleBtn.querySelector('i');
            if (isSimpleMode) {
                // 简洁模式
                modeIcon.className = 'fa-solid fa-leaf';
                modeToggleBtn.title = '切换到丰富模式';
                
                // 应用简洁模式样式
                searchCard.style.background = 'transparent';
                searchCard.style.backdropFilter = 'none';
                searchCard.style.boxShadow = 'none';
                searchCard.style.borderRadius = '0';
                searchCard.style.padding = '0';
                quickSearch.style.display = 'none';
                document.querySelector('.widgets-section').style.display = 'none';
                timeSection.style.display = 'none';
            } else {
                // 丰富模式
                modeIcon.className = 'fa-solid fa-layer-group';
                modeToggleBtn.title = '切换到简洁模式';
                
                // 应用丰富模式样式
                if (darkModeCheckbox.checked) {
                    searchCard.style.background = 'rgba(31, 41, 55, 0.92)';
                    searchCard.style.backdropFilter = 'blur(12px)';
                    searchCard.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)';
                } else {
                    searchCard.style.background = 'rgba(255, 255, 255, 0.92)';
                    searchCard.style.backdropFilter = 'blur(12px)';
                    searchCard.style.boxShadow = 'var(--shadow-lg)';
                }
                searchCard.style.borderRadius = '24px';
                searchCard.style.padding = '40px';
                quickSearch.style.display = 'block';
                document.querySelector('.widgets-section').style.display = 'block';
                timeSection.style.display = 'block';
            }
        }
        
        // 加载模式设置
        function loadModeSettings() {
            const savedMode = localStorage.getItem('isSimpleMode');
            if (savedMode !== null) {
                isSimpleMode = savedMode === 'true';
            }
            updateModeUI();
        }
        
        // 添加模式切换按钮点击事件
        modeToggleBtn.addEventListener('click', toggleMode);
        
        document.addEventListener('click', (event) => {
            if (!settingsPanel.contains(event.target) && 
                event.target !== settingsBtn && 
                !settingsBtn.contains(event.target)) {
                settingsPanel.classList.remove('active');
            }
        });
        
        // 小组件点击事件
        const widgetItems = document.querySelectorAll('.widget-item');
        widgetItems.forEach(item => {
            item.addEventListener('click', () => {
                const widgetType = item.dataset.widget;
                openWidgetWindow(widgetType);
            });
        });
        
        // 关闭窗口事件
        closeWindowButtons.forEach(button => {
            button.addEventListener('click', () => {
                const windowId = button.dataset.window;
                document.getElementById(windowId).style.display = 'none';
            });
        });
        
        // 初始设置窗口样式
        const widgetWindows = document.querySelectorAll('.widget-window');
        widgetWindows.forEach(window => {
            window.style.position = 'fixed';
            window.style.left = '50%';
            window.style.top = '50%';
            window.style.transform = 'translate(-50%, -50%)';
            window.style.zIndex = '1100';
        });
        
        // 记事本保存事件
        notepadContent.addEventListener('input', saveNotepad);
        
        // Markdown工具栏事件处理
        function initMarkdownToolbar() {
            const mdButtons = document.querySelectorAll('.md-btn');
            mdButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const mdType = btn.dataset.md;
                    insertMarkdown(mdType);
                });
            });
        }
        
        function insertMarkdown(type) {
            const textarea = notepadContent;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selectedText = textarea.value.substring(start, end);
            let markdownText = '';
            
            switch(type) {
                case 'h1':
                    markdownText = `# ${selectedText || '标题 1'}\n\n`;
                    break;
                case 'h2':
                    markdownText = `## ${selectedText || '标题 2'}\n\n`;
                    break;
                case 'h3':
                    markdownText = `### ${selectedText || '标题 3'}\n\n`;
                    break;
                case 'bold':
                    markdownText = `**${selectedText || '粗体文本'}**`;
                    break;
                case 'italic':
                    markdownText = `*${selectedText || '斜体文本'}*`;
                    break;
                case 'strikethrough':
                    markdownText = `~~${selectedText || '删除线文本'}~~`;
                    break;
                case 'list-ul':
                    markdownText = `- ${selectedText || '列表项'}\n`;
                    break;
                case 'list-ol':
                    markdownText = `1. ${selectedText || '列表项'}\n`;
                    break;
                case 'link':
                    const linkText = selectedText || '链接文本';
                    const linkUrl = prompt('请输入链接URL:', 'https://');
                    if (linkUrl) {
                        markdownText = `[${linkText}](${linkUrl})`;
                    }
                    break;
                case 'image':
                    const imgAlt = selectedText || '图片描述';
                    const imgUrl = prompt('请输入图片URL:', 'https://');
                    if (imgUrl) {
                        markdownText = `![${imgAlt}](${imgUrl})`;
                    }
                    break;
                case 'code':
                    markdownText = `\`${selectedText || '代码'}\``;
                    break;
                case 'quote':
                    markdownText = `> ${selectedText || '引用文本'}\n\n`;
                    break;
            }
            
            if (markdownText) {
                const newValue = textarea.value.substring(0, start) + markdownText + textarea.value.substring(end);
                textarea.value = newValue;
                textarea.focus();
                const newPosition = start + markdownText.length;
                textarea.setSelectionRange(newPosition, newPosition);
                saveNotepad();
            }
        }
        
        // 初始化Markdown工具栏
        initMarkdownToolbar();
        
        // 初始化Markdown预览功能
        initMarkdownPreview();
        
        // 初始化文件操作功能
        initFileOperations();
        
        // 初始化彩蛋功能
        initEasterEgg();
        
        function initEasterEgg() {
            let easterEggActive = false;
            let inputBuffer = '';
            const easterEggCode = 'Ruanm';
            
            // 监听整个文档的按键事件
            document.addEventListener('keydown', (e) => {
                // 获取按下的字符
                const char = e.key.toLowerCase();
                inputBuffer += char;
                // 只保留最近的6个字符
                if (inputBuffer.length > easterEggCode.length) {
                    inputBuffer = inputBuffer.slice(-easterEggCode.length);
                }
                
                // 检查是否输入了彩蛋代码
                if (inputBuffer === easterEggCode.toLowerCase()) {
                    toggleEasterEgg();
                    inputBuffer = '';
                }
            });
            
            function toggleEasterEgg() {
                easterEggActive = !easterEggActive;
                
                if (easterEggActive) {
                    // 激活彩蛋：添加彩色背景类
                    document.body.classList.add('easter-egg-active');
                } else {
                    // 取消激活：移除彩色背景类
                    document.body.classList.remove('easter-egg-active');
                }
            }
        }
        
        function initFileOperations() {
            const findBtn = document.getElementById('file-find');
            const replaceBtn = document.getElementById('file-replace');
            const importBtn = document.getElementById('file-import');
            const exportBtn = document.getElementById('file-export');
            
            findBtn.addEventListener('click', () => {
                const findText = prompt('请输入要查找的内容:');
                if (findText) {
                    findInTextarea(findText);
                }
            });
            
            replaceBtn.addEventListener('click', () => {
                const findText = prompt('请输入要查找的内容:');
                if (findText) {
                    const replaceText = prompt('请输入替换内容:', '');
                    if (replaceText !== null) {
                        replaceInTextarea(findText, replaceText);
                    }
                }
            });
            
            importBtn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.md,.txt';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            notepadContent.value = event.target.result;
                            saveNotepad();
                            alert('文件导入成功!');
                        };
                        reader.readAsText(file);
                    }
                };
                input.click();
            });
            
            exportBtn.addEventListener('click', () => {
                const content = notepadContent.value;
                const blob = new Blob([content], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `document-${new Date().toISOString().slice(0, 10)}.md`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        }
        
        function findInTextarea(text) {
            const textarea = notepadContent;
            const value = textarea.value;
            const index = value.indexOf(text);
            
            if (index !== -1) {
                textarea.focus();
                textarea.setSelectionRange(index, index + text.length);
            } else {
                alert('未找到指定内容!');
            }
        }
        
        function replaceInTextarea(findText, replaceText) {
            const textarea = notepadContent;
            const value = textarea.value;
            const newValue = value.replace(new RegExp(findText, 'g'), replaceText);
            
            if (newValue !== value) {
                textarea.value = newValue;
                saveNotepad();
                alert('替换完成!');
            } else {
                alert('未找到指定内容!');
            }
        }
        
        function initMarkdownPreview() {
            const previewBtn = document.getElementById('md-preview-btn');
            const editBtn = document.getElementById('md-edit-btn');
            const editor = document.getElementById('notepad-editor');
            const preview = document.getElementById('notepad-preview');
            
            previewBtn.addEventListener('click', () => {
                const markdownText = notepadContent.value;
                const htmlText = parseMarkdown(markdownText);
                preview.innerHTML = htmlText;
                editor.style.display = 'none';
                preview.style.display = 'block';
                previewBtn.style.display = 'none';
                editBtn.style.display = 'flex';
            });
            
            editBtn.addEventListener('click', () => {
                editor.style.display = 'block';
                preview.style.display = 'none';
                previewBtn.style.display = 'flex';
                editBtn.style.display = 'none';
                notepadContent.focus();
            });
        }
        
        function parseMarkdown(markdown) {
            // 基本的Markdown解析
            return markdown
                // 标题
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                // 粗体和斜体
                .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                .replace(/\*(.*)\*/gim, '<em>$1</em>')
                // 删除线
                .replace(/~~(.*)~~/gim, '<del>$1</del>')
                // 无序列表
                .replace(/^- (.*$)/gim, '<li>$1</li>')
                .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
                // 有序列表
                .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
                .replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>')
                // 链接
                .replace(/\[(.*)\]\((.*)\)/gim, '<a href="$2" target="_blank" rel="noopener">$1</a>')
                // 图片
                .replace(/!\[(.*)\]\((.*)\)/gim, '<img src="$2" alt="$1">')
                // 行内代码
                .replace(/`(.*)`/gim, '<code>$1</code>')
                // 引用
                .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
                // 段落
                .replace(/^(?!<h[1-6]>)(?!<ul>)(?!<ol>)(?!<li>)(?!<blockquote>)(.*$)/gim, '<p>$1</p>')
                // 清理多余的空行
                .replace(/\n{3,}/gim, '\n\n');
        }
        
        // 木鱼点击事件
        woodenFish.addEventListener('click', () => {
            const currentCount = parseInt(meritCount.textContent) || 0;
            const newCount = currentCount + 1;
            meritCount.textContent = newCount;
            // 保存功德值到本地存储
            localStorage.setItem('meritCount', newCount.toString());
            woodenFish.style.transform = 'scale(0.8)';
            
            // 切换到敲击时的图片
            woodenFishImage.src = 'Assets/When-tapping.png';
            
            // 播放敲击木鱼声
            const audio = new Audio('Assets/Knocking-the-woodenfish.wav');
            audio.play().catch(error => {
                console.log('播放声音失败:', error);
            });
            
            setTimeout(() => {
                woodenFish.style.transform = 'scale(1)';
                // 恢复默认图片
                woodenFishImage.src = 'Assets/Default.png';
            }, 100);
        });
        
        // 打开小组件窗口
        function openWidgetWindow(widgetType) {
            // 关闭所有窗口
            document.querySelectorAll('.widget-window').forEach(window => {
                window.style.display = 'none';
            });
            
            // 打开对应窗口
            if (widgetType === 'notepad') {
                notepadWindow.style.display = 'flex';
            } else if (widgetType === 'weather') {
                weatherWindow.style.display = 'flex';
                loadWeather();
            } else if (widgetType === 'wooden-fish') {
                woodenFishWindow.style.display = 'flex';
            }
        }
        
        // 加载天气数据
        async function loadWeather() {
            const apiKey = weatherApiKeyInput.value.trim();
            
            if (!apiKey) {
                weatherContent.innerHTML = `
                    <div class="weather-error">
                        <i class="fa-solid fa-exclamation-triangle"></i>
                        <p>请在设置中输入 OpenWeatherMap API Key</p>
                    </div>
                `;
                return;
            }
            
            weatherContent.innerHTML = `
                <div class="weather-loading">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <p>正在加载天气...</p>
                </div>
            `;
            
            try {
                // 获取用户位置
                if (!navigator.geolocation) {
                    throw new Error('浏览器不支持地理定位');
                }
                
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });
                
                const { latitude, longitude } = position.coords;
                
                // 调用 OpenWeatherMap API
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=zh_cn`
                );
                
                if (!response.ok) {
                    throw new Error('API 请求失败');
                }
                
                const data = await response.json();
                displayWeather(data);
            } catch (error) {
                weatherContent.innerHTML = `
                    <div class="weather-error">
                        <i class="fa-solid fa-exclamation-triangle"></i>
                        <p>加载天气失败: ${error.message}</p>
                    </div>
                `;
            }
        }
        
        // 显示天气数据
        function displayWeather(data) {
            const weatherIcon = getWeatherIcon(data.weather[0].main);
            
            weatherContent.innerHTML = `
                <div class="weather-info">
                    <h2>${data.name}</h2>
                    <div class="weather-main">
                        <div class="weather-icon">
                            <i class="fa-solid ${weatherIcon}"></i>
                        </div>
                        <div class="weather-temp">${Math.round(data.main.temp)}°C</div>
                    </div>
                    <div class="weather-desc">${data.weather[0].description}</div>
                    <div class="weather-details">
                        <div class="weather-detail-item">
                            <i class="fa-solid fa-tint"></i>
                            <div class="label">湿度</div>
                            <div class="value">${data.main.humidity}%</div>
                        </div>
                        <div class="weather-detail-item">
                            <i class="fa-solid fa-wind"></i>
                            <div class="label">风速</div>
                            <div class="value">${data.wind.speed} m/s</div>
                        </div>
                        <div class="weather-detail-item">
                            <i class="fa-solid fa-temperature-low"></i>
                            <div class="label">最低温</div>
                            <div class="value">${Math.round(data.main.temp_min)}°C</div>
                        </div>
                        <div class="weather-detail-item">
                            <i class="fa-solid fa-temperature-high"></i>
                            <div class="label">最高温</div>
                            <div class="value">${Math.round(data.main.temp_max)}°C</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // 获取天气图标
        function getWeatherIcon(weatherMain) {
            const iconMap = {
                'Clear': 'fa-sun',
                'Clouds': 'fa-cloud',
                'Rain': 'fa-cloud-rain',
                'Snow': 'fa-snowflake',
                'Thunderstorm': 'fa-bolt',
                'Drizzle': 'fa-cloud-drizzle',
                'Mist': 'fa-smog',
                'Fog': 'fa-smog'
            };
            return iconMap[weatherMain] || 'fa-cloud-sun';
        }
        
        showWallpaperCheckbox.addEventListener('change', (e) => {
            saveSettings();
            if (e.target.checked) {
                document.body.classList.remove('no-wallpaper');
                loadWallpaper();
            } else {
                document.body.classList.add('no-wallpaper');
                document.body.style.backgroundImage = 'none';
            }
        });
        
        
        
        
        
        
        refreshWallpaperBtn.addEventListener('click', () => {
            if (showWallpaperCheckbox.checked) {
                loadWallpaper(true);
            }
        });
        
        resetSettingsBtn.addEventListener('click', () => {
            if (confirm('确定要恢复默认设置吗？这将清除所有本地存储的数据。')) {
                localStorage.clear();
                showWallpaperCheckbox.checked = true;
                weatherApiKeyInput.value = '';
                searchEngineSelect.value = 'https://cn.bing.com/search?q=%text%';
                customSearchUrlInput.value = '';
                customSearchContainer.style.display = 'none';
                timeSection.style.display = 'block';
                searchCard.style.background = 'rgba(255, 255, 255, 0.95)';
                searchCard.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
                searchCard.style.padding = '30px 40px';
                quickSearch.style.display = 'block';
                document.body.classList.remove('no-wallpaper');
                loadWallpaper();
            }
        });
        
        function updateCustomSearchInput() {
            if (searchEngineSelect.value === 'custom') {
                customSearchContainer.style.display = 'block';
            } else {
                customSearchContainer.style.display = 'none';
            }
            saveSettings();
        }
        
        searchEngineSelect.addEventListener('change', (e) => {
            updateCustomSearchInput();
            saveSettings();
        });
        
        customSearchUrlInput.addEventListener('input', (e) => {
            saveSettings();
        });
        
        document.addEventListener('DOMContentLoaded', () => {
            loadSettings();
            loadModeSettings();
            applySettings();
            
            const searchInput = document.getElementById('search-input');
            const updatePlaceholder = () => {
                if (window.innerWidth <= 768) {
                    searchInput.placeholder = '搜索内容';
                    searchInput.style.height = '60px';
                    searchInput.style.padding = '0 20px 0 50px';
                    searchInput.style.boxSizing = 'border-box';
                } else {
                    searchInput.placeholder = '输入你想搜索的内容，回车或点击搜索';
                    searchInput.style.height = '56px';
                    searchInput.style.padding = '0 20px 0 55px';
                    searchInput.style.boxSizing = 'border-box';
                }
            };
            updatePlaceholder();
            window.addEventListener('resize', updatePlaceholder);
        });