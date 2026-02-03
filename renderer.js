        // IndexedDB 数据库配置
        const DB_NAME = 'ChickRubGoDB';
        const DB_VERSION = 2;
        const AUDIO_STORE_NAME = 'audioStore';
        const SETTINGS_STORE_NAME = 'settingsStore';
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
                    if (!database.objectStoreNames.contains(AUDIO_STORE_NAME)) {
                        const objectStore = database.createObjectStore(AUDIO_STORE_NAME, { keyPath: 'id' });
                        objectStore.createIndex('name', 'name', { unique: false });
                    }
                    if (!database.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
                        const settingsStore = database.createObjectStore(SETTINGS_STORE_NAME, { keyPath: 'userId' });
                        settingsStore.createIndex('timestamp', 'timestamp', { unique: false });
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
                const transaction = db.transaction([AUDIO_STORE_NAME], 'readwrite');
                const objectStore = transaction.objectStore(AUDIO_STORE_NAME);
                
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
                const transaction = db.transaction([AUDIO_STORE_NAME], 'readwrite');
                const objectStore = transaction.objectStore(AUDIO_STORE_NAME);
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
        
        // 保存设置到 IndexedDB
        async function saveSettingsToIndexedDB(settings, userId) {
            if (!db) {
                await initIndexedDB();
            }
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([SETTINGS_STORE_NAME], 'readwrite');
                const objectStore = transaction.objectStore(SETTINGS_STORE_NAME);
                
                const settingsRecord = {
                    userId: userId || 'anonymous',
                    settings: settings,
                    timestamp: Date.now()
                };
                
                const request = objectStore.put(settingsRecord);
                
                request.onsuccess = () => {
                    resolve();
                };
                
                request.onerror = () => {
                    console.error('设置保存到 IndexedDB 失败:', request.error);
                    reject(request.error);
                };
            });
        }
        
        // 从 IndexedDB 加载设置
        async function loadSettingsFromIndexedDB(userId) {
            if (!db) {
                await initIndexedDB();
            }
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([SETTINGS_STORE_NAME], 'readonly');
                const objectStore = transaction.objectStore(SETTINGS_STORE_NAME);
                const request = objectStore.get(userId || 'anonymous');
                
                request.onsuccess = () => {
                    if (request.result) {
                        resolve(request.result.settings);
                    } else {
                        resolve(null);
                    }
                };
                
                request.onerror = () => {
                    console.error('从 IndexedDB 加载设置失败:', request.error);
                    reject(request.error);
                };
            });
        }
        
        // 保存设置到 Supabase 服务器
        async function saveSettingsToSupabase(settings) {
            try {
                // 检查用户是否登录
                const { data: { user } } = await supabaseClient.auth.getUser();
                if (!user) {
                    console.log('用户未登录，跳过服务器保存');
                    return false;
                }
                
                // 保存设置到 Supabase
                const { error } = await supabaseClient
                    .from('user_settings')
                    .upsert({
                        user_id: user.id,
                        username: user.user_metadata.full_name || user.user_metadata.name || user.email,
                        settings: settings,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'user_id'
                    });
                
                if (error) {
                    console.error('保存设置到 Supabase 失败:', error);
                    return false;
                }
                
                return true;
            } catch (error) {
                console.error('保存设置到 Supabase 出错:', error);
                return false;
            }
        }
        
        // 从 Supabase 服务器加载设置
        async function loadSettingsFromSupabase() {
            try {
                // 检查用户是否登录
                const { data: { user } } = await supabaseClient.auth.getUser();
                if (!user) {
                    console.log('用户未登录，跳过服务器加载');
                    return null;
                }
                
                // 从 Supabase 加载设置
                const { data, error } = await supabaseClient
                    .from('user_settings')
                    .select('settings')
                    .eq('user_id', user.id)
                    .single();
                
                if (error) {
                    console.error('从 Supabase 加载设置失败:', error);
                    return null;
                }
                
                return data?.settings || null;
            } catch (error) {
                console.error('从 Supabase 加载设置出错:', error);
                return null;
            }
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
                ShowAlert('错误', '糟糕！壁纸被流星撞飞了！刷新一下找找它～', true, 3000);
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

            // 保存搜索历史
            let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
            history = history.filter(item => item !== keyword);
            history.unshift(keyword);
            if (history.length > 10) {
                history = history.slice(0, 10);
            }
            localStorage.setItem('searchHistory', JSON.stringify(history));

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
            
            // 获取搜索方式设置
            const searchTarget = localStorage.getItem('searchTarget') || '_blank';
            // 根据设置决定是在新标签页打开还是在当前页面重定向
            if (searchTarget === '_blank') {
                window.open(searchUrl, '_blank');
            } else {
                window.location.href = searchUrl;
            }
            input.value = '';
            // 隐藏建议区域
            const suggestionsContainer = document.getElementById('suggestions-container');
            suggestionsContainer.style.display = 'none';
        }

        document.getElementById('search-btn').addEventListener('click', handleSearch);
        document.getElementById('search-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });

        // 初始化搜索联想功能
        initSearchSuggestions();

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
        const saveOnlySettings = document.getElementById('save-only-settings');
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
        const musicPrev = document.getElementById('music-prev');
        const musicNext = document.getElementById('music-next');
        const currentTrack = document.getElementById('current-track');
        let audioPlayer = null;
        let playQueue = [];
        let currentTrackIndex = -1;
        const timeSection = document.querySelector('.time-section');
        const searchCard = document.querySelector('.search-card');
        const quickSearch = document.querySelector('.quick-search');
        const closeWindowButtons = document.querySelectorAll('.close-window');
        const notepadWindow = document.getElementById('notepad-window');
        const weatherWindow = document.getElementById('weather-window');
        const woodenFishWindow = document.getElementById('wooden-fish-window');
        const alarmWindow = document.getElementById('alarm-window');
        const notepadContent = document.getElementById('notepad-content');
        const weatherContent = document.getElementById('weather-content');
        const woodenFish = document.getElementById('wooden-fish');
        const woodenFishImage = document.getElementById('wooden-fish-image');
        const meritCount = document.getElementById('merit-count');
        
        // 闹钟相关元素
        const alarmTabContainer = document.querySelector('.alarm-tab-container');
        const alarmTabs = document.querySelectorAll('.alarm-tab');
        const alarmTabContent = document.getElementById('alarm-tab-content');
        const pomodoroTabContent = document.getElementById('pomodoro-tab-content');
        const alarmTimeInput = document.getElementById('alarm-time');
        const dayCheckboxes = document.querySelectorAll('.day-checkbox');
        const alarmLabelInput = document.getElementById('alarm-label');
        const alarmSoundSelect = document.getElementById('alarm-sound');
        const addAlarmBtn = document.getElementById('add-alarm-btn');
        const alarmsList = document.getElementById('alarms-list');
        
        // 番茄钟相关元素
        const pomodoroDisplay = document.getElementById('pomodoro-display');
        const pomodoroStartBtn = document.getElementById('pomodoro-start');
        const pomodoroPauseBtn = document.getElementById('pomodoro-pause');
        const pomodoroResetBtn = document.getElementById('pomodoro-reset');
        const workTimeInput = document.getElementById('work-time');
        const shortBreakInput = document.getElementById('short-break');
        const longBreakInput = document.getElementById('long-break');
        const workCyclesInput = document.getElementById('work-cycles');
        
        function loadSettings() {
            const savedShowWallpaper = localStorage.getItem('showWallpaper');
            const savedWeatherApiKey = localStorage.getItem('weatherApiKey');
            const savedSearchEngine = localStorage.getItem('searchEngine');
            const savedCustomSearchUrl = localStorage.getItem('customSearchUrl');
            const savedSearchTarget = localStorage.getItem('searchTarget');
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
            
            if (savedSearchTarget) {
                document.getElementById('search-target').value = savedSearchTarget;
            } else {
                // 默认新标签页搜索
                document.getElementById('search-target').value = '_blank';
                localStorage.setItem('searchTarget', '_blank');
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
                localStorage.setItem('searchTarget', document.getElementById('search-target').value);
                // 保存自动定位设置
                if (autoLocationCheckbox) {
                    localStorage.setItem('autoLocation', autoLocationCheckbox.checked);
                }
                // 保存城市设置
                if (weatherCityInput) {
                    localStorage.setItem('weatherCity', weatherCityInput.value);
                }
                
                // 调用云端同步功能
                if (typeof CloudSync !== 'undefined' && CloudSync.syncSettingsOnChange) {
                    CloudSync.syncSettingsOnChange();
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
                
                // 调用云端同步功能
                if (typeof CloudSync !== 'undefined' && CloudSync.syncSettingsOnChange) {
                    CloudSync.syncSettingsOnChange();
                }
                
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
        
        saveOnlySettings.addEventListener('click', () => {
            saveSettings();
            settingsPanel.classList.remove('active');
            // 不刷新页面，只保存设置
            ShowAlert('成功', '设置已保存');
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
                const files = e.target.files;
                if (files && files.length > 0) {
                    // 清空现有播放队列
                    playQueue = [];
                    currentTrackIndex = -1;
                    
                    // 处理每个选中的文件
                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
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
                    }
                    
                    // 更新音乐信息显示
                    bgMusicInfo.textContent = `已选择 ${files.length} 个音乐文件`;
                    
                    // 如果队列不为空，播放第一首
                    if (playQueue.length > 0) {
                        playNextTrack();
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
                    // 添加到播放队列
                    playQueue.push({ data: audioData, name: file.name });
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
                
                // 添加到播放队列
                playQueue.push({ data: fileData, name: outputFileName });
                
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
                } else if (playQueue.length > 0) {
                    // 如果没有音频播放器但有播放队列，播放当前曲目或第一首
                    if (currentTrackIndex === -1) {
                        currentTrackIndex = 0;
                    }
                    playCurrentTrack();
                }
            });
        }
        
        // 上一首按钮事件监听器
        if (musicPrev) {
            musicPrev.addEventListener('click', () => {
                playPreviousTrack();
            });
        }
        
        // 下一首按钮事件监听器
        if (musicNext) {
            musicNext.addEventListener('click', () => {
                playNextTrack();
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
        
        // 编辑模式功能
        const editWidgetsBtn = document.getElementById('edit-widgets-btn');
        const widgetsSection = document.querySelector('.widgets-section');
        const widgetsContainer = document.getElementById('widgets-container');
        
        if (editWidgetsBtn && widgetsSection && widgetsContainer) {
            let isEditMode = false;
            let draggedItem = null;
            
            // 初始化小组件状态
            loadWidgetStates();
            
            // 编辑按钮点击事件
            editWidgetsBtn.addEventListener('click', () => {
                toggleEditMode();
            });
            
            // 切换编辑模式
            function toggleEditMode() {
                isEditMode = !isEditMode;
                
                if (isEditMode) {
                    widgetsSection.classList.add('edit-mode');
                    editWidgetsBtn.innerHTML = '<i class="fa-solid fa-check"></i> 完成';
                    editWidgetsBtn.style.backgroundColor = '#27ae60';
                    
                    // 添加拖拽排序功能
                    initDragAndDrop();
                    
                    // 添加小组件列表按钮
                    showWidgetList();
                } else {
                    widgetsSection.classList.remove('edit-mode');
                    editWidgetsBtn.innerHTML = '<i class="fa-solid fa-edit"></i> 编辑';
                    editWidgetsBtn.style.backgroundColor = 'var(--primary)';
                    
                    // 移除拖拽排序功能
                    removeDragAndDrop();
                    
                    // 移除小组件列表
                    hideWidgetList();
                }
            }
            
            // 初始化拖拽排序
            function initDragAndDrop() {
                const widgetItems = document.querySelectorAll('.widget-item');
                widgetItems.forEach(item => {
                    item.setAttribute('draggable', 'true');
                    item.addEventListener('dragstart', handleDragStart);
                    item.addEventListener('dragover', handleDragOver);
                    item.addEventListener('drop', handleDrop);
                    item.addEventListener('dragend', handleDragEnd);
                });
            }
            
            // 移除拖拽排序
            function removeDragAndDrop() {
                const widgetItems = document.querySelectorAll('.widget-item');
                widgetItems.forEach(item => {
                    item.removeAttribute('draggable');
                    item.removeEventListener('dragstart', handleDragStart);
                    item.removeEventListener('dragover', handleDragOver);
                    item.removeEventListener('drop', handleDrop);
                    item.removeEventListener('dragend', handleDragEnd);
                });
            }
            
            // 拖拽开始
            function handleDragStart(e) {
                draggedItem = this;
                this.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
            
            // 拖拽经过
            function handleDragOver(e) {
                if (e.preventDefault) {
                    e.preventDefault();
                }
                e.dataTransfer.dropEffect = 'move';
                return false;
            }
            
            // 放置
            function handleDrop(e) {
                if (e.stopPropagation) {
                    e.stopPropagation();
                }
                
                if (draggedItem !== this) {
                    const container = widgetsContainer;
                    const children = Array.from(container.children);
                    const draggedIndex = children.indexOf(draggedItem);
                    const dropIndex = children.indexOf(this);
                    
                    if (draggedIndex < dropIndex) {
                        container.insertBefore(draggedItem, this.nextSibling);
                    } else {
                        container.insertBefore(draggedItem, this);
                    }
                    
                    // 保存小组件状态
                    saveWidgetStates();
                }
                
                return false;
            }
            
            // 拖拽结束
            function handleDragEnd() {
                const widgetItems = document.querySelectorAll('.widget-item');
                widgetItems.forEach(item => {
                    item.classList.remove('dragging');
                });
                draggedItem = null;
            }
            
            // 显示小组件列表
            function showWidgetList() {
                // 检查是否已存在小组件列表
                if (!document.getElementById('widget-list-container')) {
                    const widgetListContainer = document.createElement('div');
                    widgetListContainer.id = 'widget-list-container';
                    widgetListContainer.className = 'widget-list-container';
                    
                    widgetListContainer.innerHTML = `
                        <div class="widget-list-header">
                            <h4>添加小组件</h4>
                            <button class="close-widget-list-btn" id="close-widget-list-btn">×</button>
                        </div>
                        <div class="widget-list-content" id="widget-list-content">
                            <!-- 小组件列表将通过JavaScript动态生成 -->
                        </div>
                    `;
                    
                    // 将小组件列表添加到widgetsSection的末尾
                    widgetsSection.appendChild(widgetListContainer);
                    
                    // 生成小组件列表
                    generateWidgetList();
                    
                    // 关闭按钮点击事件
                    const closeWidgetListBtn = document.getElementById('close-widget-list-btn');
                    if (closeWidgetListBtn) {
                        closeWidgetListBtn.addEventListener('click', hideWidgetList);
                    }
                }
            }
            
            // 隐藏小组件列表
            function hideWidgetList() {
                const widgetListContainer = document.getElementById('widget-list-container');
                if (widgetListContainer) {
                    widgetListContainer.remove();
                }
            }
            
            // 生成小组件列表
            function generateWidgetList() {
                const widgetListContent = document.getElementById('widget-list-content');
                if (!widgetListContent) return;
                
                // 所有可用的小组件
                const allWidgets = [
                    { type: 'notepad', icon: 'fa-note-sticky', name: '记事本' },
                    { type: 'weather', icon: 'fa-cloud-sun', name: '天气' },
                    { type: 'wooden-fish', icon: 'fa-cookie', name: '木鱼' },
                    { type: 'alarm', icon: 'fa-clock', name: '闹钟' },
                    { type: 'calculator', icon: 'fa-calculator', name: '计算器' },
                    { type: 'daily-quote', icon: 'fa-quote-right', name: '每日一言' },
                    { type: 'food-decider', icon: 'fa-utensils', name: '今天吃什么' },
                    { type: 'time-calendar', icon: 'fa-clock', name: '时光日历' },
                    { type: 'todo-list', icon: 'fa-list-check', name: '待办事项' },
                    { type: 'drawing-board', icon: 'fa-palette', name: '画板' },
                    { type: 'white-noise', icon: 'fa-volume-high', name: '白噪音' }
                ];
                
                // 获取当前显示的小组件
                const visibleWidgets = new Set();
                const widgetsContainer = document.getElementById('widgets-container');
                if (widgetsContainer) {
                    widgetsContainer.querySelectorAll('.widget-item').forEach(item => {
                        if (item.style.display !== 'none') {
                            visibleWidgets.add(item.dataset.widget);
                        }
                    });
                }
                
                // 生成小组件列表
                widgetListContent.innerHTML = '';
                
                allWidgets.forEach(widget => {
                    if (!visibleWidgets.has(widget.type)) {
                        const widgetItem = document.createElement('div');
                        widgetItem.className = 'widget-list-item';
                        widgetItem.innerHTML = `
                            <i class="fa-solid ${widget.icon}"></i>
                            <span>${widget.name}</span>
                            <button class="add-widget-btn" data-widget="${widget.type}">添加</button>
                        `;
                        widgetListContent.appendChild(widgetItem);
                    }
                });
                
                // 添加添加按钮点击事件
                document.querySelectorAll('.add-widget-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const widgetType = this.dataset.widget;
                        addWidget(widgetType);
                    });
                });
            }
            
            // 添加小组件
            function addWidget(widgetType) {
                // 查找已存在的小组件元素
                const widgetsContainer = document.getElementById('widgets-container');
                if (widgetsContainer) {
                    const existingWidget = widgetsContainer.querySelector(`.widget-item[data-widget="${widgetType}"]`);
                    if (existingWidget) {
                        // 显示已存在的小组件
                        existingWidget.style.display = 'flex';
                        saveWidgetStates();
                        generateWidgetList();
                    }
                }
            }
            
            // 移除小组件
            function removeWidget(widgetItem) {
                if (widgetItem) {
                    widgetItem.style.display = 'none';
                    saveWidgetStates();
                    generateWidgetList();
                }
            }
            
            // 为所有删除按钮添加点击事件
            document.querySelectorAll('.remove-widget-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const widgetItem = this.closest('.widget-item');
                    removeWidget(widgetItem);
                });
            });
            
            // 保存小组件状态到本地存储
            function saveWidgetStates() {
                const visibleWidgets = [];
                const widgetTypes = new Set();
                
                // 只选择widgets-container中的小组件元素
                const widgetsContainer = document.getElementById('widgets-container');
                if (widgetsContainer) {
                    // 使用children属性获取当前DOM顺序的元素
                    Array.from(widgetsContainer.children).forEach(item => {
                        if (item.classList.contains('widget-item')) {
                            if (item.style.display !== 'none') {
                                const widgetType = item.dataset.widget;
                                if (!widgetTypes.has(widgetType)) {
                                    widgetTypes.add(widgetType);
                                    visibleWidgets.push(widgetType);
                                }
                            }
                        }
                    });
                }
                
                localStorage.setItem('visibleWidgets', JSON.stringify(visibleWidgets));
                
                // 调用云端同步功能
                if (typeof CloudSync !== 'undefined' && CloudSync.syncSettingsOnChange) {
                    CloudSync.syncSettingsOnChange();
                }
            }
            
            // 从本地存储加载小组件状态
            function loadWidgetStates() {
                const savedWidgets = localStorage.getItem('visibleWidgets');
                
                // 只操作widgets-container中的小组件元素
                const widgetsContainer = document.getElementById('widgets-container');
                if (!widgetsContainer) {
                    return;
                }
                
                if (savedWidgets) {
                    try {
                        const visibleWidgets = JSON.parse(savedWidgets);
                        
                        // 隐藏所有小组件
                        widgetsContainer.querySelectorAll('.widget-item').forEach(item => {
                            item.style.display = 'none';
                        });
                        
                        // 按照保存的顺序重新排列并显示小组件
                        visibleWidgets.forEach(widgetType => {
                            const widgetItem = widgetsContainer.querySelector(`.widget-item[data-widget="${widgetType}"]`);
                            if (widgetItem) {
                                // 将小组件移到容器末尾，按照保存的顺序排列
                                widgetsContainer.appendChild(widgetItem);
                                widgetItem.style.display = 'flex';
                            }
                        });
                    } catch (error) {
                        // 加载失败时，显示所有预设小组件
                        widgetsContainer.querySelectorAll('.widget-item').forEach(item => {
                            item.style.display = 'flex';
                        });
                    }
                } else {
                    // 没有保存的状态时，显示所有预设小组件
                    widgetsContainer.querySelectorAll('.widget-item').forEach(item => {
                        item.style.display = 'flex';
                    });
                }
            }
        }
        
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
        
        // 闹钟标签切换
        alarmTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabType = tab.dataset.tab;
                
                // 移除所有标签的active类
                alarmTabs.forEach(t => t.classList.remove('active'));
                // 添加当前标签的active类
                tab.classList.add('active');
                
                // 隐藏所有内容
                alarmTabContent.style.display = 'none';
                pomodoroTabContent.style.display = 'none';
                
                // 显示对应内容
                if (tabType === 'alarm') {
                    alarmTabContent.style.display = 'block';
                } else if (tabType === 'pomodoro') {
                    pomodoroTabContent.style.display = 'block';
                }
            });
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
        
        // 确认播放框函数 - 不影响点击、缩小并放到左下角
        function ShowConfirmForConfirmPlay(title, message, callback) {
            const confirmElement = document.getElementById('custom-confirm-for-confirm-play');
            const confirmTitle = document.getElementById('confirm-play-title');
            const confirmMessage = document.getElementById('confirm-play-message');
            const confirmBtn = document.getElementById('confirm-play-btn');
            const cancelBtn = document.getElementById('confirm-play-cancel-btn');
            const confirmClose = document.getElementById('confirm-play-close');
            
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

        // 初始化搜索联想功能
        function initSearchSuggestions() {
            const searchInput = document.getElementById('search-input');
            const suggestionsContainer = document.getElementById('suggestions-container');
            const suggestionsList = document.getElementById('suggestions-list');
            let debounceTimer;

            // 监听输入事件
            searchInput.addEventListener('input', function() {
                const query = this.value.trim();
                
                if (query.length < 1) {
                    // 清除防抖定时器，防止fetchSuggestions回调覆盖操作
                    clearTimeout(debounceTimer);
                    showSearchHistory();
                    return;
                }

                // 防抖处理
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    fetchSuggestions(query);
                }, 300);
            });

            // 监听焦点事件，显示搜索历史
            searchInput.addEventListener('focus', function() {
                const query = this.value.trim();
                if (query.length < 1) {
                    showSearchHistory();
                } else {
                    fetchSuggestions(query);
                }
            });

            // 监听点击事件，点击外部关闭联想框
            document.addEventListener('click', function(e) {
                if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                    suggestionsContainer.style.display = 'none';
                }
            });

            // 监听键盘事件
            searchInput.addEventListener('keydown', function(e) {
                const activeItem = suggestionsList.querySelector('.suggestion-item.active');
                
                switch(e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        if (activeItem) {
                            activeItem.classList.remove('active');
                            const nextItem = activeItem.nextElementSibling;
                            if (nextItem) {
                                nextItem.classList.add('active');
                                nextItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            } else {
                                suggestionsList.firstElementChild?.classList.add('active');
                            }
                        } else {
                            suggestionsList.firstElementChild?.classList.add('active');
                        }
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        if (activeItem) {
                            activeItem.classList.remove('active');
                            const prevItem = activeItem.previousElementSibling;
                            if (prevItem) {
                                prevItem.classList.add('active');
                                prevItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            } else {
                                suggestionsList.lastElementChild?.classList.add('active');
                            }
                        } else {
                            suggestionsList.lastElementChild?.classList.add('active');
                        }
                        break;
                    case 'Enter':
                        if (activeItem) {
                            e.preventDefault();
                            searchInput.value = activeItem.textContent;
                            suggestionsContainer.style.display = 'none';
                            handleSearch();
                        } else {
                            // 保存搜索历史
                            saveSearchHistory(searchInput.value.trim());
                        }
                        break;
                    case 'Escape':
                        suggestionsContainer.style.display = 'none';
                        break;
                }
            });

            // 保存搜索历史
            function saveSearchHistory(query) {
                if (!query) return;
                
                let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
                
                // 移除重复项
                history = history.filter(item => item !== query);
                
                // 添加到开头
                history.unshift(query);
                
                // 限制历史记录数量
                if (history.length > 10) {
                    history = history.slice(0, 10);
                }
                
                localStorage.setItem('searchHistory', JSON.stringify(history));
            }

            // 显示搜索历史
            function showSearchHistory() {
                const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
                
                if (history.length > 0) {
                    suggestionsList.innerHTML = '';
                    
                    history.forEach(item => {
                        const li = document.createElement('li');
                        li.className = 'suggestion-item';
                        li.style.display = 'flex';
                        li.style.alignItems = 'center';
                        li.style.justifyContent = 'space-between';
                        li.innerHTML = `
                            <div style="display: flex; align-items: center;">
                                <i class="fa-solid fa-clock" style="margin-right: 10px; color: var(--text-light);"></i>
                                <span>${item}</span>
                            </div>
                            <button class="clear-history-btn" style="background: none; border: none; color: var(--text-light); cursor: pointer; padding: 0 5px;">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        `;
                        
                        // 点击历史项
                        li.querySelector('div').addEventListener('click', function() {
                            searchInput.value = item;
                            suggestionsContainer.style.display = 'none';
                            handleSearch();
                        });
                        
                        // 点击清除按钮
                        li.querySelector('.clear-history-btn').addEventListener('click', function(e) {
                            e.stopPropagation(); // 阻止冒泡到li
                            // 清除对应的历史记录
                            let updatedHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
                            updatedHistory = updatedHistory.filter(historyItem => historyItem !== item);
                            localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
                            // 重新显示历史记录
                            showSearchHistory();
                            // 重新聚焦到输入框
                            searchInput.focus();
                        });
                        
                        suggestionsList.appendChild(li);
                    });
                    
                    suggestionsContainer.style.display = 'block';
                } else {
                    suggestionsContainer.style.display = 'none';
                }
            }

            // 获取搜索建议
            function fetchSuggestions(query) {
                try {
                    // 使用百度搜索建议 API，使用 JSONP 方式
                    const callbackName = 'baiduSearchCallback_' + Date.now();
                    
                    // 移除已存在的回调函数
                    if (window[callbackName]) {
                        delete window[callbackName];
                    }
                    
                    // 创建回调函数
                    window[callbackName] = function(data) {
                        // 处理返回的数据（百度 API 返回格式：{q: "搜索词", p: false, s: ["建议1", "建议2", ...]}
                        const suggestions = [];
                        if (data && data.s) {
                            data.s.forEach(item => {
                                suggestions.push(item);
                            });
                        }
                        
                        if (suggestions.length > 0) {
                            displaySuggestions(suggestions);
                        } else {
                            suggestionsContainer.style.display = 'none';
                        }
                        
                        // 移除 script 标签
                        const script = document.getElementById('baidu-search-script');
                        if (script) {
                            script.remove();
                        }
                        
                        // 清理回调函数
                        if (window[callbackName]) {
                            delete window[callbackName];
                        }
                    };
                    
                    // 创建 script 标签
                    const script = document.createElement('script');
                    script.id = 'baidu-search-script';
                    script.src = `https://suggestion.baidu.com/su?wd=${encodeURIComponent(query)}&cb=${callbackName}`;
                    script.type = 'text/javascript';
                    
                    // 添加到文档
                    document.head.appendChild(script);
                } catch (error) {
                    console.error('获取搜索建议失败:', error);
                    suggestionsContainer.style.display = 'none';
                }
            }

            // 显示搜索建议
            function displaySuggestions(suggestions) {
                suggestionsList.innerHTML = '';
                
                suggestions.forEach(suggestion => {
                    const li = document.createElement('li');
                    li.className = 'suggestion-item';
                    li.textContent = suggestion;
                    
                    // 点击建议项
                    li.addEventListener('click', function() {
                        searchInput.value = this.textContent;
                        suggestionsContainer.style.display = 'none';
                        handleSearch();
                    });
                    
                    suggestionsList.appendChild(li);
                });
                
                suggestionsContainer.style.display = 'block';
            }
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
                        reader.onerror = () => {
                            console.error('文件读取失败');
                            ShowAlert('错误', '呜呜～笔记被小松鼠叼走了！重新上传试试？', true, 3000);
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
            
            // 调用云端同步功能
            if (typeof CloudSync !== 'undefined' && CloudSync.syncSettingsOnChange) {
                CloudSync.syncSettingsOnChange();
            }
            
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
                const window = document.getElementById('notepad-window');
                if (window) window.style.display = 'flex';
            } else if (widgetType === 'weather') {
                const window = document.getElementById('weather-window');
                if (window) window.style.display = 'flex';
                loadWeather();
            } else if (widgetType === 'wooden-fish') {
                const window = document.getElementById('wooden-fish-window');
                if (window) window.style.display = 'flex';
            } else if (widgetType === 'alarm') {
                const window = document.getElementById('alarm-window');
                if (window) window.style.display = 'flex';
                loadAlarms();
            } else if (widgetType === 'calculator') {
                const window = document.getElementById('calculator-window');
                if (window) window.style.display = 'flex';
                initCalculator();
            } else if (widgetType === 'daily-quote') {
                const window = document.getElementById('daily-quote-window');
                if (window) window.style.display = 'flex';
                loadDailyQuote();
            } else if (widgetType === 'food-decider') {
                const window = document.getElementById('food-decider-window');
                if (window) window.style.display = 'flex';
                initFoodDecider();
            } else if (widgetType === 'time-calendar') {
                const window = document.getElementById('time-calendar-window');
                if (window) window.style.display = 'flex';
                initTimeCalendar();
            } else if (widgetType === 'todo-list') {
                const window = document.getElementById('todo-list-window');
                if (window) window.style.display = 'flex';
                initTodoList();
            } else if (widgetType === 'drawing-board') {
                const window = document.getElementById('drawing-board-window');
                if (window) window.style.display = 'flex';
                initDrawingBoard();
            } else if (widgetType === 'white-noise') {
                const window = document.getElementById('white-noise-window');
                if (window) window.style.display = 'flex';
                initWhiteNoise();
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
                console.error('加载天气失败:', error);
                ShowAlert('错误', '啊偶～云朵把天气藏起来啦！换个城市试试？', true, 3000);
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
            if (audioPlayer || playQueue.length > 0) {
                musicControls.style.display = 'flex';
                if (audioPlayer) {
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
                    // 有播放队列但没有音频播放器
                    musicPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
                    musicPlayPause.title = '播放';
                    musicVolume.value = 0.3;
                    musicVolumeLabel.textContent = '30%';
                }
            } else {
                musicControls.style.display = 'none';
            }
        }

        // 播放当前曲目
        function playCurrentTrack() {
            if (playQueue.length > 0 && currentTrackIndex >= 0 && currentTrackIndex < playQueue.length) {
                const track = playQueue[currentTrackIndex];
                initBackgroundMusic(track.data, track.name);
                updateCurrentTrackDisplay();
                
                // 播放音乐
                if (audioPlayer) {
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
                }
            }
        }
        
        // 播放下一首曲目
        function playNextTrack() {
            if (playQueue.length > 0) {
                currentTrackIndex = (currentTrackIndex + 1) % playQueue.length;
                playCurrentTrack();
            }
        }
        
        // 播放上一首曲目
        function playPreviousTrack() {
            if (playQueue.length > 0) {
                currentTrackIndex = (currentTrackIndex - 1 + playQueue.length) % playQueue.length;
                playCurrentTrack();
            }
        }
        
        // 更新当前曲目显示
        function updateCurrentTrackDisplay() {
            if (currentTrack && playQueue.length > 0 && currentTrackIndex >= 0 && currentTrackIndex < playQueue.length) {
                const track = playQueue[currentTrackIndex];
                currentTrack.textContent = `当前播放: ${track.name}`;
            } else if (currentTrack) {
                currentTrack.textContent = '未播放';
            }
        }
        
        // 初始化背景音乐功能
        function initBackgroundMusic(audioData, trackName) {
            if (audioData) {
                if (audioPlayer) {
                    audioPlayer.pause();
                    audioPlayer = null;
                }
                audioPlayer = new Audio(audioData);
                audioPlayer.loop = false; // 关闭单曲循环，使用队列循环
                audioPlayer.volume = parseFloat(musicVolume.value) || 0.3;
                
                // 添加音频结束事件监听器，播放下一首
                audioPlayer.addEventListener('ended', () => {
                    playNextTrack();
                });
                
                // 不自动播放，只更新音乐控制UI
                updateMusicControls();
                updateCurrentTrackDisplay();
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
            ShowConfirmForConfirmPlay('背景音乐', '检测到您之前设置了背景音乐，是否开始播放？', async (confirmed) => {
                
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
        
        // 闹钟功能
        // 加载闹钟
        function loadAlarms() {
            const savedAlarms = localStorage.getItem('alarms');
            if (savedAlarms) {
                const alarms = JSON.parse(savedAlarms);
                renderAlarms(alarms);
            }
        }
        
        // 渲染闹钟列表
        function renderAlarms(alarms) {
            const alarmsList = document.getElementById('alarms-list');
            if (!alarmsList) return;
            
            alarmsList.innerHTML = '';
            
            if (alarms.length === 0) {
                alarmsList.innerHTML = '<p class="no-alarms">暂无闹钟</p>';
                return;
            }
            
            alarms.forEach((alarm, index) => {
                const alarmItem = document.createElement('div');
                alarmItem.className = 'alarm-item';
                
                const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六'];
                const selectedDays = alarm.days.map(day => daysOfWeek[day]).join(', ');
                
                alarmItem.innerHTML = `
                    <div class="alarm-item-info">
                        <div class="alarm-item-time">${alarm.time}</div>
                        <div class="alarm-item-days">${selectedDays || '每天'}</div>
                        <div class="alarm-item-label">${alarm.label || '无标签'}</div>
                    </div>
                    <div class="alarm-item-actions">
                        <div class="alarm-toggle ${alarm.enabled ? 'active' : ''}" data-index="${index}"></div>
                        <button class="delete-alarm-btn" data-index="${index}" title="删除闹钟">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                `;
                
                alarmsList.appendChild(alarmItem);
            });
            
            // 添加闹钟切换事件
            const alarmToggles = document.querySelectorAll('.alarm-toggle');
            alarmToggles.forEach(toggle => {
                toggle.addEventListener('click', () => {
                    const index = parseInt(toggle.dataset.index);
                    toggleAlarm(index);
                });
            });
            
            // 添加删除闹钟事件
            const deleteButtons = document.querySelectorAll('.delete-alarm-btn');
            deleteButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const index = parseInt(button.dataset.index);
                    deleteAlarm(index);
                });
            });
        }
        
        // 添加闹钟
        function addAlarm() {
            const alarmTimeInput = document.getElementById('alarm-time');
            const dayCheckboxes = document.querySelectorAll('.day-checkbox');
            const alarmLabelInput = document.getElementById('alarm-label');
            const alarmSoundSelect = document.getElementById('alarm-sound');
            
            if (!alarmTimeInput || !alarmLabelInput || !alarmSoundSelect) return;
            
            const time = alarmTimeInput.value;
            if (!time) {
                ShowAlert('提示', '请选择闹钟时间', true, 2000);
                return;
            }
            
            const days = Array.from(dayCheckboxes)
                .filter(checkbox => checkbox.checked)
                .map(checkbox => parseInt(checkbox.value));
            
            const label = alarmLabelInput.value;
            const sound = alarmSoundSelect.value;
            
            const alarm = {
                time,
                days,
                label,
                sound,
                enabled: true,
                id: Date.now()
            };
            
            const savedAlarms = localStorage.getItem('alarms');
            const alarms = savedAlarms ? JSON.parse(savedAlarms) : [];
            alarms.push(alarm);
            
            localStorage.setItem('alarms', JSON.stringify(alarms));
            loadAlarms();
            
            // 重置表单
            alarmTimeInput.value = '';
            dayCheckboxes.forEach(checkbox => checkbox.checked = false);
            alarmLabelInput.value = '';
            alarmSoundSelect.value = 'default';
            
            ShowAlert('成功', '闹钟添加成功', true, 2000);
        }
        
        // 切换闹钟状态
        function toggleAlarm(index) {
            const savedAlarms = localStorage.getItem('alarms');
            if (savedAlarms) {
                const alarms = JSON.parse(savedAlarms);
                alarms[index].enabled = !alarms[index].enabled;
                localStorage.setItem('alarms', JSON.stringify(alarms));
                loadAlarms();
            }
        }
        
        // 删除闹钟
        function deleteAlarm(index) {
            const savedAlarms = localStorage.getItem('alarms');
            if (savedAlarms) {
                const alarms = JSON.parse(savedAlarms);
                alarms.splice(index, 1);
                localStorage.setItem('alarms', JSON.stringify(alarms));
                loadAlarms();
                ShowAlert('成功', '闹钟删除成功', true, 2000);
            }
        }
        
        // 初始化番茄钟
        let pomodoroInterval = null;
        let pomodoroTime = 25 * 60; // 默认25分钟
        let pomodoroState = 'work'; // work, shortBreak, longBreak
        let pomodoroCycle = 0;
        let isPomodoroRunning = false;
        
        // 更新番茄钟设置
        function updatePomodoroSettings() {
            const workTimeInput = document.getElementById('work-time');
            const shortBreakInput = document.getElementById('short-break');
            const longBreakInput = document.getElementById('long-break');
            const workCyclesInput = document.getElementById('work-cycles');
            
            if (!workTimeInput || !shortBreakInput || !longBreakInput || !workCyclesInput) return;
            
            if (!isPomodoroRunning) {
                resetPomodoro();
            }
        }
        
        // 重置番茄钟
        function resetPomodoro() {
            const workTimeInput = document.getElementById('work-time');
            const pomodoroDisplay = document.getElementById('pomodoro-display');
            const pomodoroStartBtn = document.getElementById('pomodoro-start');
            
            if (!workTimeInput || !pomodoroDisplay || !pomodoroStartBtn) return;
            
            clearInterval(pomodoroInterval);
            pomodoroTime = parseInt(workTimeInput.value) * 60;
            pomodoroState = 'work';
            pomodoroCycle = 0;
            isPomodoroRunning = false;
            updatePomodoroDisplay();
            pomodoroStartBtn.textContent = '开始';
        }
        
        // 更新番茄钟显示
        function updatePomodoroDisplay() {
            const pomodoroDisplay = document.getElementById('pomodoro-display');
            if (!pomodoroDisplay) return;
            
            const minutes = Math.floor(pomodoroTime / 60);
            const seconds = pomodoroTime % 60;
            pomodoroDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // 开始/暂停番茄钟
        function togglePomodoro() {
            const pomodoroStartBtn = document.getElementById('pomodoro-start');
            const workTimeInput = document.getElementById('work-time');
            const shortBreakInput = document.getElementById('short-break');
            const longBreakInput = document.getElementById('long-break');
            const workCyclesInput = document.getElementById('work-cycles');
            
            if (!pomodoroStartBtn || !workTimeInput || !shortBreakInput || !longBreakInput || !workCyclesInput) return;
            
            if (isPomodoroRunning) {
                clearInterval(pomodoroInterval);
                isPomodoroRunning = false;
                pomodoroStartBtn.textContent = '开始';
            } else {
                pomodoroInterval = setInterval(() => {
                    pomodoroTime--;
                    updatePomodoroDisplay();
                    
                    if (pomodoroTime <= 0) {
                        clearInterval(pomodoroInterval);
                        isPomodoroRunning = false;
                        pomodoroStartBtn.textContent = '开始';
                        
                        // 播放提示音
                        playAlarmSound();
                        
                        // 切换状态
                        if (pomodoroState === 'work') {
                            pomodoroCycle++;
                            if (pomodoroCycle % parseInt(workCyclesInput.value) === 0) {
                                // 长休息
                                pomodoroState = 'longBreak';
                                pomodoroTime = parseInt(longBreakInput.value) * 60;
                                ShowAlert('提示', '工作时间结束，开始长休息', true, 3000);
                            } else {
                                // 短休息
                                pomodoroState = 'shortBreak';
                                pomodoroTime = parseInt(shortBreakInput.value) * 60;
                                ShowAlert('提示', '工作时间结束，开始短休息', true, 3000);
                            }
                        } else {
                            // 回到工作状态
                            pomodoroState = 'work';
                            pomodoroTime = parseInt(workTimeInput.value) * 60;
                            ShowAlert('提示', '休息时间结束，开始工作', true, 3000);
                        }
                        
                        updatePomodoroDisplay();
                    }
                }, 1000);
                
                isPomodoroRunning = true;
                pomodoroStartBtn.textContent = '暂停';
            }
        }
        
        // 播放闹钟声音
        function playAlarmSound() {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2588/2588-preview.mp3');
            audio.play().catch(err => {
                console.error('播放声音失败:', err);
            });
        }
        
        // 检查闹钟
        function checkAlarms() {
            const now = new Date();
            const currentHour = now.getHours().toString().padStart(2, '0');
            const currentMinute = now.getMinutes().toString().padStart(2, '0');
            const currentTime = `${currentHour}:${currentMinute}`;
            const currentDay = now.getDay();
            
            const savedAlarms = localStorage.getItem('alarms');
            if (savedAlarms) {
                const alarms = JSON.parse(savedAlarms);
                alarms.forEach(alarm => {
                    if (alarm.enabled && alarm.time === currentTime) {
                        if (alarm.days.length === 0 || alarm.days.includes(currentDay)) {
                            // 触发闹钟
                            playAlarmSound();
                            ShowAlert('闹钟', alarm.label || '闹钟时间到了！', true, 5000);
                        }
                    }
                });
            }
        }
        
        // 每分钟检查一次闹钟
        setInterval(checkAlarms, 60000);
        
        // 初始化闹钟事件
        document.addEventListener('DOMContentLoaded', () => {
            // 闹钟标签切换
            const alarmTabs = document.querySelectorAll('.alarm-tab');
            const alarmTabContent = document.getElementById('alarm-tab-content');
            const pomodoroTabContent = document.getElementById('pomodoro-tab-content');
            
            if (alarmTabs && alarmTabContent && pomodoroTabContent) {
                // 初始化默认显示的标签内容
                alarmTabContent.style.display = 'block';
                pomodoroTabContent.style.display = 'none';
                
                // 确保第一个标签是激活状态
                alarmTabs.forEach((tab, index) => {
                    if (index === 0) {
                        tab.classList.add('active');
                    } else {
                        tab.classList.remove('active');
                    }
                });
                
                alarmTabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        const tabType = tab.dataset.tab;
                        
                        // 移除所有标签的active类
                        alarmTabs.forEach(t => t.classList.remove('active'));
                        // 添加当前标签的active类
                        tab.classList.add('active');
                        
                        // 隐藏所有内容
                        alarmTabContent.style.display = 'none';
                        pomodoroTabContent.style.display = 'none';
                        
                        // 显示对应内容
                        if (tabType === 'alarm') {
                            alarmTabContent.style.display = 'block';
                        } else if (tabType === 'pomodoro') {
                            pomodoroTabContent.style.display = 'block';
                        }
                    });
                });
            }
            
            // 添加闹钟按钮事件
            const addAlarmBtn = document.getElementById('add-alarm-btn');
            if (addAlarmBtn) {
                addAlarmBtn.addEventListener('click', addAlarm);
            }
            
            // 番茄钟按钮事件
            const pomodoroStartBtn = document.getElementById('pomodoro-start');
            const pomodoroPauseBtn = document.getElementById('pomodoro-pause');
            const pomodoroResetBtn = document.getElementById('pomodoro-reset');
            const workTimeInput = document.getElementById('work-time');
            const shortBreakInput = document.getElementById('short-break');
            const longBreakInput = document.getElementById('long-break');
            const workCyclesInput = document.getElementById('work-cycles');
            
            if (pomodoroStartBtn) {
                pomodoroStartBtn.addEventListener('click', togglePomodoro);
            }
            
            if (pomodoroPauseBtn) {
                pomodoroPauseBtn.addEventListener('click', () => {
                    clearInterval(pomodoroInterval);
                    isPomodoroRunning = false;
                    if (pomodoroStartBtn) {
                        pomodoroStartBtn.textContent = '开始';
                    }
                });
            }
            
            if (pomodoroResetBtn) {
                pomodoroResetBtn.addEventListener('click', resetPomodoro);
            }
            
            if (workTimeInput) {
                workTimeInput.addEventListener('change', updatePomodoroSettings);
            }
            
            if (shortBreakInput) {
                shortBreakInput.addEventListener('change', updatePomodoroSettings);
            }
            
            if (longBreakInput) {
                longBreakInput.addEventListener('change', updatePomodoroSettings);
            }
            
            if (workCyclesInput) {
                workCyclesInput.addEventListener('change', updatePomodoroSettings);
            }
            
            // 初始化
            loadAlarms();
            resetPomodoro();
        });
        
        // 计算器功能
        let calculatorExpression = '';
        let calculatorResult = '';
        let calculatorInput = '';
        let calculatorOperator = '';
        let calculatorShouldReset = false;
        
        // 初始化计算器
        function initCalculator() {
            const calculatorContainer = document.querySelector('.calculator-container');
            if (!calculatorContainer) return;
            
            // 重置计算器状态
            resetCalculator();
            
            // 添加按钮事件监听器
            const calculatorButtons = document.querySelectorAll('.calculator-btn');
            calculatorButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const value = button.dataset.value;
                    if (value) {
                        handleCalculatorButton(value);
                    }
                });
            });
        }
        
        // 处理计算器按钮点击
        function handleCalculatorButton(value) {
            if (value === 'C') {
                // 清除所有
                resetCalculator();
            } else if (value === 'CE') {
                // 清除当前输入
                calculatorInput = '';
                updateCalculatorDisplay();
            } else if (value === 'Backspace') {
                // 退格
                calculatorInput = calculatorInput.slice(0, -1);
                updateCalculatorDisplay();
            } else if (value === '=') {
                // 计算结果
                calculateResult();
            } else if (['+', '-', '*', '/', '%'].includes(value)) {
                // 运算符
                handleOperator(value);
            } else if (value === '.') {
                // 小数点
                handleDecimal();
            } else {
                // 数字
                handleNumber(value);
            }
        }
        
        // 处理数字输入
        function handleNumber(number) {
            if (calculatorShouldReset) {
                calculatorInput = number;
                calculatorShouldReset = false;
            } else {
                // 避免多个前导零
                if (calculatorInput === '0' && number === '0') {
                    return;
                }
                // 避免以零开头的数字（除了纯小数）
                if (calculatorInput === '0' && number !== '.' && number !== '0') {
                    calculatorInput = number;
                } else {
                    calculatorInput += number;
                }
            }
            updateCalculatorDisplay();
        }
        
        // 处理小数点
        function handleDecimal() {
            if (!calculatorInput.includes('.')) {
                if (calculatorShouldReset) {
                    calculatorInput = '0.';
                    calculatorShouldReset = false;
                } else if (calculatorInput === '') {
                    calculatorInput = '0.';
                } else {
                    calculatorInput += '.';
                }
                updateCalculatorDisplay();
            }
        }
        
        // 处理运算符
        function handleOperator(operator) {
            if (calculatorInput === '' && calculatorExpression === '') {
                return;
            }
            
            if (calculatorInput !== '') {
                if (calculatorExpression !== '') {
                    // 计算之前的表达式
                    calculateResult();
                }
                calculatorExpression = calculatorInput;
                calculatorOperator = operator;
                calculatorInput = '';
                updateCalculatorDisplay();
            } else {
                // 替换运算符
                calculatorOperator = operator;
                updateCalculatorDisplay();
            }
        }
        
        // 计算结果
        function calculateResult() {
            if (calculatorExpression === '' || calculatorInput === '' || calculatorOperator === '') {
                return;
            }
            
            let result = 0;
            const num1 = parseFloat(calculatorExpression);
            const num2 = parseFloat(calculatorInput);
            
            try {
                switch (calculatorOperator) {
                    case '+':
                        result = num1 + num2;
                        break;
                    case '-':
                        result = num1 - num2;
                        break;
                    case '*':
                        result = num1 * num2;
                        break;
                    case '/':
                        if (num2 === 0) {
                            throw new Error('除数不能为零');
                        }
                        result = num1 / num2;
                        break;
                    case '%':
                        result = num1 % num2;
                        break;
                }
                
                // 处理结果显示
                calculatorResult = formatCalculatorResult(result);
                calculatorInput = calculatorResult;
                calculatorExpression = '';
                calculatorOperator = '';
                calculatorShouldReset = true;
                updateCalculatorDisplay();
            } catch (error) {
                calculatorResult = '错误';
                calculatorInput = '';
                calculatorExpression = '';
                calculatorOperator = '';
                updateCalculatorDisplay();
            }
        }
        
        // 格式化计算器结果
        function formatCalculatorResult(result) {
            if (Number.isInteger(result)) {
                return result.toString();
            } else {
                // 限制小数位数为10位
                return result.toFixed(10).replace(/\.?0+$/, '');
            }
        }
        
        // 更新计算器显示
        function updateCalculatorDisplay() {
            const expressionElement = document.querySelector('.calculator-expression');
            const resultElement = document.querySelector('.calculator-result');
            
            if (expressionElement && resultElement) {
                let displayExpression = calculatorExpression;
                if (calculatorOperator) {
                    displayExpression += ' ' + calculatorOperator;
                }
                if (calculatorInput) {
                    displayExpression += ' ' + calculatorInput;
                }
                
                expressionElement.textContent = displayExpression;
                resultElement.textContent = calculatorInput || calculatorResult || '0';
            }
        }
        
        // 重置计算器
        function resetCalculator() {
            calculatorExpression = '';
            calculatorResult = '';
            calculatorInput = '';
            calculatorOperator = '';
            calculatorShouldReset = false;
            updateCalculatorDisplay();
        }
        
        // 检查计算器窗口是否存在
        const calculatorWindow = document.getElementById('calculator-window');
        if (calculatorWindow) {
            // 初始化计算器窗口样式
            calculatorWindow.style.position = 'fixed';
            calculatorWindow.style.left = '50%';
            calculatorWindow.style.top = '50%';
            calculatorWindow.style.transform = 'translate(-50%, -50%)';
            calculatorWindow.style.zIndex = '1100';
        }
        
        // 每日一言功能
        let dailyQuoteWindow;
        let dailyQuoteContent;
        let refreshQuoteBtn;
        
        // 加载每日一言
        async function loadDailyQuote() {
            const dailyQuoteContent = document.getElementById('daily-quote-content');
            if (!dailyQuoteContent) return;
            
            // 显示加载状态
            dailyQuoteContent.innerHTML = `
                <div class="daily-quote-loading">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <p>正在加载每日一言...</p>
                </div>
            `;
            
            try {
                const response = await fetch('https://yunzhiapi.cn/API/Bingmryy.php');
                if (!response.ok) {
                    throw new Error('请求失败');
                }
                
                const quoteText = await response.text();
                
                // 显示每日一言
                dailyQuoteContent.innerHTML = `
                    <div class="daily-quote-text">${quoteText}</div>
                    <div class="daily-quote-author">— 每日一言</div>
                `;
            } catch (error) {
                console.error('加载每日一言失败:', error);
                ShowAlert('错误', '呼~每日一言飞到外太空去了！', true, 3000);
                dailyQuoteContent.innerHTML = `
                    <div class="daily-quote-error">
                        <i class="fa-solid fa-exclamation-triangle"></i>
                        <p>加载失败，请点击刷新重试</p>
                    </div>
                `;
            }
        }
        
        // 初始化每日一言窗口
        function initDailyQuoteWindow() {
            dailyQuoteWindow = document.getElementById('daily-quote-window');
            dailyQuoteContent = document.getElementById('daily-quote-content');
            refreshQuoteBtn = document.getElementById('refresh-quote-btn');
            
            if (dailyQuoteWindow) {
                // 初始化窗口样式
                dailyQuoteWindow.style.position = 'fixed';
                dailyQuoteWindow.style.left = '50%';
                dailyQuoteWindow.style.top = '50%';
                dailyQuoteWindow.style.transform = 'translate(-50%, -50%)';
                dailyQuoteWindow.style.zIndex = '1100';
            }
            
            if (refreshQuoteBtn) {
                refreshQuoteBtn.addEventListener('click', loadDailyQuote);
            }
        }
        
        // 初始化每日一言功能
        document.addEventListener('DOMContentLoaded', initDailyQuoteWindow);
        
        // 今天吃什么功能
        let foodDeciderWindow;
        let foodDisplay;
        let foodPlaceholder;
        let foodResult;
        let foodName;
        let startFoodBtn;
        let stopFoodBtn;
        let foodItems;
        let foodDeciderInterval;
        
        // 预设50种食品
        const foodList = [
            '红烧肉', '宫保鸡丁', '鱼香肉丝', '糖醋排骨', '麻婆豆腐',
            '清蒸鱼', '水煮肉片', '青椒肉丝', '西红柿鸡蛋', '炸鸡排',
            '披萨', '汉堡', '寿司', '意大利面', '烤肉',
            '火锅', '麻辣烫', '串串香', '冒菜', '烧烤',
            '油条', '豆浆', '包子', '馒头', '稀饭',
            '三明治', '沙拉', '炒饭', '炒面', '汤面',
            '馄饨', '饺子', '包子', '烧麦', '小笼包',
            '蛋糕', '冰淇淋', '奶茶', '咖啡', '果汁',
            '水果沙拉', '酸奶', '薯片', '巧克力', '饼干'
        ];
        
        // 初始化今天吃什么功能
        function initFoodDecider() {
            foodDeciderWindow = document.getElementById('food-decider-window');
            foodDisplay = document.getElementById('food-display');
            foodPlaceholder = document.querySelector('.food-placeholder');
            foodResult = document.getElementById('food-result');
            foodName = document.getElementById('food-name');
            startFoodBtn = document.getElementById('start-food-btn');
            stopFoodBtn = document.getElementById('stop-food-btn');
            foodItems = document.getElementById('food-items');
            
            // 显示食物列表
            displayFoodList();
            
            // 绑定按钮事件
            if (startFoodBtn) {
                startFoodBtn.addEventListener('click', startFoodDecider);
            }
            
            if (stopFoodBtn) {
                stopFoodBtn.addEventListener('click', stopFoodDecider);
            }
            
            // 初始化窗口样式
            if (foodDeciderWindow) {
                foodDeciderWindow.style.position = 'fixed';
                foodDeciderWindow.style.left = '50%';
                foodDeciderWindow.style.top = '50%';
                foodDeciderWindow.style.transform = 'translate(-50%, -50%)';
                foodDeciderWindow.style.zIndex = '1100';
            }
        }
        
        // 显示食物列表
        function displayFoodList() {
            if (!foodItems) return;
            
            foodItems.innerHTML = '';
            
            foodList.forEach(food => {
                const foodTag = document.createElement('span');
                foodTag.className = 'food-item-tag';
                foodTag.textContent = food;
                foodItems.appendChild(foodTag);
            });
        }
        
        // 开始随机选择食物
        function startFoodDecider() {
            if (foodDeciderInterval) {
                clearInterval(foodDeciderInterval);
            }
            
            // 显示食物结果区域，隐藏占位符
            if (foodPlaceholder) {
                foodPlaceholder.style.display = 'none';
            }
            if (foodResult) {
                foodResult.style.display = 'flex';
            }
            
            // 禁用开始按钮，启用停止按钮
            if (startFoodBtn) {
                startFoodBtn.disabled = true;
            }
            if (stopFoodBtn) {
                stopFoodBtn.disabled = false;
            }
            
            // 开始随机选择
            foodDeciderInterval = setInterval(() => {
                const randomFood = foodList[Math.floor(Math.random() * foodList.length)];
                if (foodName) {
                    foodName.textContent = randomFood;
                }
            }, 100);
        }
        
        // 停止随机选择食物
        function stopFoodDecider() {
            if (foodDeciderInterval) {
                clearInterval(foodDeciderInterval);
                foodDeciderInterval = null;
            }
            
            // 启用开始按钮，禁用停止按钮
            if (startFoodBtn) {
                startFoodBtn.disabled = false;
            }
            if (stopFoodBtn) {
                stopFoodBtn.disabled = true;
            }
        }
        
        // 检查今天吃什么窗口是否存在
        const foodDeciderWindowElement = document.getElementById('food-decider-window');
        if (foodDeciderWindowElement) {
            // 初始化今天吃什么窗口样式
            foodDeciderWindowElement.style.position = 'fixed';
            foodDeciderWindowElement.style.left = '50%';
            foodDeciderWindowElement.style.top = '50%';
            foodDeciderWindowElement.style.transform = 'translate(-50%, -50%)';
            foodDeciderWindowElement.style.zIndex = '1100';
        }
    
        // 时钟日历小组件功能
        let currentDate = new Date();
        
        function initTimeCalendar() {
            updateClock();
            updateCalendar();
            updateDigitalTime();
            
            // 每秒更新时钟
            setInterval(updateClock, 1000);
            setInterval(updateDigitalTime, 1000);
            
            // 添加日历导航事件
            const prevMonthBtn = document.getElementById('prev-month');
            const nextMonthBtn = document.getElementById('next-month');
            
            if (prevMonthBtn) {
                prevMonthBtn.addEventListener('click', () => {
                    currentDate.setMonth(currentDate.getMonth() - 1);
                    updateCalendar();
                });
            }
            
            if (nextMonthBtn) {
                nextMonthBtn.addEventListener('click', () => {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    updateCalendar();
                });
            }
        }
        
        function updateClock() {
            const now = new Date();
            const hours = now.getHours() % 12 || 12;
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();
            
            const hourDeg = (hours * 30) + (minutes * 0.5);
            const minuteDeg = minutes * 6;
            const secondDeg = seconds * 6;
            
            const hourHand = document.getElementById('hour-hand');
            const minuteHand = document.getElementById('minute-hand');
            const secondHand = document.getElementById('second-hand');
            
            if (hourHand) {
                hourHand.style.transform = `rotate(${hourDeg}deg)`;
            }
            if (minuteHand) {
                minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
            }
            if (secondHand) {
                secondHand.style.transform = `rotate(${secondDeg}deg)`;
            }
        }
        
        function updateDigitalTime() {
            const now = new Date();
            const timeString = now.toLocaleTimeString('zh-CN', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            const dateString = now.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });
            
            const digitalTime = document.getElementById('digital-time');
            const dateInfo = document.getElementById('date-info');
            
            if (digitalTime) {
                digitalTime.textContent = timeString;
            }
            if (dateInfo) {
                dateInfo.textContent = dateString;
            }
        }
        
        function updateCalendar() {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            
            const calendarTitle = document.getElementById('calendar-title');
            const calendarDays = document.getElementById('calendar-days');
            
            if (calendarTitle) {
                calendarTitle.textContent = `${year}年${month + 1}月`;
            }
            
            if (calendarDays) {
                calendarDays.innerHTML = '';
                
                // 获取当月第一天是星期几
                const firstDay = new Date(year, month, 1).getDay();
                // 获取当月的天数
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                
                // 添加上个月的占位
                for (let i = 0; i < firstDay; i++) {
                    const emptyDay = document.createElement('div');
                    emptyDay.className = 'calendar-day empty';
                    calendarDays.appendChild(emptyDay);
                }
                
                // 添加当月的天数
                for (let i = 1; i <= daysInMonth; i++) {
                    const day = document.createElement('div');
                    day.className = 'calendar-day';
                    day.textContent = i;
                    
                    // 标记今天
                    const today = new Date();
                    if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                        day.classList.add('today');
                    }
                    
                    calendarDays.appendChild(day);
                }
            }
        }

        // 初始化待办事项列表
        function initTodoList() {
            // 从localStorage加载待办事项
            const todos = JSON.parse(localStorage.getItem('chickrubgo-todos')) || [];
            
            // 渲染待办事项列表
            renderTodoList(todos);
            
            // 添加待办事项
            const addTodoBtn = document.getElementById('add-todo-btn');
            const todoInput = document.getElementById('todo-input');
            
            if (addTodoBtn) {
                addTodoBtn.addEventListener('click', addTodo);
            }
            
            if (todoInput) {
                todoInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        addTodo();
                    }
                });
            }
            
            // 清除已完成
            const clearCompletedBtn = document.getElementById('clear-completed-btn');
            if (clearCompletedBtn) {
                clearCompletedBtn.addEventListener('click', function() {
                    const updatedTodos = todos.filter(todo => !todo.completed);
                    localStorage.setItem('chickrubgo-todos', JSON.stringify(updatedTodos));
                    renderTodoList(updatedTodos);
                });
            }
            
            // 清空所有
            const clearAllBtn = document.getElementById('clear-all-btn');
            if (clearAllBtn) {
                clearAllBtn.addEventListener('click', function() {
                    ShowConfirm('确认操作', '确定要清空所有待办事项吗？', function(confirmed) {
                        if (confirmed) {
                            localStorage.removeItem('chickrubgo-todos');
                            renderTodoList([]);
                        }
                    });
                });
            }
            
            // 添加待办事项函数
            function addTodo() {
                if (todoInput && todoInput.value.trim() !== '') {
                    const newTodo = {
                        id: Date.now(),
                        text: todoInput.value.trim(),
                        completed: false,
                        timestamp: Date.now()
                    };
                    
                    todos.push(newTodo);
                    localStorage.setItem('chickrubgo-todos', JSON.stringify(todos));
                    renderTodoList(todos);
                    todoInput.value = '';
                }
            }
        }

        // 渲染待办事项列表
        function renderTodoList(todos) {
            const todoList = document.getElementById('todo-list');
            if (!todoList) return;
            
            todoList.innerHTML = '';
            
            if (todos.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'todo-empty';
                emptyMessage.textContent = '暂无待办事项，添加一个吧！';
                todoList.appendChild(emptyMessage);
                return;
            }
            
            todos.forEach(todo => {
                const todoItem = document.createElement('div');
                todoItem.className = 'todo-item';
                if (todo.completed) {
                    todoItem.classList.add('completed');
                }
                
                todoItem.innerHTML = `
                    <div class="todo-content">
                        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} data-id="${todo.id}">
                        <span class="todo-text">${todo.text}</span>
                    </div>
                    <button class="todo-delete-btn" data-id="${todo.id}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                `;
                
                todoList.appendChild(todoItem);
            });
            
            // 为复选框添加事件
            document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const todoId = parseInt(this.dataset.id);
                    const todos = JSON.parse(localStorage.getItem('chickrubgo-todos')) || [];
                    const updatedTodos = todos.map(todo => {
                        if (todo.id === todoId) {
                            return { ...todo, completed: this.checked };
                        }
                        return todo;
                    });
                    localStorage.setItem('chickrubgo-todos', JSON.stringify(updatedTodos));
                    renderTodoList(updatedTodos);
                });
            });
            
            // 为删除按钮添加事件
            document.querySelectorAll('.todo-delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const todoId = parseInt(this.dataset.id);
                    const todos = JSON.parse(localStorage.getItem('chickrubgo-todos')) || [];
                    const updatedTodos = todos.filter(todo => todo.id !== todoId);
                    localStorage.setItem('chickrubgo-todos', JSON.stringify(updatedTodos));
                    renderTodoList(updatedTodos);
                });
            });
        }

        // 初始化画板
        function initDrawingBoard() {
            const canvas = document.getElementById('drawing-canvas');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            
            // 绘制状态
            const drawingState = {
                isDrawing: false,
                lastX: 0,
                lastY: 0,
                tool: 'brush',
                color: '#000000',
                brushSize: 5,
                savedData: localStorage.getItem('chickrubgo-drawing') || null,
                history: [],
                historyIndex: -1
            };
            
            // 设置画布尺寸
            function resizeCanvas() {
                const container = canvas.parentElement;
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
                
                // 重新绘制保存的内容
                if (drawingState.savedData) {
                    const img = new Image();
                    img.onload = function() {
                        ctx.drawImage(img, 0, 0);
                    };
                    img.src = drawingState.savedData;
                }
            }
            
            // 调整画布尺寸
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            
            // 保存当前画布状态到历史记录
            function saveToHistory() {
                // 移除历史记录中当前索引之后的所有记录
                drawingState.history = drawingState.history.slice(0, drawingState.historyIndex + 1);
                // 添加当前状态到历史记录
                drawingState.history.push(canvas.toDataURL());
                // 限制历史记录长度
                if (drawingState.history.length > 20) {
                    drawingState.history.shift();
                } else {
                    drawingState.historyIndex++;
                }
            }
            
            // 撤销
            function undo() {
                if (drawingState.historyIndex > 0) {
                    drawingState.historyIndex--;
                    const img = new Image();
                    img.onload = function() {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);
                    };
                    img.src = drawingState.history[drawingState.historyIndex];
                }
            }
            
            // 重做
            function redo() {
                if (drawingState.historyIndex < drawingState.history.length - 1) {
                    drawingState.historyIndex++;
                    const img = new Image();
                    img.onload = function() {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);
                    };
                    img.src = drawingState.history[drawingState.historyIndex];
                }
            }
            
            // 开始绘制
            function startDrawing(e) {
                drawingState.isDrawing = true;
                const rect = canvas.getBoundingClientRect();
                drawingState.lastX = e.clientX - rect.left;
                drawingState.lastY = e.clientY - rect.top;
                
                // 开始路径
                ctx.beginPath();
                ctx.moveTo(drawingState.lastX, drawingState.lastY);
                
                // 保存当前状态到历史记录
                saveToHistory();
            }
            
            // 绘制中
            function draw(e) {
                if (!drawingState.isDrawing) return;
                
                const rect = canvas.getBoundingClientRect();
                const currentX = e.clientX - rect.left;
                const currentY = e.clientY - rect.top;
                
                ctx.strokeStyle = drawingState.color;
                ctx.lineWidth = drawingState.brushSize;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                ctx.lineTo(currentX, currentY);
                ctx.stroke();
                
                drawingState.lastX = currentX;
                drawingState.lastY = currentY;
            }
            
            // 结束绘制
            function stopDrawing() {
                if (drawingState.isDrawing) {
                    drawingState.isDrawing = false;
                    ctx.closePath();
                    
                    // 保存到localStorage
                    drawingState.savedData = canvas.toDataURL();
                    localStorage.setItem('chickrubgo-drawing', drawingState.savedData);
                }
            }
            
            // 事件监听
            canvas.addEventListener('mousedown', startDrawing);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', stopDrawing);
            canvas.addEventListener('mouseout', stopDrawing);
            
            // 触摸支持
            canvas.addEventListener('touchstart', function(e) {
                e.preventDefault();
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent('mousedown', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                canvas.dispatchEvent(mouseEvent);
            });
            
            canvas.addEventListener('touchmove', function(e) {
                e.preventDefault();
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                canvas.dispatchEvent(mouseEvent);
            });
            
            canvas.addEventListener('touchend', function(e) {
                e.preventDefault();
                const mouseEvent = new MouseEvent('mouseup', {});
                canvas.dispatchEvent(mouseEvent);
            });
            
            // 工具选择
            document.querySelectorAll('.tool-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    drawingState.tool = this.dataset.tool;
                });
            });
            
            // 颜色选择
            const primaryColor = document.getElementById('primary-color');
            if (primaryColor) {
                primaryColor.addEventListener('change', function() {
                    drawingState.color = this.value;
                });
            }
            
            // 颜色面板
            document.querySelectorAll('.color-swatch').forEach(swatch => {
                swatch.style.backgroundColor = swatch.dataset.color;
                swatch.addEventListener('click', function() {
                    drawingState.color = this.dataset.color;
                    if (primaryColor) {
                        primaryColor.value = this.dataset.color;
                    }
                });
            });
            
            // 笔刷大小
            const brushSize = document.getElementById('brush-size');
            const brushSizeValue = document.getElementById('brush-size-value');
            if (brushSize && brushSizeValue) {
                brushSize.addEventListener('input', function() {
                    drawingState.brushSize = parseInt(this.value);
                    brushSizeValue.textContent = this.value;
                });
            }
            
            // 清空画布
            const clearCanvasBtn = document.getElementById('clear-canvas-btn');
            if (clearCanvasBtn) {
                clearCanvasBtn.addEventListener('click', function() {
                    ShowConfirm('确认操作', '确定要清空画布吗？', function(confirmed) {
                        if (confirmed) {
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            drawingState.savedData = null;
                            localStorage.removeItem('chickrubgo-drawing');
                            drawingState.history = [];
                            drawingState.historyIndex = -1;
                        }
                    });
                });
            }
            
            // 保存画布
            const saveCanvasBtn = document.getElementById('save-canvas-btn');
            if (saveCanvasBtn) {
                saveCanvasBtn.addEventListener('click', function() {
                    const link = document.createElement('a');
                    link.download = `drawing-${new Date().toISOString().slice(0, 10)}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                });
            }
            
            // 撤销
            const undoBtn = document.getElementById('undo-btn');
            if (undoBtn) {
                undoBtn.addEventListener('click', undo);
            }
            
            // 重做
            const redoBtn = document.getElementById('redo-btn');
            if (redoBtn) {
                redoBtn.addEventListener('click', redo);
            }
        }
        
        // 初始化白噪音
        function initWhiteNoise() {
            // 音频对象
            let audio = null;
            let currentSound = null;
            
            // 音量控制
            const volumeSlider = document.getElementById('white-noise-volume');
            const volumeValue = document.getElementById('white-noise-volume-value');
            
            if (volumeSlider && volumeValue) {
                volumeSlider.addEventListener('input', function() {
                    const volume = parseFloat(this.value);
                    volumeValue.textContent = `${Math.round(volume * 100)}%`;
                    if (audio) {
                        audio.volume = volume;
                    }
                });
            }
            
            // 播放/暂停按钮点击事件
            document.querySelectorAll('.play-white-noise-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const soundPath = this.closest('.white-noise-item').dataset.sound;
                    
                    // 如果点击的是当前播放的声音，则切换播放/暂停状态
                    if (currentSound === soundPath) {
                        if (audio && !audio.paused) {
                            audio.pause();
                            this.innerHTML = '<i class="fa-solid fa-play"></i>';
                        } else if (audio && audio.paused) {
                            audio.play().catch(error => {
                                if (error.name === 'NotAllowedError') {
                                    ShowConfirm('白噪音', '需要您的授权才能播放白噪音，是否授权？', (confirmed) => {
                                        if (confirmed) {
                                            localStorage.setItem('whiteNoisePermission', 'true');
                                            audio.play().catch(err => {
                                                ShowAlert('错误', '播放白噪音失败，请稍后重试');
                                            });
                                        }
                                    });
                                }
                            });
                            this.innerHTML = '<i class="fa-solid fa-pause"></i>';
                        }
                    } else {
                        // 停止当前播放的声音
                        if (audio) {
                            audio.pause();
                            audio = null;
                            // 重置所有按钮状态
                            document.querySelectorAll('.play-white-noise-btn').forEach(b => {
                                b.innerHTML = '<i class="fa-solid fa-play"></i>';
                            });
                        }
                        
                        // 创建新的音频对象并播放
                        audio = new Audio(soundPath);
                        audio.loop = true;
                        audio.volume = volumeSlider ? parseFloat(volumeSlider.value) : 0.5;
                        currentSound = soundPath;
                        
                        audio.play().catch(error => {
                            if (error.name === 'NotAllowedError') {
                                ShowConfirm('白噪音', '需要您的授权才能播放白噪音，是否授权？', (confirmed) => {
                                    if (confirmed) {
                                        localStorage.setItem('whiteNoisePermission', 'true');
                                        audio.play().catch(err => {
                                            ShowAlert('错误', '播放白噪音失败，请稍后重试');
                                        });
                                    }
                                });
                            }
                        });
                        
                        // 更新按钮状态
                        this.innerHTML = '<i class="fa-solid fa-pause"></i>';
                    }
                });
            });
        }