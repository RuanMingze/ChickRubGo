# ChickRubGo for Android

这是一个简单的Android应用，使用WebView嵌入ChickRubGo网站。

## 项目结构

```
android/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/com/chickrubgo/app/
│   │       │   └── MainActivity.java
│   │       └── res/
│   │           ├── layout/
│   │           │   └── activity_main.xml
│   │           └── values/
│   │               └── strings.xml
│   ├── build.gradle
│   └── proguard-rules.pro
├── build.gradle
├── gradle.properties
└── settings.gradle
```

## 功能特性

- 使用WebView加载 https://ruanmingze.github.io/ChickRubGo/
- 支持JavaScript和DOM存储
- 支持返回键导航
- 响应式布局

## 构建要求

- Android Studio Hedgehog (2023.1.1) 或更高版本
- JDK 8 或更高版本
- Android SDK API 24 (Android 7.0) 或更高版本
- Gradle 8.0 或更高版本

## 构建步骤

1. 使用Android Studio打开 `android` 文件夹
2. 等待Gradle同步完成
3. 连接Android设备或启动模拟器
4. 点击运行按钮或使用命令：

```bash
cd android
./gradlew assembleDebug
```

## 生成的APK位置

Debug版本：`android/app/build/outputs/apk/debug/app-debug.apk`
Release版本：`android/app/build/outputs/apk/release/app-release.apk`

## 注意事项

- 应用需要网络权限才能访问网站
- 应用配置为允许明文流量（HTTP）
- 最低支持Android 7.0 (API 24)
- 目标SDK为Android 14 (API 34)