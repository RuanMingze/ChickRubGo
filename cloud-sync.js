// 云端同步功能实现
// 基于现有的 Supabase 客户端和本地存储能力

// 初始化 Supabase 客户端
// 避免重复声明变量
if (typeof window.supabaseClient === 'undefined') {
    const supabaseUrl = 'https://pyywrxrmtehucmkpqkdi.supabase.co';
    const supabaseKey = 'sb_publishable_Ztie93n2pi48h_rAIuviyA_ftjAIDuj';
    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
}
// 使用 var 声明以避免重复声明错误
var supabaseClient = window.supabaseClient;

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
    const { data: { user } } = await supabaseClient.auth.getUser();
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
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return null;
    
    // 优先使用全名，其次使用name，最后使用email
    const username = user.user_metadata.full_name || user.user_metadata.name || user.email;
    
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
    const username = await getCurrentUsername();
    if (!username) {
      console.log('用户未登录，跳过云端同步');
      return false;
    }
    
    // 使用 upsert 机制，基于 username 唯一键
    const { error } = await supabaseClient
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
      return false;
    }
    
    console.log('设置已成功同步到云端');
    return true;
  } catch (error) {
    console.error('保存设置到 Supabase 出错:', error);
    return false;
  }
}

/**
 * 从 Supabase 加载设置
 * @returns {Promise<Object|null>} 设置对象或null
 */
async function loadSettingsFromSupabase() {
  try {
    const username = await getCurrentUsername();
    if (!username) {
      console.log('用户未登录，跳过云端加载');
      return null;
    }
    
    const { data, error } = await supabaseClient
      .from('user_settings')
      .select('settings')
      .eq('username', username)
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