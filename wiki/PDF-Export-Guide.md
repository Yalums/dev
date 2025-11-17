# PDF Export Guide / PDF导出指南

**Lyra Exporter's PDF export is unique** - we embed Chinese fonts so your PDFs never show `� � �`.

**Lyra Exporter 的 PDF 导出很独特** - 我们内嵌中文字体，PDF永远不会显示 `� � �`。

---

## 🎯 Why PDF Export? / 为什么需要PDF导出？

### English

**PDFs are perfect for:**
- ✅ **Sharing** - Universal format, readable everywhere
- ✅ **Printing** - Physical archiving or documentation
- ✅ **Archiving** - Preserves formatting forever
- ✅ **Professional use** - Client reports, research papers
- ✅ **Offline reading** - No need for internet

### 中文

**PDF非常适合：**
- ✅ **分享** - 通用格式，随处可读
- ✅ **打印** - 物理存档或文档
- ✅ **归档** - 永久保存格式
- ✅ **专业用途** - 客户报告、研究论文
- ✅ **离线阅读** - 无需网络

---

## ❌ The Chinese Font Problem / 中文字体问题

### What Other Tools Do / 其他工具的问题

Most PDF exporters **don't embed fonts**. Result:

大多数PDF导出工具**不嵌入字体**。结果：

```
Expected / 期望:
你好世界！Hello World!

What you get / 实际得到:
� � �  ！Hello World!
```

**Why this happens:**
- PDF readers use system fonts
- System fonts don't have all Chinese characters
- Characters not found → � � � (replacement character)

**为什么会这样：**
- PDF阅读器使用系统字体
- 系统字体没有所有中文字符
- 找不到字符 → � � �（替换字符）

---

## ✅ How Lyra Exporter Solves This / Lyra Exporter 如何解决

### Embedded Font System / 内嵌字体系统

**We embed ARUDJingxihei fonts** - open-source, high-quality Chinese fonts

**我们内嵌 ARUDJingxihei 字体** - 开源、高质量中文字体

**Three font weights:**
- **Regular** - Normal text (~9.8 MB)
- **Bold** - Headings, emphasis (~9.9 MB)
- **Light** - Italic fallback (~9.6 MB)

**三种字重：**
- **Regular（常规）** - 正文（约9.8 MB）
- **Bold（粗体）** - 标题、强调（约9.9 MB）
- **Light（细体）** - 斜体备用（约9.6 MB）

**Character coverage:**
- ✅ Simplified Chinese (简体中文)
- ✅ Traditional Chinese (繁体中文)
- ✅ Japanese Kanji (日本汉字)
- ✅ Korean Hanja (韩文汉字)
- ✅ Latin alphabet (拉丁字母)

---

## 🚀 How to Export to PDF / 如何导出为PDF

### Step 1: Load Conversation / 加载对话

1. Import conversation (via Tampermonkey script or JSON file)
2. Open the conversation in timeline view

1. 导入对话（通过 Tampermonkey 脚本或 JSON 文件）
2. 在时间线视图中打开对话

### Step 2: Configure Export Options / 配置导出选项

Click "Export" button and select **PDF format**:

点击"导出"按钮并选择 **PDF 格式**：

#### Format Options / 格式选项

- [x] **Include timestamps** - Message send times / 包含时间戳
- [x] **Include thinking** - Claude's internal thoughts / 包含思考过程
- [ ] **Include Artifacts** - Code/documents created / 包含 Artifacts
- [ ] **Include tool calls** - Web search, code execution / 包含工具调用
- [ ] **Include citations** - Reference sources / 包含引用

#### Scope / 范围

- ( ) Current conversation only / 仅当前对话
- ( ) Tagged conversations / 已标记对话
- ( ) All conversations / 所有对话

### Step 3: Download / 下载

Click "Export" and wait:
- Fonts are loaded from `/public/fonts/` (~30MB total)
- Content is formatted with Markdown rendering
- LaTeX formulas are converted to readable text
- PDF is generated and downloaded

点击"导出"并等待：
- 从 `/public/fonts/` 加载字体（总计约30MB）
- 内容使用 Markdown 渲染格式化
- LaTeX 公式转换为可读文本
- 生成并下载 PDF

**Export time:**
- Small conversation (50 messages): ~5-8 seconds
- Medium (200 messages): ~15-20 seconds
- Large (500+ messages): ~30-60 seconds

**导出时间：**
- 小型对话（50条消息）：约5-8秒
- 中型（200条消息）：约15-20秒
- 大型（500+条消息）：约30-60秒

---

## 📄 PDF Features / PDF功能特性

### Markdown Rendering / Markdown渲染

**Supported formatting:**

```markdown
# Heading 1           → 大标题
## Heading 2          → 中标题
### Heading 3         → 小标题

**bold text**         → 粗体文本
*italic text*         → 斜体文本（使用Light字重）

- Bullet point        → 项目符号
1. Numbered list      → 编号列表

> Blockquote          → 引用块

`inline code`         → 行内代码
```

### Code Block Syntax Highlighting / 代码块语法高亮

**Supported languages:**
- Python, JavaScript, TypeScript
- Java, C, C++, C#
- Go, Rust, Ruby, PHP
- HTML, CSS, SQL
- Bash, Shell scripts
- And more...

**支持的语言：**
- Python、JavaScript、TypeScript
- Java、C、C++、C#
- Go、Rust、Ruby、PHP
- HTML、CSS、SQL
- Bash、Shell 脚本
- 等等...

**Example:**
```python
def hello_world():
    print("Hello, World!")  # 你好，世界！
```

Code blocks are rendered with:
- Monospace font
- Gray background
- Preserved indentation
- Syntax markers (language name)

代码块渲染包含：
- 等宽字体
- 灰色背景
- 保留缩进
- 语法标记（语言名称）

### LaTeX Formula Support / LaTeX公式支持

**Inline formulas:**
```
Einstein's equation: $E = mc^2$
```

**Block formulas:**
```
$$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$$
```

Formulas are **parsed by KaTeX** and rendered as formatted text with proper mathematical symbols.

公式通过 **KaTeX 解析**，渲染为带有正确数学符号的格式化文本。

**Example output:**
```
E = mc²

x = (-b ± √(b²-4ac)) / 2a
```

### Page Layout / 页面布局

**A4 size (210mm × 297mm)**
- Top margin: 15mm
- Bottom margin: 25mm (for footer)
- Left/right margins: 15mm

**A4 尺寸 (210mm × 297mm)**
- 顶部边距：15mm
- 底部边距：25mm（留给页脚）
- 左右边距：15mm

**Page numbers** are added to footer:
```
Page 1 of 12 | Conversation Title | 2025-01-15
```

**页码**添加到页脚：
```
第 1 页 / 共 12 页 | 对话标题 | 2025-01-15
```

### Message Formatting / 消息格式

Each message includes:
- **Sender name** (User / Assistant) in color
- **Timestamp** (optional)
- **Message content** with Markdown formatting
- **Thinking process** (collapsible, if included)
- **Artifacts** (code blocks, if included)
- **Tool calls** (web search results, if included)

每条消息包含：
- **发送者名称**（用户/助手）带颜色
- **时间戳**（可选）
- **消息内容**带 Markdown 格式
- **思考过程**（可折叠，如果包含）
- **Artifacts**（代码块，如果包含）
- **工具调用**（网络搜索结果，如果包含）

---

## 🔧 Advanced Configuration / 高级配置

### Font Validation / 字体验证

Fonts are validated before embedding:

1. **TTF magic number check** - Verify file format
   ```
   First 4 bytes should be: 0x00010000
   ```

2. **File size check** - Ensure complete font
   ```
   Must be > 500 KB (normal CJK fonts are 3-10 MB)
   ```

3. **Unicode cmap table** - Verify character mapping exists

4. **Content-Type check** - Should be `font/ttf` or `application/octet-stream`

字体嵌入前会验证：

1. **TTF 魔数检查** - 验证文件格式
   ```
   前4字节应为：0x00010000
   ```

2. **文件大小检查** - 确保字体完整
   ```
   必须 > 500 KB（正常 CJK 字体为 3-10 MB）
   ```

3. **Unicode cmap 表** - 验证字符映射表存在

4. **Content-Type 检查** - 应为 `font/ttf` 或 `application/octet-stream`

**If validation fails:**
- System falls back to `helvetica` font
- Warning shown to user
- Chinese characters may display as boxes ☐

**如果验证失败：**
- 系统降级到 `helvetica` 字体
- 向用户显示警告
- 中文字符可能显示为方块 ☐

### Custom Font Installation / 自定义字体安装

Want to use different fonts? / 想使用不同字体？

**Steps:**
1. Place TTF fonts in `public/fonts/` directory
2. Update `pdfFontHelper.js`:
   ```javascript
   doc.addFileToVFS('yourfont.ttf', fontDataBase64);
   doc.addFont('yourfont.ttf', 'YourFontFamily', 'normal');
   ```
3. Update `pdfExportManager.js` to use new font family
4. Test with Chinese/Japanese/Korean text

**步骤：**
1. 将 TTF 字体放在 `public/fonts/` 目录
2. 更新 `pdfFontHelper.js`：
   ```javascript
   doc.addFileToVFS('yourfont.ttf', fontDataBase64);
   doc.addFont('yourfont.ttf', 'YourFontFamily', 'normal');
   ```
3. 更新 `pdfExportManager.js` 使用新字体
4. 用中文/日文/韩文测试

---

## 🎨 Styling / 样式

### Colors / 颜色

**Message senders:**
- User messages: Blue (#0066CC)
- Assistant messages: Gray (#666666)

**Timestamps:** Light gray (#969696)
**Code blocks:** Light gray background (#F5F5F5)

**消息发送者：**
- 用户消息：蓝色 (#0066CC)
- 助手消息：灰色 (#666666)

**时间戳：** 浅灰色 (#969696)
**代码块：** 浅灰色背景 (#F5F5F5)

### Font Sizes / 字体大小

- Title: 20pt
- H1: 16pt
- H2: 14pt
- Sender name: 12pt
- Body text: 10pt
- Code: 9pt
- Timestamps/footer: 8pt

---

## ⚠️ Limitations / 限制

### Current Limitations / 当前限制

❌ **Images not embedded** - Only text references preserved
❌ **Table of contents** - Not yet implemented (coming soon)
❌ **Hyperlinks** - Not clickable in PDF (displayed as text)
❌ **Very long conversations** - May take time to generate (>1000 messages)

❌ **图片未嵌入** - 仅保留文本引用
❌ **目录** - 尚未实现（即将推出）
❌ **超链接** - PDF 中不可点击（显示为文本）
❌ **超长对话** - 可能需要较长时间生成（>1000条消息）

### Workarounds / 解决方法

**For images:**
- Use Screenshot export to preserve visual content
- Or export Markdown and view in Markdown reader

**For hyperlinks:**
- URLs are displayed in full, can be copy-pasted

**对于图片：**
- 使用截图导出以保留视觉内容
- 或导出 Markdown 并在 Markdown 阅读器中查看

**对于超链接：**
- URL 完整显示，可复制粘贴

---

## 🆚 PDF vs. Other Formats / PDF 与其他格式对比

| Feature | PDF | Markdown | Screenshot |
|---------|-----|----------|------------|
| **Formatting preserved** | ✅ Yes | ⚠️ Partial | ✅ Perfect |
| **Searchable text** | ✅ Yes | ✅ Yes | ❌ No |
| **Editable** | ❌ No | ✅ Yes | ❌ No |
| **File size** | ⚠️ Large (fonts) | ✅ Small | ⚠️ Very large |
| **Print-ready** | ✅ Yes | ❌ No | ✅ Yes |
| **Universal** | ✅ Yes | ⚠️ Needs reader | ✅ Yes |
| **Chinese support** | ✅ Embedded | ✅ Yes | ✅ Yes |

---

## 📚 Learn More / 了解更多

- [Feature Comparison](Feature-Comparison) - Compare with other tools
- [Screenshot Export Guide](Screenshot-Export-Guide) - Visual export alternative
- [Troubleshooting](Troubleshooting) - Common PDF export issues

---

**Questions? / 有问题？**
- Check [FAQ](FAQ) for common questions
- Ask in [Discussions](https://github.com/Yalums/lyra-exporter/discussions)
