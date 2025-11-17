# Privacy & Security / 隐私与安全

**Zero compromises on privacy.** Your conversations never leave your device.

**隐私零妥协。** 你的对话永远不会离开你的设备。

---

## 🔒 Core Privacy Principles / 核心隐私原则

### 100% Local Processing / 100% 本地处理

**English:**
Everything happens in your browser. No backend servers, no cloud processing, no data uploads.

```
Your data flow:
1. Load conversation file → Your browser
2. Process and analyze → Your browser
3. Export to file → Your device
```

**中文：**
一切都在你的浏览器中进行。无后端服务器，无云处理，无数据上传。

```
你的数据流：
1. 加载对话文件 → 你的浏览器
2. 处理和分析 → 你的浏览器
3. 导出文件 → 你的设备
```

---

## ✅ What We DO / 我们做什么

### Data Storage / 数据存储

**localStorage only:**
- ✅ Tags (completed/important/deleted) - stored with UUID keys
- ✅ Star status - favorite conversations
- ✅ User settings - theme, language, export preferences
- ✅ Copy options - include thinking, artifacts, etc.

**仅 localStorage：**
- ✅ 标签（已完成/重要/删除） - 使用 UUID 键存储
- ✅ 收藏状态 - 收藏的对话
- ✅ 用户设置 - 主题、语言、导出偏好
- ✅ 复制选项 - 包含思考、artifacts等

**localStorage keys format:**
```
lyra_marks_{fileUUID}_{messageUUID}  → Tag data
lyra_stars_{fileUUID}                → Star status
lyra_settings                        → User preferences
lyra_theme                           → Light/dark mode
lyra_language                        → Selected language
export-config                        → Export options
copy_options                         → Copy settings
```

**All data stored locally in your browser, never synced to servers.**

**所有数据本地存储在浏览器，永不同步到服务器。**

### Network Requests / 网络请求

**Only three types of network requests:**

1. **Font loading** (PDF export only)
   ```
   Fetches: public/fonts/ARUDJingxihei-*.ttf
   From: Same domain (GitHub Pages)
   Purpose: Embed fonts in PDF
   Data sent: None
   ```

2. **postMessage** (Tampermonkey script integration)
   ```
   Source: claude.ai, chatgpt.com, gemini.google.com
   Purpose: Receive exported conversation data
   Data sent: None (only receives)
   Validation: ALLOWED_ORIGINS whitelist
   ```

3. **Static assets** (HTML, CSS, JS on first load)
   ```
   From: GitHub Pages CDN
   Purpose: Load app interface
   Data sent: None
   ```

**仅三种网络请求：**

1. **字体加载**（仅 PDF 导出）
   ```
   获取：public/fonts/ARUDJingxihei-*.ttf
   来源：同域（GitHub Pages）
   目的：在 PDF 中嵌入字体
   发送数据：无
   ```

2. **postMessage**（Tampermonkey 脚本集成）
   ```
   来源：claude.ai, chatgpt.com, gemini.google.com
   目的：接收导出的对话数据
   发送数据：无（仅接收）
   验证：ALLOWED_ORIGINS 白名单
   ```

3. **静态资源**（首次加载 HTML, CSS, JS）
   ```
   来源：GitHub Pages CDN
   目的：加载应用界面
   发送数据：无
   ```

**NO requests to third-party analytics, tracking, or data collection services.**

**不向第三方分析、追踪或数据收集服务发送请求。**

---

## ❌ What We DON'T DO / 我们不做什么

### No Backend / 无后端

❌ No server-side processing
❌ No database storage
❌ No cloud backups
❌ No API calls to external services

❌ 无服务器端处理
❌ 无数据库存储
❌ 无云备份
❌ 无外部服务 API 调用

### No Tracking / 无追踪

❌ No Google Analytics
❌ No cookies (except localStorage)
❌ No user identification
❌ No usage statistics collection
❌ No error reporting to external services

❌ 无 Google Analytics
❌ 无 cookies（除 localStorage）
❌ 无用户识别
❌ 无使用统计收集
❌ 无错误报告发送到外部服务

### No Data Sharing / 无数据共享

❌ No data sold to third parties
❌ No data shared with partners
❌ No data used for AI training
❌ No data monetization

❌ 不向第三方出售数据
❌ 不与合作伙伴共享数据
❌ 不用于 AI 训练
❌ 不进行数据变现

---

## 🛡️ Security Measures / 安全措施

### Input Validation / 输入验证

**File uploads:**
```javascript
// 1. File type check
if (!file.name.endsWith('.json')) {
  reject('Only JSON files allowed');
}

// 2. File size limit
if (file.size > 100MB) {
  reject('File too large');
}

// 3. JSON validation
try {
  const data = JSON.parse(content);
} catch {
  reject('Invalid JSON format');
}

// 4. Format detection
const format = detectFileFormat(data);
if (!SUPPORTED_FORMATS.includes(format)) {
  reject('Unsupported format');
}
```

**文件上传：**
```javascript
// 1. 文件类型检查
if (!file.name.endsWith('.json')) {
  reject('仅允许 JSON 文件');
}

// 2. 文件大小限制
if (file.size > 100MB) {
  reject('文件过大');
}

// 3. JSON 验证
try {
  const data = JSON.parse(content);
} catch {
  reject('无效的 JSON 格式');
}

// 4. 格式检测
const format = detectFileFormat(data);
if (!SUPPORTED_FORMATS.includes(format)) {
  reject('不支持的格式');
}
```

### postMessage Validation / postMessage 验证

**Cross-window communication security:**

**跨窗口通信安全：**

```javascript
// ALLOWED_ORIGINS whitelist
const ALLOWED_ORIGINS = [
  'https://claude.ai',
  'https://chatgpt.com',
  'https://gemini.google.com',
  'https://aistudio.google.com',
  'https://notebooklm.google.com'
];

window.addEventListener('message', (event) => {
  // 1. Origin validation
  if (!ALLOWED_ORIGINS.includes(event.origin)) {
    console.warn('Rejected message from:', event.origin);
    return;
  }

  // 2. Data validation
  if (!event.data || !event.data.type) {
    return;
  }

  // 3. Type-specific processing
  handleValidatedMessage(event.data);
});
```

**Only accepts data from whitelisted domains. Rejects all others.**

**仅接受白名单域名的数据。拒绝所有其他来源。**

### XSS Prevention / XSS 防护

**All user content is sanitized:**

**所有用户内容都经过清理：**

```javascript
// react-markdown automatically escapes HTML
<ReactMarkdown>{userContent}</ReactMarkdown>

// Code blocks use syntax highlighter (no execution)
<SyntaxHighlighter language="python">
  {codeContent}
</SyntaxHighlighter>

// No dangerouslySetInnerHTML used
// No eval() or Function() calls
// No inline event handlers
```

### localStorage Isolation / localStorage 隔离

**UUID prefixes prevent collisions:**

**UUID 前缀防止冲突：**

```javascript
// Tags
const key = `lyra_marks_${fileUUID}_${messageUUID}`;
localStorage.setItem(key, JSON.stringify(markData));

// Stars
const key = `lyra_stars_${fileUUID}`;
localStorage.setItem(key, JSON.stringify(starData));

// Settings (global)
localStorage.setItem('lyra_settings', JSON.stringify(settings));
```

**Each conversation file has unique UUID, ensuring no data mixing.**

**每个对话文件都有唯一 UUID，确保数据不混淆。**

---

## 🔍 Data You Can Verify / 你可以验证的数据

### Open Source Audit / 开源审计

**The entire codebase is open source (MIT License):**

**整个代码库开源（MIT 许可）：**

1. **Read the code:** [GitHub Repository](https://github.com/Yalums/lyra-exporter)
2. **Inspect network requests:** Open browser DevTools → Network tab
3. **Check localStorage:** DevTools → Application → Local Storage
4. **Build from source:** Clone and run `npm install && npm start`

```bash
# Audit yourself
git clone https://github.com/Yalums/lyra-exporter.git
cd lyra-exporter
grep -r "fetch\|axios\|XMLHttpRequest" src/  # Check network calls
grep -r "analytics\|tracking" src/            # Check for tracking
```

### Browser DevTools Verification / 浏览器开发工具验证

**You can verify zero data transmission:**

**你可以验证零数据传输：**

1. Open Lyra Exporter
2. Open DevTools (F12)
3. Go to **Network** tab
4. Clear all network requests
5. Load a conversation file
6. Process and export

**You'll see:**
- ✅ Zero XHR/fetch requests (except font loading for PDF)
- ✅ No POST requests
- ✅ No cookies set
- ✅ No external domains contacted

**你会看到：**
- ✅ 零 XHR/fetch 请求（除了 PDF 的字体加载）
- ✅ 无 POST 请求
- ✅ 无 cookies 设置
- ✅ 无外部域名联系

---

## 🌐 Deployment Security / 部署安全

### GitHub Pages Hosting / GitHub Pages 托管

**Advantages:**
- ✅ Static hosting (no server-side code execution)
- ✅ HTTPS enforced
- ✅ No database (can't be hacked)
- ✅ Content Delivery Network (CDN)
- ✅ DDoS protection by GitHub

**优势：**
- ✅ 静态托管（无服务器端代码执行）
- ✅ 强制 HTTPS
- ✅ 无数据库（无法被攻击）
- ✅ 内容分发网络（CDN）
- ✅ GitHub 提供 DDoS 防护

### Optional: Run Locally / 可选：本地运行

**For maximum privacy, run on localhost:**

**为了最大隐私，在 localhost 运行：**

```bash
git clone https://github.com/Yalums/lyra-exporter.git
cd lyra-exporter
npm install
npm start
```

**Now accessible at:** `http://localhost:3789`

**Zero internet dependency** (except initial npm install)

**零网络依赖**（除了初始 npm install）

### Optional: Tauri Desktop App / 可选：Tauri 桌面应用

**Even more isolated:**

**更加隔离：**

```bash
npm run tauri:build
```

Creates a native desktop app with:
- ✅ No browser required
- ✅ System-level file access
- ✅ Completely offline operation
- ✅ No network permissions needed

创建原生桌面应用，具有：
- ✅ 无需浏览器
- ✅ 系统级文件访问
- ✅ 完全离线操作
- ✅ 无需网络权限

---

## 🔐 Companion Script Security / 配套脚本安全

### Tampermonkey Script / Tampermonkey 脚本

**Lyra Exporter Fetch script is also open source:**

**Lyra Exporter Fetch 脚本也是开源的：**

- **Source:** [Greasy Fork](https://greasyfork.org/en/scripts/539579-lyra-s-exporter-fetch)
- **Permissions:** Only runs on whitelisted AI platforms
- **Function:** Extracts conversation data from DOM, sends via postMessage
- **No data storage:** Doesn't store or upload data

**Can be audited:** Read the script code before installing

**可审计：** 安装前阅读脚本代码

---

## 🆚 Privacy Comparison / 隐私对比

| Aspect | Lyra Exporter | Cloud Tools | Browser Extensions |
|--------|---------------|-------------|--------------------|
| **Data processing** | ✅ Local only | ❌ Server-side | ⚠️ Mixed |
| **Data storage** | ✅ localStorage | ❌ Cloud DB | ⚠️ Varies |
| **Network uploads** | ✅ Zero | ❌ All data | ⚠️ Some data |
| **Tracking** | ✅ None | ⚠️ Often yes | ⚠️ Often yes |
| **Open source** | ✅ Fully | ❌ Closed | ⚠️ Some |
| **Auditable** | ✅ Yes | ❌ No | ⚠️ Partial |
| **Backend required** | ✅ No | ❌ Yes | ⚠️ Sometimes |

---

## ⚠️ User Responsibilities / 用户责任

### You Are in Control / 你负责控制

**We provide the tools, you manage the data:**

**我们提供工具，你管理数据：**

1. **Secure your device** - Use password/encryption
2. **Clear localStorage** - If using shared computer
3. **Handle exports carefully** - Exported files are not encrypted
4. **Audit the code** - Trust but verify
5. **Report issues** - Help us stay secure

1. **保护你的设备** - 使用密码/加密
2. **清除 localStorage** - 如果使用共享计算机
3. **谨慎处理导出文件** - 导出文件未加密
4. **审计代码** - 信任但验证
5. **报告问题** - 帮助我们保持安全

### Clearing Your Data / 清除你的数据

**To remove all Lyra Exporter data:**

**删除所有 Lyra Exporter 数据：**

```javascript
// Open browser console and run:
Object.keys(localStorage)
  .filter(key => key.startsWith('lyra_') || key === 'export-config' || key === 'copy_options')
  .forEach(key => localStorage.removeItem(key));
```

Or use browser settings:
- Chrome: Settings → Privacy → Clear browsing data → Cookies and site data
- Firefox: Settings → Privacy → Clear Data → Cookies and Site Data

或使用浏览器设置：
- Chrome：设置 → 隐私 → 清除浏览数据 → Cookie 和网站数据
- Firefox：设置 → 隐私 → 清除数据 → Cookie 和网站数据

---

## 📜 Privacy Policy Summary / 隐私政策摘要

**We collect:** Nothing
**我们收集：** 无

**We store:** Only what you explicitly save (tags, stars, settings) in your browser
**我们存储：** 仅你明确保存的内容（标签、收藏、设置）在你的浏览器

**We share:** Nothing
**我们共享：** 无

**We sell:** Nothing
**我们出售：** 无

**You own:** Everything (MIT License)
**你拥有：** 一切（MIT 许可）

---

## 🆘 Security Questions? / 安全问题？

**Found a security issue?**
- Report privately via [GitHub Security Advisory](https://github.com/Yalums/lyra-exporter/security/advisories/new)
- Or email (check repository for contact)

**发现安全问题？**
- 通过 [GitHub Security Advisory](https://github.com/Yalums/lyra-exporter/security/advisories/new) 私下报告
- 或发送邮件（查看仓库获取联系方式）

**General questions:**
- Ask in [Discussions](https://github.com/Yalums/lyra-exporter/discussions)
- Read [FAQ](FAQ)

**一般问题：**
- 在 [Discussions](https://github.com/Yalums/lyra-exporter/discussions) 提问
- 阅读 [FAQ](FAQ)

---

<div align="center">

**Privacy is a feature, not an afterthought.**

**隐私是一个功能，而不是事后想法。**

*Your data. Your device. Your choice.*

*你的数据。你的设备。你的选择。*

</div>
