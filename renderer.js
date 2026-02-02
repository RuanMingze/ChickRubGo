        // IndexedDB 数据库配置
        const DB_NAME = 'ChickRubGoDB';
        const DB_VERSION = 1;
        const STORE_NAME = 'audioStore';
        let db = null;

        // 初始化 IndexedDB
        async function initIndexedDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);
                
                request.onerror = () => {
                    console.error('IndexedDB 打开失败:', request.error);
                    reject(request.error);
                };
                
                request.onsuccess = () => {
                    db = request.result;
                    resolve(db);
                };
                
                request.onupgradeneeded = (event) => {
                    const database = event.target.result;
                    if (!database.objectStoreNames.contains(STORE_NAME)) {
                        const objectStore = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                        objectStore.createIndex('name', 'name', { unique: false });
                    }
                };
            });
        }

        // 保存音频到 IndexedDB
        async function saveAudioToIndexedDB(audioData, fileName) {
            if (!db) {
                await initIndexedDB();
            }
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const objectStore = transaction.objectStore(STORE_NAME);
                
                const audioRecord = {
                    id: 'bgMusic',
                    name: fileName,
                    data: audioData,
                    timestamp: Date.now()
                };
                
                const request = objectStore.put(audioRecord);
                
                request.onsuccess = () => {
                    resolve();
                };
                
                request.onerror = () => {
                    console.error('音频保存到 IndexedDB 失败:', request.error);
                    reject(request.error);
                };
            });
        }

        // 从 IndexedDB 加载音频，如果找不到则尝试从本地存储读取
        async function loadAudioFromIndexedDB() {
            if (!db) {
                await initIndexedDB();
            }
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const objectStore = transaction.objectStore(STORE_NAME);
                const request = objectStore.get('bgMusic');
                
                request.onsuccess = () => {
                    if (request.result) {
                        
                        resolve({ data: request.result.data, name: request.result.name });
                    } else {
                        
                        // 从本地存储读取
                        const savedBgMusic = localStorage.getItem('bgMusic');
                        const savedBgMusicName = localStorage.getItem('bgMusicName');
                        if (savedBgMusic && savedBgMusicName) {
                            
                            // 将本地存储的音频迁移到 IndexedDB
                            saveAudioToIndexedDB(savedBgMusic, savedBgMusicName).catch(err => {
                                console.error('迁移音频到 IndexedDB 失败:', err);
                            });
                            resolve({ data: savedBgMusic, name: savedBgMusicName });
                        } else {
                            
                            resolve(null);
                        }
                    }
                };
                
                request.onerror = () => {
                    console.error('从 IndexedDB 加载音频失败:', request.error);
                    // 尝试从本地存储读取
                    const savedBgMusic = localStorage.getItem('bgMusic');
                    const savedBgMusicName = localStorage.getItem('bgMusicName');
                    if (savedBgMusic && savedBgMusicName) {
                        
                        resolve({ data: savedBgMusic, name: savedBgMusicName });
                    } else {
                        reject(request.error);
                    }
                };
            });
        }

        // 删除 IndexedDB 中的音频
        async function deleteAudioFromIndexedDB() {
            if (!db) {
                await initIndexedDB();
            }
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const objectStore = transaction.objectStore(STORE_NAME);
                const request = objectStore.delete('bgMusic');
                
                request.onsuccess = () => {
                    
                    resolve();
                };
                
                request.onerror = () => {
                    console.error('从 IndexedDB 删除音频失败:', request.error);
                    reject(request.error);
                };
            });
        }

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
        window.addEventListener('load', () => {
            // 加载显示动画设置
            const showAnimations = localStorage.getItem('showAnimations') !== 'false';
            document.getElementById('show-animations').checked = showAnimations;
            
            // 根据设置初始化AOS动画库
            if (showAnimations) {
                AOS.init({
                    duration: 800,
                    easing: 'ease-in-out',
                    once: true
                });
            } else {
                // 当关闭动画时，确保所有元素可见且不显示动画
                const animatedElements = document.querySelectorAll('[data-aos]');
                animatedElements.forEach(element => {
                    // 移除data-aos属性，防止AOS处理
                    element.removeAttribute('data-aos');
                    element.removeAttribute('data-aos-duration');
                    element.removeAttribute('data-aos-delay');
                    // 确保元素可见
                    element.style.opacity = '1';
                    element.style.visibility = 'visible';
                    element.style.transform = 'none';
                    element.style.transition = 'none';
                });
            }
        });
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
        const autoLocationCheckbox = document.getElementById('auto-location');
        const weatherCityInput = document.getElementById('weather-city');
        const searchEngineSelect = document.getElementById('search-engine');
        const customSearchUrlInput = document.getElementById('custom-search-url');
        const customSearchContainer = document.getElementById('custom-search-container');
        const darkModeCheckbox = document.getElementById('dark-mode');
        const bgMusicInput = document.getElementById('bg-music');
        const bgMusicInfo = document.getElementById('bg-music-info');
        const musicControls = document.getElementById('music-controls');
        const musicPlayPause = document.getElementById('music-play-pause');
        const musicVolume = document.getElementById('music-volume');
        const musicVolumeLabel = document.getElementById('music-volume-label');
        let audioPlayer = null;
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
            const savedShowAnimations = localStorage.getItem('showAnimations');
            const savedBgMusicName = localStorage.getItem('bgMusicName');
            
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
            
            if (savedShowAnimations !== null) {
                document.getElementById('show-animations').checked = savedShowAnimations === 'true';
            }
            
            if (savedWeatherApiKey) {
                weatherApiKeyInput.value = savedWeatherApiKey;
            }
            
            // 加载自动定位设置
            const savedAutoLocation = localStorage.getItem('autoLocation') === 'true';
            if (autoLocationCheckbox) {
                autoLocationCheckbox.checked = savedAutoLocation;
            }
            
            // 加载城市设置
            const savedWeatherCity = localStorage.getItem('weatherCity');
            if (weatherCityInput && savedWeatherCity) {
                weatherCityInput.value = savedWeatherCity;
            } else if (weatherCityInput) {
                // 默认城市：德清
                weatherCityInput.value = 'deqing';
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
            
            // 加载背景音乐设置
            if (savedBgMusicName) {
                bgMusicInfo.textContent = `已选择: ${savedBgMusicName}`;
            } else {
                bgMusicInfo.textContent = "未选择音乐文件";
            }
            
            // 从 IndexedDB 加载背景音乐并初始化播放器
            loadAudioFromIndexedDB().then(audioRecord => {
                if (audioRecord) {
                    initBackgroundMusic(audioRecord.data);
                }
            }).catch(error => {
                console.error('从 IndexedDB 加载音频失败:', error);
            });
            
            // 更新音乐控制UI
            updateMusicControls();
            
            updateCustomSearchInput();
        }
        
        function isLocalStorageAvailable() {
            try {
                const test = 'test';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch (e) {
                return false;
            }
        }

        function saveSettings() {
            try {
                if (!isLocalStorageAvailable()) {
                    throw new Error('localStorage不可用');
                }
                localStorage.setItem('showWallpaper', showWallpaperCheckbox.checked);
                localStorage.setItem('darkMode', darkModeCheckbox.checked);
                localStorage.setItem('showAnimations', document.getElementById('show-animations').checked);
                localStorage.setItem('weatherApiKey', weatherApiKeyInput.value);
                localStorage.setItem('searchEngine', searchEngineSelect.value);
                localStorage.setItem('customSearchUrl', customSearchUrlInput.value);
                // 保存自动定位设置
                if (autoLocationCheckbox) {
                    localStorage.setItem('autoLocation', autoLocationCheckbox.checked);
                }
                // 保存城市设置
                if (weatherCityInput) {
                    localStorage.setItem('weatherCity', weatherCityInput.value);
                }
                
            } catch (error) {
                console.error('保存设置失败:', error);
                ShowAlert('错误', '保存设置失败: ' + error.message);
            }
        }

        function saveNotepad() {
            try {
                if (!isLocalStorageAvailable()) {
                    throw new Error('localStorage不可用');
                }
                localStorage.setItem('notepadContent', notepadContent.value);
                
            } catch (error) {
                console.error('保存记事本失败:', error);
                ShowAlert('错误', '保存记事本失败: ' + error.message);
            }
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
        
        // 音乐文件选择事件
        if (bgMusicInput) {
            bgMusicInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    // 检查文件类型
                    if (file.type.includes('video/mp4')) {
                        // MP4文件，需要使用FFmpeg转换
                        handleMP4File(file);
                    } else if (file.type.includes('audio/')) {
                        // 音频文件，直接处理
                        handleAudioFile(file);
                    } else {
                        ShowAlert('错误', '不支持的文件类型，请选择音频文件或MP4视频文件');
                    }
                }
            });
        }

        // 处理音频文件
        function handleAudioFile(file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const audioData = event.target.result;
                    // 保存到 IndexedDB
                    await saveAudioToIndexedDB(audioData, file.name);
                    // 保存文件名到 localStorage
                    localStorage.setItem('bgMusicName', file.name);
                    bgMusicInfo.textContent = `已选择: ${file.name}`;
                    
                    // 初始化并播放背景音乐
                    initBackgroundMusic(audioData);
                } catch (error) {
                    console.error('保存音乐文件失败:', error);
                    ShowAlert('错误', '保存音乐文件失败: ' + error.message);
                }
            };
            reader.onerror = (error) => {
                console.error('读取音乐文件失败:', error);
                ShowAlert('错误', '读取音乐文件失败: ' + error.message);
            };
            reader.readAsDataURL(file);
        }

        // 处理MP4文件
        async function handleMP4File(file) {
            try {
                ShowAlert('提示', '正在处理视频文件，请稍候...', false, 0);
                
                // 使用简化的方法处理MP4文件
                // 由于CORS限制，我们直接读取文件并尝试播放音频部分
                const fileReader = new FileReader();
                const fileData = await new Promise((resolve, reject) => {
                    fileReader.onload = () => resolve(fileReader.result);
                    fileReader.onerror = reject;
                    fileReader.readAsDataURL(file);
                });
                
                // 保存到IndexedDB
                const outputFileName = file.name.replace(/\.mp4$/i, '.mp3');
                await saveAudioToIndexedDB(fileData, outputFileName);
                
                // 保存文件名到localStorage
                localStorage.setItem('bgMusicName', outputFileName);
                
                bgMusicInfo.textContent = `已选择: ${outputFileName} (MP4文件)`;
                
                
                // 初始化并播放背景音乐
                initBackgroundMusic(fileData);
                
                // 关闭提示
                const alertElement = document.querySelector('.alert');
                if (alertElement) {
                    alertElement.remove();
                }
                ShowAlert('成功', '视频文件处理完成！', true, 2000);
                
            } catch (error) {
                console.error('处理MP4文件失败:', error);
                ShowAlert('错误', '处理视频文件失败: ' + error.message);
            }
        }

        // 音乐控制按钮事件监听器
        if (musicPlayPause) {
            musicPlayPause.addEventListener('click', () => {
                if (audioPlayer) {
                    if (audioPlayer.paused) {
                        audioPlayer.play().catch(error => {
                            
                            if (error.name === 'NotAllowedError') {
                                ShowConfirm('背景音乐', '需要您的授权才能播放音乐，是否授权？', (confirmed) => {
                                    if (confirmed) {
                                        localStorage.setItem('musicPermission', 'true');
                                        audioPlayer.play().catch(err => {
                                            
                                            ShowAlert('错误', '播放音乐失败，请稍后重试');
                                        });
                                    }
                                });
                            }
                        });
                    } else {
                        audioPlayer.pause();
                    }
                    // 更新音乐控制UI
                    updateMusicControls();
                }
            });
        }

        // 音量滑块事件监听器
        if (musicVolume) {
            musicVolume.addEventListener('input', () => {
                if (audioPlayer) {
                    audioPlayer.volume = parseFloat(musicVolume.value);
                    musicVolumeLabel.textContent = `${Math.round(audioPlayer.volume * 100)}%`;
                }
            });
        }
        
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
                
                // 添加简洁模式类到body
                document.body.classList.add('minimal-mode');
                
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
                
                // 从body移除简洁模式类
                document.body.classList.remove('minimal-mode');
                
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
            
            // 处理不需要用户输入的Markdown类型
            if (type !== 'link' && type !== 'image') {
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
            } else {
                // 处理需要用户输入的Markdown类型
                switch(type) {
                    case 'link':
                        const linkText = selectedText || '链接文本';
                        ShowPrompt('链接', '请输入链接URL:', 'https://', (linkUrl) => {
                            if (linkUrl) {
                                const linkMarkdown = `[${linkText}](${linkUrl})`;
                                const newValue = textarea.value.substring(0, start) + linkMarkdown + textarea.value.substring(end);
                                textarea.value = newValue;
                                textarea.focus();
                                const newPosition = start + linkMarkdown.length;
                                textarea.setSelectionRange(newPosition, newPosition);
                                saveNotepad();
                            }
                        });
                        break;
                    case 'image':
                        const imgAlt = selectedText || '图片描述';
                        ShowPrompt('图片', '请输入图片URL:', 'https://', (imgUrl) => {
                            if (imgUrl) {
                                const imgMarkdown = `![${imgAlt}](${imgUrl})`;
                                const newValue = textarea.value.substring(0, start) + imgMarkdown + textarea.value.substring(end);
                                textarea.value = newValue;
                                textarea.focus();
                                const newPosition = start + imgMarkdown.length;
                                textarea.setSelectionRange(newPosition, newPosition);
                                saveNotepad();
                            }
                        });
                        break;
                }
            }
        }
        
        // 初始化Markdown工具栏
        initMarkdownToolbar();
        
        // 初始化Markdown预览功能
        initMarkdownPreview();
        
        // 初始化文件操作功能
        initFileOperations();
        
        // 自定义弹窗函数
        function ShowAlert(title, message, autoClose = false, closeTime = 3000) {
            const alertElement = document.getElementById('custom-alert');
            const alertTitle = document.getElementById('alert-title');
            const alertMessage = document.getElementById('alert-message');
            const alertClose = document.getElementById('alert-close');
            
            // 设置弹窗内容
            alertTitle.textContent = title || '提示';
            alertMessage.textContent = message || '';
            
            // 显示弹窗
            alertElement.classList.add('active');
            
            // 关闭按钮点击事件
            alertClose.onclick = function() {
                alertElement.classList.remove('active');
            };
            
            // 点击弹窗外部关闭
            alertElement.onclick = function(e) {
                if (e.target === alertElement) {
                    alertElement.classList.remove('active');
                }
            };
            
            // 自动关闭
            if (autoClose) {
                setTimeout(function() {
                    alertElement.classList.remove('active');
                }, closeTime);
            }
        }
        
        // 自定义确认框函数
        function ShowConfirm(title, message, callback) {
            const confirmElement = document.getElementById('custom-confirm');
            const confirmTitle = document.getElementById('confirm-title');
            const confirmMessage = document.getElementById('confirm-message');
            const confirmBtn = document.getElementById('confirm-btn');
            const cancelBtn = document.getElementById('cancel-btn');
            const confirmClose = document.getElementById('confirm-close');
            
            // 设置弹窗内容
            confirmTitle.textContent = title || '确认';
            confirmMessage.textContent = message || '';
            
            // 显示弹窗
            confirmElement.classList.add('active');
            
            // 确认按钮点击事件
            confirmBtn.onclick = function() {
                confirmElement.classList.remove('active');
                if (typeof callback === 'function') {
                    callback(true);
                }
            };
            
            // 取消按钮点击事件
            cancelBtn.onclick = function() {
                confirmElement.classList.remove('active');
                if (typeof callback === 'function') {
                    callback(false);
                }
            };
            
            // 关闭按钮点击事件
            confirmClose.onclick = function() {
                confirmElement.classList.remove('active');
                if (typeof callback === 'function') {
                    callback(false);
                }
            };
            
            // 点击弹窗外部关闭
            confirmElement.onclick = function(e) {
                if (e.target === confirmElement) {
                    confirmElement.classList.remove('active');
                    if (typeof callback === 'function') {
                        callback(false);
                    }
                }
            };
        }
        
        // 自定义文本输入框函数
        function ShowPrompt(title, message, defaultValue = '', callback) {
            const promptElement = document.getElementById('custom-prompt');
            const promptTitle = document.getElementById('prompt-title');
            const promptMessage = document.getElementById('prompt-message');
            const promptInput = document.getElementById('prompt-input');
            const promptConfirmBtn = document.getElementById('prompt-confirm-btn');
            const promptCancelBtn = document.getElementById('prompt-cancel-btn');
            const promptClose = document.getElementById('prompt-close');
            
            // 设置弹窗内容
            promptTitle.textContent = title || '输入';
            promptMessage.textContent = message || '';
            promptInput.value = defaultValue || '';
            
            // 显示弹窗
            promptElement.classList.add('active');
            
            // 自动聚焦输入框
            setTimeout(function() {
                promptInput.focus();
            }, 100);
            
            // 确认按钮点击事件
            promptConfirmBtn.onclick = function() {
                const value = promptInput.value;
                promptElement.classList.remove('active');
                if (typeof callback === 'function') {
                    callback(value);
                }
            };
            
            // 取消按钮点击事件
            promptCancelBtn.onclick = function() {
                promptElement.classList.remove('active');
                if (typeof callback === 'function') {
                    callback(null);
                }
            };
            
            // 关闭按钮点击事件
            promptClose.onclick = function() {
                promptElement.classList.remove('active');
                if (typeof callback === 'function') {
                    callback(null);
                }
            };
            
            // 点击弹窗外部关闭
            promptElement.onclick = function(e) {
                if (e.target === promptElement) {
                    promptElement.classList.remove('active');
                    if (typeof callback === 'function') {
                        callback(null);
                    }
                }
            };
            
            // 回车键确认
            promptInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const value = promptInput.value;
                    promptElement.classList.remove('active');
                    if (typeof callback === 'function') {
                        callback(value);
                    }
                }
            });
        }
        
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
                    // 检查是否为简洁模式
                    if (document.body.classList.contains('minimal-mode')) {
                        // 提示用户彩蛋模式只在丰富模式可用
                        ShowAlert('提示', '彩蛋模式只在丰富模式可用，请先切换到丰富模式！');
                    } else {
                        toggleEasterEgg();
                    }
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
                ShowPrompt('查找', '请输入要查找的内容:', '', (findText) => {
                    if (findText) {
                        findInTextarea(findText);
                    }
                });
            });
            
            replaceBtn.addEventListener('click', () => {
                ShowPrompt('查找', '请输入要查找的内容:', '', (findText) => {
                    if (findText) {
                        ShowPrompt('替换', '请输入替换内容:', '', (replaceText) => {
                            if (replaceText !== null) {
                                replaceInTextarea(findText, replaceText);
                            }
                        });
                    }
                });
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
                            ShowAlert('成功', '文件导入成功!', true, 2000);
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
                ShowAlert('提示', '未找到指定内容!', true, 2000);
            }
        }
        
        function replaceInTextarea(findText, replaceText) {
            const textarea = notepadContent;
            const value = textarea.value;
            const newValue = value.replace(new RegExp(findText, 'g'), replaceText);
            
            if (newValue !== value) {
                textarea.value = newValue;
                saveNotepad();
                ShowAlert('成功', '替换完成!', true, 2000);
            } else {
                ShowAlert('提示', '未找到指定内容!', true, 2000);
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
                let weatherData;
                const isAutoLocation = autoLocationCheckbox && autoLocationCheckbox.checked;
                const city = weatherCityInput ? weatherCityInput.value.trim() || 'deqing' : 'deqing';
                
                if (isAutoLocation && navigator.geolocation) {
                    // 尝试自动获取定位
                    try {
                        const position = await new Promise((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(resolve, reject);
                        });
                        
                        const { latitude, longitude } = position.coords;
                        
                        // 调用 OpenWeatherMap API (通过坐标)
                        const response = await fetch(
                            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=zh_cn`
                        );
                        
                        if (!response.ok) {
                            throw new Error('API 请求失败');
                        }
                        
                        weatherData = await response.json();
                    } catch (geoError) {
                        
                        // 自动定位失败，使用手动城市
                        const response = await fetch(
                            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=zh_cn`
                        );
                        
                        if (!response.ok) {
                            throw new Error('API 请求失败');
                        }
                        
                        weatherData = await response.json();
                    }
                } else {
                    // 不使用自动定位，使用手动城市
                    const response = await fetch(
                        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=zh_cn`
                    );
                    
                    if (!response.ok) {
                        throw new Error('API 请求失败');
                    }
                    
                    weatherData = await response.json();
                }
                
                displayWeather(weatherData);
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
        
        resetSettingsBtn.addEventListener('click', async () => {
            ShowConfirm('确认', '确定要恢复默认设置吗？这将清除所有本地存储的数据。', async (confirmed) => {
                if (confirmed) {
                    localStorage.clear();
                    // 删除 IndexedDB 中的音频数据
                    try {
                        await deleteAudioFromIndexedDB();
                    } catch (error) {
                        console.error('删除 IndexedDB 音频失败:', error);
                    }
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
                    // 停止并清除音频播放器
                    if (audioPlayer) {
                        audioPlayer.pause();
                        audioPlayer = null;
                    }
                    bgMusicInfo.textContent = "未选择音乐文件";
                    musicControls.style.display = 'none';
                    loadWallpaper();
                }
            });
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
        
        // 更新音乐控制UI
        function updateMusicControls() {
            if (audioPlayer) {
                musicControls.style.display = 'flex';
                
                // 更新播放/暂停按钮
                if (audioPlayer.paused) {
                    musicPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
                    musicPlayPause.title = '播放';
                } else {
                    musicPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i>';
                    musicPlayPause.title = '暂停';
                }
                
                // 更新音量滑块
                musicVolume.value = audioPlayer.volume;
                musicVolumeLabel.textContent = `${Math.round(audioPlayer.volume * 100)}%`;
            } else {
                musicControls.style.display = 'none';
            }
        }

        // 初始化背景音乐功能
        function initBackgroundMusic(audioData) {
            if (audioData) {
                if (audioPlayer) {
                    audioPlayer.pause();
                    audioPlayer = null;
                }
                audioPlayer = new Audio(audioData);
                audioPlayer.loop = true;
                audioPlayer.volume = 0.3;
                // 不自动播放，只更新音乐控制UI
                updateMusicControls();
            }
        }
        
        // 显示音乐播放授权弹窗
        async function showMusicPermissionPopup() {
            const savedBgMusicName = localStorage.getItem('bgMusicName');
            const hasAudioPermission = localStorage.getItem('audioPermission') === 'granted';
            
            
            
            
            if (savedBgMusicName) {
                if (hasAudioPermission && audioPlayer) {
                    // 已有授权，直接播放
                    
                    audioPlayer.play().then(() => {
                        
                        updateMusicControls();
                    }).catch(err => {
                        
                        // 授权可能已失效，重新显示授权弹窗
                        showPermissionDialog();
                    });
                } else {
                    // 没有授权或音频播放器不存在，显示授权弹窗
                    showPermissionDialog();
                }
            } else {
                
            }
        }
        
        // 显示授权弹窗
        function showPermissionDialog() {
            ShowConfirm('背景音乐', '检测到您之前设置了背景音乐，是否开始播放？', async (confirmed) => {
                
                if (confirmed) {
                    // 保存授权状态
                    localStorage.setItem('audioPermission', 'granted');
                    
                    if (audioPlayer) {
                        
                        audioPlayer.play().then(() => {
                            
                            updateMusicControls();
                        }).catch(err => {
                            
                            
                            
                            ShowAlert('错误', '播放音乐失败，请稍后重试');
                        });
                    } else {
                        
                        try {
                            const audioRecord = await loadAudioFromIndexedDB();
                            if (audioRecord) {
                                initBackgroundMusic(audioRecord.data);
                                audioPlayer.play().then(() => {
                                    
                                    updateMusicControls();
                                }).catch(err => {
                                    
                                    ShowAlert('错误', '播放音乐失败，请稍后重试');
                                });
                            } else {
                                ShowAlert('错误', '未找到保存的背景音乐');
                            }
                        } catch (error) {
                            console.error('从 IndexedDB 加载音频失败:', error);
                            ShowAlert('错误', '加载背景音乐失败');
                        }
                    }
                }
            });
        }

        document.addEventListener('DOMContentLoaded', async () => {
            // 初始化 IndexedDB
            try {
                await initIndexedDB();
            } catch (error) {
                console.error('IndexedDB 初始化失败:', error);
            }
            
            loadSettings();
            loadModeSettings();
            applySettings();
            
            // 等待音频播放器初始化完成后再显示授权弹窗
            setTimeout(showMusicPermissionPopup, 1000);
            
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