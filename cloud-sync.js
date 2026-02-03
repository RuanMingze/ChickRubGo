// 云端同步功能实现
// 基于现有的 Supabase 客户端和本地存储能力

// 初始化 Supabase 客户端
// 避免重复声明变量
console.log('开始检查 Supabase 客户端初始化状态...');
if (typeof window !== 'undefined') {
    console.log('window 对象存在');
    console.log('window.supabase 存在:', typeof window.supabase !== 'undefined');
    console.log('window.supabaseClient 存在:', typeof window.supabaseClient !== 'undefined');
    
    if (typeof window.supabaseClient === 'undefined') {
        console.log('在 cloud-sync.js 中初始化 Supabase 客户端...');
        if (typeof window.supabase !== 'undefined') {
            const supabaseUrl = 'https://pyywrxrmtehucmkpqkdi.supabase.co';
            const supabaseKey = 'sb_publishable_Ztie93n2pi48h_rAIuviyA_ftjAIDuj';
            console.log('Supabase URL:', supabaseUrl);
            console.log('Supabase Key:', supabaseKey ? '***' + supabaseKey.slice(-4) : '未设置');
            
            // 正确初始化 Supabase 客户端
            window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true
                }
            });
            
            console.log('Supabase 客户端初始化成功:', !!window.supabaseClient);
            // 检查客户端配置
            if (window.supabaseClient) {
                console.log('客户端配置检查:', {
                    url: window.supabaseClient?.options?.url,
                    auth: window.supabaseClient?.options?.auth
                });
            }
        } else {
            console.error('Supabase SDK 未加载');
        }
    } else {
        console.log('Supabase 客户端已在其他地方初始化，直接使用现有实例');
        console.log('客户端实例存在:', !!window.supabaseClient);
        // 检查现有客户端配置
        if (window.supabaseClient) {
            console.log('现有客户端配置检查:', {
                url: window.supabaseClient?.options?.url,
                auth: window.supabaseClient?.options?.auth
            });
            
            // 如果客户端配置不正确，重新初始化
            if (!window.supabaseClient?.options?.url || !window.supabaseClient?.options?.auth) {
                console.log('客户端配置不正确，重新初始化...');
                const supabaseUrl = 'https://pyywrxrmtehucmkpqkdi.supabase.co';
                const supabaseKey = 'sb_publishable_Ztie93n2pi48h_rAIuviyA_ftjAIDuj';
                window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey, {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true
                    }
                });
                console.log('重新初始化后客户端配置:', {
                    url: window.supabaseClient?.options?.url,
                    auth: window.supabaseClient?.options?.auth
                });
            }
        }
    }
} else {
    console.error('window 对象不存在，无法初始化 Supabase 客户端');
}
// 直接使用 window.supabaseClient，避免重复声明错误
// 注意：这里不再声明局部变量 supabaseClient，而是直接使用 window.supabaseClient
// 这样可以避免与 index.html 中声明的 const supabaseClient 冲突

// 重试配置
const SYNC_RETRY_DELAY = 3000; // 初始重试延迟（毫秒）
const MAX_RETRY_ATTEMPTS = 5; // 最大重试次数
const RETRY_BACKOFF_MULTIPLIER = 2; // 重试延迟倍增因子

// 同步状态管理
let syncInProgress = false;
let retryAttempt = 0;
let retryTimer = null;

/**
 * 检查用户是否已登录
 * @returns {Promise<boolean>} 是否已登录
 */
async function isUserLoggedIn() {
  try {
    if (!window.supabaseClient) {
      console.error('Supabase 客户端未初始化');
      return false;
    }
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    return !!user;
  } catch (error) {
    console.error('检查登录状态失败:', error);
    return false;
  }
}

/**
 * 获取当前登录用户的信息
 * @returns {Promise<Object|null>} 用户信息对象，包含id和username
 */
async function getCurrentUserInfo() {
  try {
    if (!window.supabaseClient) {
      console.error('Supabase 客户端未初始化');
      return null;
    }
    const { data: { user }, error } = await window.supabaseClient.auth.getUser();
    if (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
    if (!user) return null;
    
    // 优先使用全名，其次使用name，最后使用email
    const username = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'anonymous';
    
    return {
      id: user.id, // Supabase 自动生成的 UUID 用户 ID
      username: username
    };
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
}

/**
 * 获取当前登录用户的用户名
 * @returns {Promise<string|null>} 用户名或null
 */
async function getCurrentUsername() {
  const userInfo = await getCurrentUserInfo();
  return userInfo?.username || null;
}

/**
 * 获取当前登录用户的 ID
 * @returns {Promise<string|null>} 用户ID或null
 */
async function getCurrentUserId() {
  const userInfo = await getCurrentUserInfo();
  return userInfo?.id || null;
}

/**
 * 从本地存储获取所有设置
 * @returns {Object} 所有设置的对象
 */
function getAllLocalSettings() {
  return {
    showWallpaper: localStorage.getItem('showWallpaper') === 'true',
    showTime: localStorage.getItem('showTime') === 'true',
    darkMode: localStorage.getItem('darkMode') === 'true',
    showAnimations: localStorage.getItem('showAnimations') === 'true',
    searchEngine: localStorage.getItem('searchEngine') || 'https://cn.bing.com/search?q=%text%',
    customSearchUrl: localStorage.getItem('customSearchUrl') || '',
    searchTarget: localStorage.getItem('searchTarget') || '_blank',
    weatherApiKey: localStorage.getItem('weatherApiKey') || '',
    autoLocation: localStorage.getItem('autoLocation') === 'true',
    weatherCity: localStorage.getItem('weatherCity') || 'deqing',
    bgMusicName: localStorage.getItem('bgMusicName') || '',
    isSimpleMode: localStorage.getItem('isSimpleMode') === 'true',
    notepadContent: localStorage.getItem('notepadContent') || '',
    meritCount: localStorage.getItem('meritCount') || '0'
  };
}

/**
 * 将设置保存到 Supabase
 * @param {Object} settings 设置对象
 * @returns {Promise<boolean>} 是否保存成功
 */
async function saveSettingsToSupabase(settings) {
  try {
    console.log('开始保存设置到 Supabase...');
    if (!window.supabaseClient) {
      console.error('Supabase 客户端未初始化');
      return false;
    }
    
    // 检查客户端配置
    console.log('客户端实例检查:', {
      exists: !!window.supabaseClient,
      url: window.supabaseClient?.options?.url,
      auth: window.supabaseClient?.options?.auth
    });
    
    const { data: { user }, error: authError } = await window.supabaseClient.auth.getUser();
    if (authError) {
      console.error('获取用户信息失败:', authError);
      console.error('认证错误详情:', JSON.stringify(authError));
      return false;
    }
    
    if (!user) {
      console.log('用户未登录，跳过云端同步');
      return false;
    }
    
    const username = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'anonymous';
    console.log('当前用户:', username);
    console.log('用户 ID:', user.id);
    console.log('用户邮箱:', user.email);
    console.log('要保存的设置:', settings);
    
    // 手动检查认证状态
    const { data: session } = await window.supabaseClient.auth.getSession();
    console.log('当前会话:', session?.session ? '存在' : '不存在');
    console.log('会话令牌:', session?.session?.access_token ? '***' + session.session.access_token.slice(-4) : '无');
    
    // 使用 upsert 机制，基于 username 唯一键
    console.log('准备发送 upsert 请求...');
    const { error } = await window.supabaseClient
      .from('user_settings')
      .upsert({
        username: username,
        settings: settings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'username' // 基于 username 字段进行冲突处理
      });
    
    if (error) {
      console.error('保存设置到 Supabase 失败:', error);
      console.error('错误详情:', JSON.stringify(error));
      console.error('错误代码:', error.code);
      console.error('错误消息:', error.message);
      return false;
    }
    
    console.log('设置已成功同步到云端');
    return true;
  } catch (error) {
    console.error('保存设置到 Supabase 出错:', error);
    console.error('错误详情:', JSON.stringify(error));
    console.error('错误堆栈:', error.stack);
    return false;
  }
}

/**
 * 从 Supabase 加载用户设置
 * @returns {Promise<Object|null>} 设置对象或null
 */
async function loadSettingsFromSupabase() {
  try {
    console.log('开始从 Supabase 加载设置...');
    if (!window.supabaseClient) {
      console.error('Supabase 客户端未初始化');
      return null;
    }
    
    // 检查客户端配置
    console.log('客户端实例检查:', {
      exists: !!window.supabaseClient,
      url: window.supabaseClient?.options?.url,
      auth: window.supabaseClient?.options?.auth
    });
    
    const { data: { user }, error: authError } = await window.supabaseClient.auth.getUser();
    if (authError) {
      console.error('获取用户信息失败:', authError);
      console.error('认证错误详情:', JSON.stringify(authError));
      return null;
    }
    
    if (!user) {
      console.log('用户未登录，跳过云端加载');
      return null;
    }
    
    const username = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'anonymous';
    console.log('当前用户:', username);
    console.log('用户 ID:', user.id);
    console.log('用户邮箱:', user.email);
    
    // 手动检查认证状态
    const { data: session } = await window.supabaseClient.auth.getSession();
    console.log('当前会话:', session?.session ? '存在' : '不存在');
    console.log('会话令牌:', session?.session?.access_token ? '***' + session.session.access_token.slice(-4) : '无');
    
    // 尝试从 Supabase 加载设置
    try {
      console.log('准备发送 select 请求...');
      const { data, error } = await window.supabaseClient
        .from('user_settings')
        .select('settings')
        .eq('username', username)
        .single();
      
      if (error) {
        console.error('从 Supabase 加载设置失败:', error);
        console.error('错误详情:', JSON.stringify(error));
        console.error('错误代码:', error.code);
        console.error('错误消息:', error.message);
        // 获取本地设置并迁移到服务器
        const localSettings = getAllLocalSettings();
        console.log('尝试迁移本地数据到服务器:', localSettings);
        await saveSettingsToSupabase(localSettings);
        return localSettings;
      }
      
      console.log('从云端加载的设置:', data?.settings);
      return data?.settings || null;
    } catch (selectError) {
      console.error('从 Supabase 加载设置出错:', selectError);
      console.error('错误堆栈:', selectError.stack);
      // 获取本地设置并迁移到服务器
      const localSettings = getAllLocalSettings();
      console.log('尝试迁移本地数据到服务器:', localSettings);
      await saveSettingsToSupabase(localSettings);
      return localSettings;
    }
  } catch (error) {
    console.error('从 Supabase 加载设置出错:', error);
    console.error('错误堆栈:', error.stack);
    // 获取本地设置并返回
    const localSettings = getAllLocalSettings();
    return localSettings;
  }
}

/**
 * 将云端设置应用到本地
 * @param {Object} cloudSettings 云端设置对象
 */
function applyCloudSettings(cloudSettings) {
  if (!cloudSettings) return;
  
  // 将云端设置保存到本地存储
  Object.entries(cloudSettings).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      localStorage.setItem(key, value.toString());
    } else {
      localStorage.setItem(key, value);
    }
  });
  
  console.log('已从云端加载并应用设置');
}

/**
 * 执行云端同步（带重试机制）
 * @param {Object} settings 要同步的设置对象
 */
async function syncSettingsWithRetry(settings) {
  if (syncInProgress) return;
  
  // 检查用户是否登录，未登录则不进行同步
  const username = await getCurrentUsername();
  if (!username) {
    console.log('用户未登录，跳过云端同步');
    return;
  }
  
  syncInProgress = true;
  
  try {
    const success = await saveSettingsToSupabase(settings);
    
    if (success) {
      // 同步成功，重置重试计数
      retryAttempt = 0;
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    } else if (retryAttempt < MAX_RETRY_ATTEMPTS) {
      // 同步失败，计划重试
      retryAttempt++;
      const delay = SYNC_RETRY_DELAY * (RETRY_BACKOFF_MULTIPLIER ** (retryAttempt - 1));
      
      console.log(`同步失败，${delay}毫秒后重试（${retryAttempt}/${MAX_RETRY_ATTEMPTS}）`);
      
      retryTimer = setTimeout(() => {
        syncSettingsWithRetry(settings);
      }, delay);
    } else {
      // 达到最大重试次数
      console.error('已达到最大重试次数，停止同步尝试');
      retryAttempt = 0;
    }
  } finally {
    syncInProgress = false;
  }
}

/**
 * 页面加载时的同步逻辑
 */
async function loadSettingsOnPageLoad() {
  try {
    const loggedIn = await isUserLoggedIn();
    
    if (loggedIn) {
      // 已登录状态，优先从云端加载设置
      const cloudSettings = await loadSettingsFromSupabase();
      
      if (cloudSettings) {
        // 应用云端设置
        applyCloudSettings(cloudSettings);
      } else {
        // 云端无设置或加载失败，使用本地设置
        console.log('云端无设置或加载失败，使用本地设置');
      }
    } else {
      // 未登录状态，直接使用本地设置
      console.log('用户未登录，使用本地设置');
    }
  } catch (error) {
    console.error('页面加载时同步设置出错:', error);
    // 出错时不影响前端功能，继续使用本地设置
  }
}

/**
 * 用户修改配置时的同步逻辑
 * @param {Object} updatedSettings 更新后的设置对象（可选）
 */
async function syncSettingsOnChange(updatedSettings = null) {
  try {
    const settings = updatedSettings || getAllLocalSettings();
    await syncSettingsWithRetry(settings);
  } catch (error) {
    console.error('同步设置时出错:', error);
    // 出错时不影响前端功能
  }
}

/**
 * 监听网络状态变化，网络恢复时重试同步
 */
function setupNetworkStatusListener() {
  window.addEventListener('online', () => {
    console.log('网络已连接，检查是否需要同步设置');
    // 网络恢复时，尝试同步当前本地设置
    const currentSettings = getAllLocalSettings();
    syncSettingsWithRetry(currentSettings);
  });
}

/**
 * 初始化云端同步功能
 */
function initCloudSync() {
  // 页面加载时执行同步逻辑
  window.addEventListener('load', loadSettingsOnPageLoad);
  
  // 设置网络状态监听器
  setupNetworkStatusListener();
  
  console.log('云端同步功能已初始化');
}

// 导出函数（如果需要在其他地方使用）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initCloudSync,
    syncSettingsOnChange,
    loadSettingsFromSupabase,
    saveSettingsToSupabase,
    isUserLoggedIn,
    getCurrentUsername
  };
} else {
  // 在浏览器环境中，将函数添加到全局对象
  window.CloudSync = {
    initCloudSync,
    syncSettingsOnChange,
    loadSettingsFromSupabase,
    saveSettingsToSupabase,
    isUserLoggedIn,
    getCurrentUsername
  };
}

// 自动初始化云端同步功能
if (typeof window !== 'undefined') {
  // 当DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCloudSync);
  } else {
    initCloudSync();
  }
}