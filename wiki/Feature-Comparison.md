# Feature Comparison / 功能对比

**English:** This page compares Lyra Exporter with other AI chat export tools.

**中文：** 本页面对比 Lyra Exporter 与其他AI对话导出工具的功能差异。

---

## 🏆 Lyra Exporter vs. Competitors

### Full Comparison Table / 完整对比表

| Feature | Lyra Exporter | ChatGPT Exporter | Browser Extensions | Manual Copy-Paste |
|---------|---------------|------------------|-------------------|-------------------|
| **Multi-platform Support** | ✅ 6+ platforms | ❌ ChatGPT only | ⚠️ 1-2 platforms | ✅ All (manual) |
| **Branch Export** | ✅ Full tree | ❌ Active path only | ❌ No branches | ❌ Manual only |
| **Artifacts Preservation** | ✅ Complete | ⚠️ Text only | ❌ Stripped | ⚠️ Manual |
| **Canvas Preservation** | ✅ Complete | ⚠️ Text only | ❌ Stripped | ⚠️ Manual |
| **Thinking Process** | ✅ Full (Claude + o1) | ⚠️ Partial | ❌ Not supported | ⚠️ Manual |
| **Image Preservation** | ✅ References kept | ⚠️ Lost | ⚠️ Depends | ❌ Lost |
| **LaTeX Rendering** | ✅ KaTeX in UI + PDF | ❌ No | ❌ No | ❌ No |
| **PDF Export** | ✅ With embedded fonts | ❌ No PDF | ⚠️ Basic PDF | ❌ No |
| **Screenshot Export** | ✅ Auto-split images | ❌ No | ❌ No | ⚠️ Manual |
| **Batch Export** | ✅ ZIP packaging | ⚠️ Manual loop | ❌ One by one | ❌ Manual |
| **Tagging System** | ✅ 3 tag types | ❌ No | ❌ No | ❌ No |
| **Global Search** | ✅ Cross-conversation | ❌ No | ❌ No | ❌ No |
| **Privacy** | ✅ 100% local | ⚠️ Varies | ⚠️ Upload risk | ✅ Local |
| **Open Source** | ✅ MIT License | ⚠️ Some closed | ❌ Mostly closed | N/A |
| **Free** | ✅ Completely free | ✅ Free | ⚠️ Freemium | ✅ Free |
| **Setup Difficulty** | ⭐⭐ Easy | ⭐⭐ Easy | ⭐ Very easy | ⭐⭐⭐ Hard |

---

## 🌟 Unique Features / 独占功能

### 1. Complete Branch Export / 完整分支导出

**English:**
When you edit a previous message in ChatGPT or Claude and regenerate, you create a **branch**. Most tools only save the active path and lose all other branches forever.

**Lyra Exporter is the ONLY tool that:**
- ✅ Detects all branch points automatically
- ✅ Exports the complete conversation tree
- ✅ Visualizes branches in the UI
- ✅ Lets you navigate between branches

**中文：**
当你在 ChatGPT 或 Claude 中编辑之前的消息并重新生成时，会创建一个**分支**。大多数工具只保存当前活跃路径，其他分支永久丢失。

**Lyra Exporter 是唯一能够：**
- ✅ 自动检测所有分支点
- ✅ 导出完整对话树
- ✅ 在UI中可视化分支
- ✅ 在分支间自由导航

**Learn more:** [Branch Export Guide](Branch-Export-Guide)

---

### 2. PDF Export with Chinese Font Support / 中文字体PDF导出

**English:**
Most PDF exporters show `� � �` (garbled text) for Chinese characters. This is because they don't embed proper fonts.

**Lyra Exporter:**
- ✅ Embeds ARUDJingxihei open-source fonts (~9MB each)
- ✅ Supports bold, italic, and regular weights
- ✅ Renders LaTeX formulas correctly
- ✅ Validates fonts before embedding
- ✅ Graceful fallback to system fonts

**中文：**
大多数PDF导出工具在处理中文时会显示 `� � �`（乱码）。这是因为它们没有内嵌合适的字体。

**Lyra Exporter：**
- ✅ 内嵌 ARUDJingxihei 开源字体（每个约9MB）
- ✅ 支持粗体、斜体和常规字重
- ✅ 正确渲染 LaTeX 公式
- ✅ 字体嵌入前验证
- ✅ 优雅降级到系统字体

**Learn more:** [PDF Export Guide](PDF-Export-Guide)

---

### 3. Screenshot Export with Auto-Splitting / 自动分段长图导出

**English:**
Sometimes you want to share conversations visually. Lyra Exporter can:
- ✅ Capture pixel-perfect UI with colors and avatars
- ✅ Automatically split long conversations into multiple images
- ✅ Preserve platform-specific styling
- ✅ Export in PNG or JPG format
- ✅ Package multiple images in ZIP

**中文：**
有时你想可视化分享对话。Lyra Exporter 可以：
- ✅ 像素级完美捕获UI，保留颜色和头像
- ✅ 自动将长对话分割成多张图片
- ✅ 保留平台特定样式
- ✅ 导出为PNG或JPG格式
- ✅ 将多张图片打包成ZIP

**Learn more:** [Screenshot Export Guide](Screenshot-Export-Guide)

---

### 4. Full Content Preservation / 全内容保留

**What we preserve that others don't:**

| Content Type | Lyra Exporter | Others |
|--------------|---------------|--------|
| **Claude Artifacts** | ✅ Full content + metadata | ❌ Stripped or text-only |
| **ChatGPT Canvas** | ✅ All versions preserved | ❌ Lost or partial |
| **Thinking Process** | ✅ Claude thoughts + o1 reasoning | ⚠️ Partial or none |
| **Tool Calls** | ✅ Web search, code execution, file reads | ❌ Not preserved |
| **User Images** | ✅ File info + references | ⚠️ Often lost |
| **AI Images** | ✅ Full image data | ⚠️ Often lost |
| **LaTeX Formulas** | ✅ Rendered in UI and PDF | ❌ Not supported |
| **Code Blocks** | ✅ Syntax highlighting | ⚠️ Plain text |
| **Citations** | ✅ Full source references | ⚠️ Partial |

---

### 5. Privacy-First Design / 隐私优先设计

**English:**

| Aspect | Lyra Exporter | Cloud-Based Tools |
|--------|---------------|-------------------|
| Data Storage | ✅ 100% local (localStorage) | ❌ Cloud servers |
| Processing | ✅ In-browser only | ❌ Server-side |
| Network Requests | ✅ None (except font loading) | ❌ Constant uploads |
| Tracking | ✅ Zero analytics | ⚠️ Often tracked |
| Source Code | ✅ Fully open (MIT) | ⚠️ Closed source |
| Auditability | ✅ Can audit yourself | ❌ Black box |

**中文：**

| 方面 | Lyra Exporter | 云端工具 |
|------|---------------|----------|
| 数据存储 | ✅ 100%本地（localStorage） | ❌ 云端服务器 |
| 数据处理 | ✅ 仅在浏览器 | ❌ 服务器端 |
| 网络请求 | ✅ 无（除字体加载） | ❌ 持续上传 |
| 追踪 | ✅ 零分析追踪 | ⚠️ 经常被追踪 |
| 源代码 | ✅ 完全开源（MIT） | ⚠️ 闭源 |
| 可审计性 | ✅ 可自行审计 | ❌ 黑盒 |

---

## 📊 Performance Comparison / 性能对比

### Export Speed / 导出速度

**Single Conversation (100 messages):**
- Lyra Exporter: ~2-3 seconds (Markdown), ~5-8 seconds (PDF), ~10-15 seconds (Screenshot)
- Manual copy-paste: ~5-10 minutes
- Other tools: ~3-5 seconds (Markdown only)

**Full Account Export (500 conversations):**
- Lyra Exporter: ~30-60 seconds (batch ZIP)
- Manual: Several hours
- Other tools: Manual loop required

---

## 🎯 Use Case Recommendations / 使用场景推荐

### Choose Lyra Exporter if you need: / 选择 Lyra Exporter 如果你需要：

✅ **Branch preservation** - You use ChatGPT/Claude and edit messages frequently
✅ **Chinese PDF export** - You have Chinese conversations and need printable PDFs
✅ **Complete privacy** - You don't want any data leaving your device
✅ **Full content** - You use Artifacts, Canvas, or o1 thinking
✅ **Batch export** - You want to export hundreds of conversations at once
✅ **Visual exports** - You need screenshots for sharing or presentations

### Choose Others if: / 选择其他工具如果：

⚠️ You only use one platform and never create branches
⚠️ You're okay with losing Artifacts/Canvas
⚠️ You don't care about privacy
⚠️ You only need simple Markdown exports

---

## 🔄 Migration Guide / 迁移指南

**Switching from other tools?** / **从其他工具迁移？**

1. Export your data with the old tool (if possible)
2. Use Lyra Exporter's companion script to re-fetch from platforms
3. Enjoy complete exports with branches and full content!

---

## 📚 Learn More / 了解更多

- [Installation Guide](Installation-Guide) - Get started with Lyra Exporter
- [Branch Export Guide](Branch-Export-Guide) - Deep dive into branch preservation
- [Privacy & Security](Privacy-and-Security) - How we protect your data

---

**Questions? / 有问题？**
- Check the [FAQ](FAQ)
- Ask in [Discussions](https://github.com/Yalums/lyra-exporter/discussions)
