<?php
// 获取搜索关键词
$searchQuery = isset($_GET['q']) ? trim($_GET['q']) : '';

// 如果没有搜索关键词，重定向到首页
if (empty($searchQuery)) {
    header('Location: index.html');
    exit;
}

// 获取搜索引擎参数
$engine = isset($_GET['engine']) ? strtolower(trim($_GET['engine'])) : 'bing';

// 搜索引擎映射
$searchEngines = [
    'bing' => 'https://cn.bing.com/search?q=%text%',
    'google' => 'https://www.google.com/search?q=%text%',
    'duckduckgo' => 'https://duckduckgo.com/?q=%text%',
    'baidu' => 'https://www.baidu.com/s?wd=%text%'
];

// 确保使用有效的搜索引擎，默认使用 bing
$engineUrl = isset($searchEngines[$engine]) ? $searchEngines[$engine] : $searchEngines['bing'];

// 构建搜索 URL
$searchUrl = str_replace('%text%', urlencode($searchQuery), $engineUrl);

// 重定向到搜索结果页面
header('Location: ' . $searchUrl);
exit;
?>