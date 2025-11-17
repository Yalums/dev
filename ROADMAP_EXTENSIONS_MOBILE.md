# Browser Extensions & Mobile App Roadmap
# 浏览器插件和移动端应用路线图

---

## 🎯 产品定位 / Product Positioning

### Current State / 当前状态
- ✅ Web App (PWA) - 部署在GitHub Pages
- ✅ Tauri Desktop - 可选的桌面应用
- ✅ Tampermonkey Script - 浏览器脚本集成

### Future Extensions / 未来扩展
- 🚀 **Browser Extensions** - Chrome/Firefox/Edge原生插件
- 📱 **Mobile Apps** - iOS/Android移动应用
- 💡 **Safari Extension** - Safari浏览器支持（可选）

---

## 🔌 Part 1: Browser Extensions / 浏览器插件

### 为什么需要浏览器插件？

**用户体验优势：**
- ✅ **一键导出** - 无需安装Tampermonkey
- ✅ **原生集成** - 浏览器工具栏图标
- ✅ **自动检测** - 在ChatGPT/Claude页面自动激活
- ✅ **权限明确** - 用户更信任官方商店
- ✅ **自动更新** - Chrome/Firefox自动推送更新
- ✅ **更专业** - 在商店展示，增加可发现性

**vs Tampermonkey Script：**
| 特性 | Browser Extension | Tampermonkey |
|------|-------------------|--------------|
| 安装难度 | ⭐ 一键安装 | ⭐⭐ 需先装TM |
| 用户信任 | ✅ 官方商店 | ⚠️ 第三方脚本 |
| 更新 | ✅ 自动 | ⚠️ 手动或半自动 |
| 权限管理 | ✅ 清晰 | ⚠️ TM统一权限 |
| 可发现性 | ✅ 商店搜索 | ❌ 需要链接 |
| 开发难度 | ⭐⭐⭐ 中等 | ⭐⭐ 简单 |

---

### 技术架构 / Technical Architecture

#### Manifest V3 (Chrome/Edge/Opera)

**目录结构：**
```
browser-extension/
├── manifest.json          # Extension配置（Manifest V3）
├── background.js          # Service Worker后台脚本
├── content.js            # 注入到页面的内容脚本
├── popup/                # 点击图标弹出的UI
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── options/              # 设置页面
│   ├── options.html
│   ├── options.js
│   └── options.css
├── icons/                # 各尺寸图标
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── shared/               # 共享代码
    ├── parser.js         # 从主项目复用
    ├── exporter.js
    └── utils.js
```

**manifest.json 示例：**
```json
{
  "manifest_version": 3,
  "name": "Lyra Exporter",
  "version": "1.0.0",
  "description": "Export ChatGPT, Claude, Gemini conversations with complete branch preservation",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": "icons/icon48.png"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": [
        "https://chatgpt.com/*",
        "https://claude.ai/*",
        "https://gemini.google.com/*",
        "https://aistudio.google.com/*",
        "https://notebooklm.google.com/*"
      ],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "permissions": [
    "storage",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*"
  ],
  "options_page": "options/options.html"
}
```

#### Firefox Add-on (Manifest V2兼容)

Firefox仍支持Manifest V2，可以共用大部分代码，只需调整manifest.json：

**manifest.json (Firefox):**
```json
{
  "manifest_version": 2,
  "name": "Lyra Exporter",
  "version": "1.0.0",
  "description": "Export AI conversations with branch preservation",
  "icons": {
    "48": "icons/icon48.png",
    "96": "icons/icon96.png"
  },
  "browser_action": {
    "default_popup": "popup/popup.html",
    "default_icon": "icons/icon48.png"
  },
  "background": {
    "scripts": ["background.js"]
  },
  "content_scripts": [
    {
      "matches": [
        "https://chatgpt.com/*",
        "https://claude.ai/*"
      ],
      "js": ["content.js"]
    }
  ],
  "permissions": [
    "storage",
    "activeTab",
    "https://chatgpt.com/*",
    "https://claude.ai/*"
  ],
  "browser_specific_settings": {
    "gecko": {
      "id": "lyra-exporter@yalums.github.io",
      "strict_min_version": "109.0"
    }
  }
}
```

---

### 核心功能实现 / Core Features

#### 1. Content Script - 页面数据提取

**content.js:**
```javascript
// 检测当前平台
function detectPlatform() {
  const hostname = window.location.hostname;
  if (hostname.includes('chatgpt.com')) return 'chatgpt';
  if (hostname.includes('claude.ai')) return 'claude';
  if (hostname.includes('gemini.google.com')) return 'gemini';
  return null;
}

// 提取对话数据（复用主项目的parser逻辑）
async function extractConversationData() {
  const platform = detectPlatform();
  if (!platform) return null;

  // 根据平台调用不同的提取逻辑
  switch(platform) {
    case 'chatgpt':
      return await extractChatGPTData();
    case 'claude':
      return await extractClaudeData();
    case 'gemini':
      return await extractGeminiData();
    default:
      return null;
  }
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractData') {
    extractConversationData()
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 异步响应
  }
});

// 添加导出按钮到页面UI（可选）
function injectExportButton() {
  const platform = detectPlatform();
  if (!platform) return;

  const button = document.createElement('button');
  button.textContent = '📥 Export';
  button.className = 'lyra-export-btn';
  button.onclick = () => {
    chrome.runtime.sendMessage({ action: 'showExportUI' });
  };

  // 根据平台插入到合适位置
  const container = findButtonContainer(platform);
  if (container) {
    container.appendChild(button);
  }
}

// 页面加载完成后注入
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectExportButton);
} else {
  injectExportButton();
}
```

#### 2. Background Script - 后台处理

**background.js:**
```javascript
// 监听扩展安装
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 首次安装，打开欢迎页面
    chrome.tabs.create({
      url: 'https://yalums.github.io/lyra-exporter'
    });
  }
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showExportUI') {
    // 打开popup或新标签页
    chrome.action.openPopup();
  }

  if (request.action === 'exportData') {
    // 处理导出逻辑
    handleExport(request.data, request.format)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// 导出处理（复用主项目逻辑）
async function handleExport(data, format) {
  switch(format) {
    case 'markdown':
      return await exportAsMarkdown(data);
    case 'pdf':
      return await exportAsPDF(data);
    case 'screenshot':
      return await exportAsScreenshot(data);
    default:
      throw new Error('Unknown format');
  }
}
```

#### 3. Popup UI - 快速导出界面

**popup.html:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="popup-container">
    <h1>🚀 Lyra Exporter</h1>

    <div class="status" id="status">
      Ready to export
    </div>

    <div class="format-selection">
      <h3>Select Format:</h3>
      <label>
        <input type="radio" name="format" value="markdown" checked>
        📄 Markdown
      </label>
      <label>
        <input type="radio" name="format" value="pdf">
        📕 PDF
      </label>
      <label>
        <input type="radio" name="format" value="screenshot">
        📸 Screenshot
      </label>
    </div>

    <div class="options">
      <label>
        <input type="checkbox" id="includeThinking" checked>
        Include thinking process
      </label>
      <label>
        <input type="checkbox" id="includeArtifacts" checked>
        Include Artifacts
      </label>
      <label>
        <input type="checkbox" id="includeTimestamps">
        Include timestamps
      </label>
    </div>

    <button id="exportBtn" class="export-btn">
      Export Current Conversation
    </button>

    <button id="openWebAppBtn" class="secondary-btn">
      Open Full App
    </button>

    <div class="footer">
      <a href="options/options.html" target="_blank">Settings</a>
      <a href="https://github.com/Yalums/lyra-exporter" target="_blank">GitHub</a>
    </div>
  </div>

  <script src="popup.js"></script>
</body>
</html>
```

**popup.js:**
```javascript
document.getElementById('exportBtn').addEventListener('click', async () => {
  const statusEl = document.getElementById('status');
  const exportBtn = document.getElementById('exportBtn');

  try {
    statusEl.textContent = 'Extracting conversation...';
    exportBtn.disabled = true;

    // 获取当前活动标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // 发送消息到content script提取数据
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractData' });

    if (!response.success) {
      throw new Error(response.error);
    }

    // 获取导出选项
    const format = document.querySelector('input[name="format"]:checked').value;
    const options = {
      includeThinking: document.getElementById('includeThinking').checked,
      includeArtifacts: document.getElementById('includeArtifacts').checked,
      includeTimestamps: document.getElementById('includeTimestamps').checked
    };

    statusEl.textContent = `Exporting as ${format}...`;

    // 发送到background script处理导出
    const exportResponse = await chrome.runtime.sendMessage({
      action: 'exportData',
      data: response.data,
      format,
      options
    });

    if (exportResponse.success) {
      statusEl.textContent = '✅ Export successful!';
      setTimeout(() => {
        statusEl.textContent = 'Ready to export';
      }, 2000);
    }

  } catch (error) {
    statusEl.textContent = `❌ Error: ${error.message}`;
    console.error('Export error:', error);
  } finally {
    exportBtn.disabled = false;
  }
});

document.getElementById('openWebAppBtn').addEventListener('click', () => {
  chrome.tabs.create({
    url: 'https://yalums.github.io/lyra-exporter'
  });
});
```

---

### 代码复用策略 / Code Reuse Strategy

**从主项目复用（共享代码）：**

1. **Parser逻辑** (`src/utils/fileParser.js`)
   - `extractClaudeData()`
   - `extractChatGPTData()`
   - `detectBranches()`
   - 需要适配：从DOM提取而非JSON文件

2. **Export逻辑** (`src/utils/exportManager.js`, `src/utils/export/`)
   - `exportAsMarkdown()`
   - `exportAsPDF()`（需简化，浏览器环境限制）
   - 格式化函数

3. **工具函数** (`src/utils/formatHelpers.js`)
   - `escapeXml()`
   - `formatTimestamp()`

**需要重写的部分：**
- DOM数据提取（每个平台页面结构不同）
- 文件下载（使用Chrome Download API）
- UI组件（轻量化，不用React）

**共享代码打包：**
```bash
browser-extension/shared/
├── core.js           # 核心逻辑（从主项目编译）
├── parsers.js        # Parser函数
├── exporters.js      # Export函数
└── utils.js          # 工具函数
```

使用 **Webpack** 或 **Rollup** 打包共享代码：
```bash
npm run build:extension
# 输出到 browser-extension/shared/bundle.js
```

---

### 发布到商店 / Publishing

#### Chrome Web Store

**准备材料：**
1. **图标**（128x128, 48x48, 16x16）
2. **截图**（1280x800 或 640x400，至少1张）
3. **宣传图**（440x280，可选）
4. **描述**（英文 + 其他语言）
5. **隐私政策页面**（必需）

**发布流程：**
```bash
# 1. 打包扩展
cd browser-extension
zip -r lyra-exporter-chrome-v1.0.0.zip .

# 2. 上传到Chrome Web Store Developer Dashboard
# https://chrome.google.com/webstore/devconsole

# 3. 填写信息
# - 名称：Lyra Exporter
# - 描述：Export ChatGPT, Claude conversations with branch preservation
# - 分类：Productivity
# - 语言：English (+ 日本語, 한국어)

# 4. 审核（通常1-3天）
```

**费用：**
- 一次性开发者注册费：**$5 USD**

**Store页面优化：**
- **标题**：Lyra Exporter - AI Chat Export with Branch Preservation
- **简短描述**（132字符）：
  ```
  Export ChatGPT, Claude, Gemini with complete branches. PDF, Markdown, Screenshot. Privacy-first.
  ```
- **详细描述**：
  ```markdown
  # Lyra Exporter - The Only Extension That Keeps Everything

  Export your AI conversations with complete branch preservation!

  ## Why Lyra Exporter?
  - ✅ Complete branch export (edit+regenerate paths)
  - ✅ Artifacts & Canvas preserved
  - ✅ 3 export formats: Markdown, PDF, Screenshot
  - ✅ 100% privacy-first (no data uploads)
  - ✅ Open source (MIT license)

  ## Supported Platforms
  - ChatGPT (including Canvas, o1 thinking)
  - Claude (including Artifacts, thinking)
  - Gemini
  - NotebookLM
  - Google AI Studio

  ## Features
  [详细功能列表...]

  ## Privacy
  All processing happens locally in your browser.
  No data is sent to external servers.

  GitHub: https://github.com/Yalums/lyra-exporter
  ```

#### Firefox Add-ons

**准备材料：**
同Chrome，但：
- 图标：48x48, 96x96
- 描述：最多250字符
- 需要源代码（如果使用了混淆/压缩）

**发布流程：**
```bash
# 1. 打包
cd browser-extension-firefox
zip -r lyra-exporter-firefox-v1.0.0.zip .

# 2. 上传到Firefox Add-ons
# https://addons.mozilla.org/developers/

# 3. 审核（通常1-5天，更严格）
```

**费用：** 免费

#### Edge Add-ons

Edge使用Chrome扩展商店的Manifest V3格式，可以直接提交Chrome版本。

**发布流程：**
```bash
# 使用相同的Chrome版本zip文件
# 上传到 https://partner.microsoft.com/dashboard/microsoftedge/overview
```

**费用：** 免费

---

### 开发时间估算 / Development Timeline

**Phase 1: MVP (2-3周)**
- Week 1: 基础架构 + ChatGPT支持
  - Day 1-2: Manifest配置 + 项目结构
  - Day 3-5: Content script (ChatGPT数据提取)
  - Day 6-7: Popup UI + Markdown导出

- Week 2: 多平台支持
  - Day 1-3: Claude支持
  - Day 4-5: Gemini支持
  - Day 6-7: PDF导出（简化版）

- Week 3: 完善 + 发布
  - Day 1-3: 截图导出
  - Day 4-5: 测试 + Bug修复
  - Day 6-7: 准备商店材料 + 提交审核

**Phase 2: 增强功能 (1-2周)**
- 设置页面
- 批量导出
- 快捷键支持
- 更多导出选项

---

## 📱 Part 2: Mobile Apps / 移动端应用

### 技术方案选择 / Technology Options

#### Option 1: React Native (推荐) ⭐⭐⭐⭐⭐

**优势：**
- ✅ 复用现有React代码（组件、逻辑）
- ✅ 一次开发，iOS + Android双平台
- ✅ 社区成熟，库丰富
- ✅ 热更新（CodePush）
- ✅ 性能接近原生

**劣势：**
- ⚠️ App体积较大（~30-50MB）
- ⚠️ 需要学习React Native特定API
- ⚠️ 某些功能需要原生模块

**技术栈：**
```
React Native 0.73+
├── React Navigation      # 路由
├── React Native Paper    # UI组件（或自己用Tailwind）
├── AsyncStorage          # 本地存储
├── react-native-fs       # 文件系统
├── react-native-pdf      # PDF生成
└── react-native-share    # 分享功能
```

**项目结构：**
```
lyra-exporter-mobile/
├── ios/                  # iOS原生代码
├── android/              # Android原生代码
├── src/
│   ├── screens/          # 页面组件
│   ├── components/       # 复用Web版组件
│   ├── utils/            # 复用Web版逻辑
│   ├── navigation/       # 导航配置
│   └── App.tsx          # 入口
├── package.json
└── metro.config.js       # Metro bundler配置
```

**复用策略：**
```javascript
// 从Web版复用（需适配）
import { fileParser } from '../web/src/utils/fileParser';
import { exportManager } from '../web/src/utils/exportManager';

// 移动端特定
import { DocumentPicker } from 'react-native-document-picker';
import Share from 'react-native-share';
```

#### Option 2: Flutter ⭐⭐⭐⭐

**优势：**
- ✅ 性能优秀
- ✅ UI一致性好
- ✅ iOS + Android双平台
- ✅ App体积较小

**劣势：**
- ❌ 无法复用现有React代码
- ❌ 需要用Dart重写所有逻辑
- ❌ 开发成本高

**建议：** 如果团队有Flutter经验可考虑，否则选React Native

#### Option 3: PWA增强 (低成本方案) ⭐⭐⭐

**现状：** 你的Web App已经是PWA

**增强方案：**
```javascript
// 添加移动端特定功能
if ('share' in navigator) {
  // 使用Web Share API
  navigator.share({
    title: 'Exported Conversation',
    text: 'Check out this conversation',
    files: [pdfFile]
  });
}

// 添加到主屏幕提示
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallPrompt();
});
```

**优势：**
- ✅ 无需额外开发
- ✅ 自动跨平台
- ✅ 更新即时生效

**劣势：**
- ❌ 功能受限（无法访问某些原生API）
- ❌ 性能不如原生
- ❌ iOS支持较弱

**建议：** 先增强PWA，再考虑原生App

---

### React Native 开发计划 / React Native Development Plan

#### Phase 1: 项目初始化 (1周)

```bash
# 1. 创建项目
npx react-native init LyraExporterMobile --template react-native-template-typescript

# 2. 安装依赖
cd LyraExporterMobile
npm install @react-navigation/native @react-navigation/stack
npm install react-native-document-picker
npm install react-native-fs
npm install react-native-share
npm install @react-native-async-storage/async-storage

# 3. iOS依赖
cd ios && pod install && cd ..

# 4. 运行
npm run ios      # iOS模拟器
npm run android  # Android模拟器
```

#### Phase 2: 核心功能实现 (3-4周)

**Week 1: 文件导入 + 解析**
```typescript
// src/screens/ImportScreen.tsx
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import { parseConversation } from '../utils/parser';

const ImportScreen = () => {
  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.json],
      });

      const fileContent = await RNFS.readFile(result[0].uri, 'utf8');
      const conversation = parseConversation(JSON.parse(fileContent));

      // 存储到AsyncStorage
      await AsyncStorage.setItem(`conversation_${Date.now()}`, JSON.stringify(conversation));

      navigation.navigate('ConversationList');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Import JSON File" onPress={handleFilePick} />
    </View>
  );
};
```

**Week 2: 对话列表 + 详情**
```typescript
// src/screens/ConversationListScreen.tsx
const ConversationListScreen = () => {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    const keys = await AsyncStorage.getAllKeys();
    const conversationKeys = keys.filter(k => k.startsWith('conversation_'));
    const data = await AsyncStorage.multiGet(conversationKeys);
    setConversations(data.map(([key, value]) => JSON.parse(value)));
  };

  return (
    <FlatList
      data={conversations}
      renderItem={({ item }) => (
        <ConversationCard
          conversation={item}
          onPress={() => navigation.navigate('ConversationDetail', { id: item.id })}
        />
      )}
    />
  );
};
```

**Week 3: 导出功能**
```typescript
// src/utils/export.ts
import Share from 'react-native-share';
import RNFS from 'react-native-fs';

export const exportAsMarkdown = async (conversation) => {
  const markdown = generateMarkdown(conversation);
  const path = `${RNFS.DocumentDirectoryPath}/${conversation.title}.md`;

  await RNFS.writeFile(path, markdown, 'utf8');

  await Share.open({
    url: `file://${path}`,
    type: 'text/markdown',
    title: 'Export Conversation',
  });
};

export const exportAsPDF = async (conversation) => {
  // 使用react-native-pdf-lib或类似库
  const pdfPath = await generatePDF(conversation);

  await Share.open({
    url: `file://${pdfPath}`,
    type: 'application/pdf',
  });
};
```

**Week 4: UI优化 + 测试**
- 暗色模式
- 搜索功能
- 标签系统
- 性能优化

#### Phase 3: 发布 (1-2周)

**iOS App Store:**
1. 注册Apple Developer Account ($99/年)
2. 配置Bundle ID和证书
3. 准备素材：
   - 图标（1024x1024）
   - 截图（多种尺寸）
   - 隐私政策
   - App描述
4. TestFlight测试
5. 提交审核（1-7天）

**Android Google Play:**
1. 注册Google Play Developer ($25一次性)
2. 生成签名密钥
3. 准备素材：
   - 图标（512x512）
   - 截图（至少2张）
   - 功能图像（1024x500）
   - App描述
4. 内部测试 → 封闭测试 → 开放测试 → 生产
5. 提交审核（几小时到几天）

---

### 移动端独特功能 / Mobile-Specific Features

**利用移动端优势：**

1. **相机集成** - 扫描QR码导入对话
2. **语音输入** - 语音搜索对话
3. **通知** - 定期提醒备份
4. **小组件** - iOS/Android桌面小组件显示统计
5. **分享扩展** - 从其他App直接分享到Lyra
6. **iCloud/Google Drive同步** - 跨设备同步（可选）

---

## 📊 优先级建议 / Priority Recommendations

### Immediate (1-2 months) / 立即开展

1. **Chrome Extension** ⭐⭐⭐⭐⭐
   - 影响最大（Chrome 65%+ 市场份额）
   - 开发成本低（2-3周）
   - 用户体验显著提升
   - 商店曝光度高

2. **PWA增强** ⭐⭐⭐⭐
   - 成本最低（几天）
   - 立即生效
   - 移动端临时方案

### Short-term (3-4 months) / 短期

3. **Firefox Extension** ⭐⭐⭐⭐
   - 复用Chrome代码（1周）
   - Firefox用户群体技术倾向强
   - 开源社区认可度高

4. **Edge Extension** ⭐⭐⭐
   - 几乎零成本（复用Chrome）
   - Windows用户覆盖

### Mid-term (4-6 months) / 中期

5. **React Native App** ⭐⭐⭐⭐
   - 原生移动体验
   - iOS + Android覆盖
   - 开发成本中等（1-2个月）
   - 需要持续维护

### Long-term (6+ months) / 长期

6. **Safari Extension** ⭐⭐⭐
   - macOS/iOS Safari用户
   - 需要Mac开发环境
   - 审核较严格

---

## 💰 成本估算 / Cost Estimation

### 开发成本（人力）

| 项目 | 开发时间 | 维护成本 |
|------|---------|---------|
| Chrome Extension | 2-3周 | 低（每月几小时） |
| Firefox Extension | 1周 | 低 |
| Edge Extension | 几天 | 低 |
| PWA增强 | 几天 | 极低 |
| React Native App | 1-2个月 | 中（bug修复、OS更新） |
| Safari Extension | 2-3周 | 低 |

### 发布成本（金钱）

| 平台 | 注册费 | 年费 |
|------|-------|------|
| Chrome Web Store | $5 一次性 | - |
| Firefox Add-ons | 免费 | - |
| Edge Add-ons | 免费 | - |
| Apple App Store | $99/年 | $99/年 |
| Google Play | $25 一次性 | - |

**总计：** $129（首年），$99/年（后续）

---

## 🚀 实施路线图 / Implementation Roadmap

### Month 1-2: 浏览器扩展
- ✅ Week 1-3: Chrome Extension开发
- ✅ Week 4: Firefox Extension适配
- ✅ Week 5: 提交审核 + 宣传

### Month 3: PWA增强 + Edge
- ✅ Week 1: PWA移动端优化
- ✅ Week 2: Edge Extension提交
- ✅ Week 3-4: 用户反馈收集 + Bug修复

### Month 4-6: 移动端App
- ✅ Month 4: React Native开发
- ✅ Month 5: 测试 + 优化
- ✅ Month 6: 提交App Store/Google Play

### Month 7+: 持续优化
- Bug修复
- 功能迭代
- 用户反馈响应
- 新平台支持（Safari等）

---

## 📈 预期影响 / Expected Impact

### 浏览器扩展
- **用户增长**: +200-500%（更容易安装）
- **GitHub Stars**: +500-1000（商店曝光）
- **日活用户**: 1000-5000（6个月内）

### 移动端App
- **新用户群**: 移动优先用户
- **使用频率**: +30%（随时随地访问）
- **品牌认知**: 更专业的产品形象

---

## 🆘 需要的帮助 / Help Needed

### 开发资源
- [ ] Chrome Extension开发者（1-2周）
- [ ] React Native开发者（如果做移动端，1-2个月）
- [ ] UI/UX设计师（图标、截图、商店素材）

### 设备资源
- [ ] Mac（用于iOS开发，如果做移动端）
- [ ] 测试设备（Android、iOS）

### 账号费用
- [ ] Chrome Web Store: $5
- [ ] Apple Developer: $99/年（如果做iOS）
- [ ] Google Play: $25（如果做Android）

---

## 🎯 下一步行动 / Next Steps

**立即开始（本周）：**
1. 创建 `browser-extension/` 目录
2. 初始化Chrome Extension项目
3. 编写manifest.json
4. 实现基础content script（ChatGPT数据提取）

**第一个里程碑（2周后）：**
- Chrome Extension MVP完成
- 支持ChatGPT Markdown导出
- 本地测试通过

**第一次发布（3周后）：**
- 提交Chrome Web Store审核
- 准备宣传材料
- 更新README添加扩展链接

---

**准备好开始了吗？我可以帮你：**
1. 生成Chrome Extension的初始代码
2. 编写manifest.json配置
3. 创建popup UI模板
4. 制定详细的开发任务清单

从哪个开始？🚀
