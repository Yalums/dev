# Lyra Exporter

<div align="center">

**The Only AI Chat Exporter That Keeps Everything**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-yalums.github.io-blue?style=for-the-badge)](https://yalums.github.io/lyra-exporter/)
[![Tampermonkey Script](https://img.shields.io/badge/🔌_Tampermonkey-Greasy_Fork-orange?style=for-the-badge)](https://greasyfork.org/en/scripts/539579-lyra-s-exporter-fetch)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[English](#) | [简体中文](README_zh.md)

**100% Open Source • Zero Privacy Concerns • Complete Branch Export**

</div>

---

## 🎯 Why Lyra Exporter?

Other exporters **lose your conversation branches** and **strip out important content**. Not this one.

| Feature | Lyra Exporter | Others |
|---------|---------------|--------|
| **Branch Export** | ✅ Complete tree structure | ❌ Lost forever |
| **Canvas/Artifacts** | ✅ Fully preserved | ❌ Stripped out |
| **Chinese PDF** | ✅ Embedded fonts, no � | ❌ Garbled text |
| **Thinking Process** | ✅ Claude/ChatGPT o1 thinking | ❌ Not supported |
| **Privacy** | ✅ 100% local processing | ⚠️ Upload to servers |
| **Batch Export** | ✅ Entire account → ZIP | ⚠️ One by one |
| **Export Formats** | ✅ Markdown + PDF + Images | ⚠️ Markdown only |

---

## ✨ What Makes It Special

### 🌲 Complete Branch Preservation
The **only tool** that exports ChatGPT, Claude, and Gemini conversation branches intact. When you edit a message and create a new path, we save **all versions**.

### 🔒 Zero Privacy Leaks
- **No backend** - all processing happens in your browser
- **No analytics** - we don't track you
- **No network requests** - your data never leaves your device
- **Open source** - audit the code yourself

### 📦 Everything Included
We preserve what others delete:
- ✅ **Claude Artifacts** - code, documents, charts
- ✅ **ChatGPT Canvas** - all canvases and iterations
- ✅ **Thinking processes** - Claude's internal thoughts, o1's reasoning
- ✅ **Tool calls** - web searches, code execution, file reads
- ✅ **Images** - user uploads and AI-generated images
- ✅ **LaTeX formulas** - rendered in UI and PDF exports

### 🎨 Three Export Formats

#### 1️⃣ Markdown Export
- GitHub-flavored with syntax highlighting
- Branch info embedded as comments
- Tag markers: `[✅ COMPLETED]` `[⭐ IMPORTANT]`
- Perfect for version control

#### 2️⃣ PDF Export *(Unique Feature)*
- **Embedded Chinese fonts** (ARUDJingxihei) - no more � � �
- **LaTeX rendering** - math formulas displayed correctly
- **Bold/italic support** - proper Markdown formatting
- **Code syntax highlighting** - readable code blocks
- **A4 page layout** - ready to print

#### 3️⃣ Screenshot Export *(Unique Feature)*
- **Pixel-perfect** - captures exact UI appearance
- **Auto-splitting** - long chats → multiple images
- **Platform styling** - keeps colors, avatars, icons
- **Light/dark themes** - choose your export theme

### 🏷️ Smart Tagging System
- Mark messages: ✅ Completed | ⭐ Important | 🗑️ Delete
- Export **only what you need** - filter by tags
- Cross-file statistics - see all tagged messages
- Tags preserved in exports

### 🌍 Multi-Platform Support

**Supports 6+ AI platforms:**
- 🤖 **Claude** - single chat + full account export (projects, Artifacts, thinking)
- 💬 **ChatGPT** - single chat + full account export (Canvas, o1 thinking, workspaces)
- 🔷 **Gemini** - conversations with branches
- 📚 **NotebookLM** - notebook exports
- 🎓 **Google AI Studio** - AI Studio chats
- 🎭 **SillyTavern** - JSONL with branches

**Full account export** for ChatGPT and Claude - grab your entire conversation history with one click, including:
- All conversations across workspaces/projects
- Attachments, Artifacts, Canvas items
- Thinking processes and tool calls
- One-click batch convert to Markdown/PDF/Images

---

## 🚀 Quick Start

### Option 1: Use Online (Recommended)

**Just visit:** [https://yalums.github.io/lyra-exporter/](https://yalums.github.io/lyra-exporter/)

### Option 2: Install Companion Script

Get conversations with **one click** using our Tampermonkey script:

1. Install [Tampermonkey](https://www.tampermonkey.net/)
2. Install [Lyra Exporter Fetch](https://greasyfork.org/en/scripts/539579-lyra-s-exporter-fetch)
3. Visit ChatGPT/Claude/Gemini and click the export button
4. Data auto-loads into Lyra Exporter ✨

### Option 3: Run Locally

```bash
git clone https://github.com/Yalums/lyra-exporter.git
cd lyra-exporter
npm install
npm start
```

---

## 📸 Screenshots

<details>
<summary>Click to expand</summary>

### Welcome Page
![Welcome](https://i.postimg.cc/T3cSmKBK/Pix-Pin-2025-10-15-08-32-35.png)

### Global Search
![Search](https://i.postimg.cc/C1xSd5Hp/Pix-Pin-2025-10-16-16-33-44.png)

### Card View
![Cards](https://i.postimg.cc/05Fq2JqY/Pix-Pin-2025-10-15-08-46-09.png)

### Timeline with Branches
![Timeline](https://i.postimg.cc/hG1SX40R/Pix-Pin-2025-10-15-08-44-10.png)

</details>

---

## 🎯 Use Cases

### For Developers
- Export code snippets with syntax highlighting
- Preserve all Artifacts and tool calls
- Version control your AI conversations
- Share conversations with proper formatting

### For Researchers
- Export entire research conversations
- LaTeX formulas rendered correctly in PDFs
- Tag important insights for later review
- Cross-conversation search

### For Privacy-Conscious Users
- 100% local processing - no data uploads
- Audit the open-source code
- Keep full control of your AI conversations
- No tracking or analytics

### For Power Users
- Batch export hundreds of conversations
- Organize with tags and stars
- Multiple export formats for different needs
- Full account history backup

---

## 🛠️ Tech Stack

- **React 19.1** - Modern UI framework
- **TailwindCSS 3.4** - Utility-first styling
- **jsPDF** - PDF generation with custom fonts
- **html2canvas** - Screenshot rendering
- **KaTeX** - LaTeX math rendering
- **react-markdown** - Markdown display

**No backend. No database. Just pure client-side magic.** ✨

---

## 🌟 Unique Features Deep Dive

### Branch Visualization
Conversations aren't linear. When you edit a message and regenerate, you create a **branch**. We're the only tool that:
- Detects all branch points automatically
- Visualizes the conversation tree
- Exports all branches (not just the active path)
- Lets you navigate between branches visually

### PDF Export with Chinese Support
Most PDF exporters show `� � �` for Chinese text. Not us.
- **Embedded ARUDJingxihei fonts** (open-source, ~9MB each)
- **Three font weights**: Regular, Bold, Light
- **Font validation**: TTF magic number, file size, Unicode cmap checks
- **Graceful fallback**: Falls back to Helvetica if fonts fail
- **CJK coverage**: Simplified/Traditional Chinese, Japanese Kanji, Korean Hanja

### Screenshot Export
Why screenshots? Because sometimes formatting matters.
- **Platform-specific styling** - keeps ChatGPT green, Claude purple
- **Auto-splitting** - conversations longer than X pixels → multiple images
- **Configurable** - width, height limit, scale, format (PNG/JPG), theme
- **Batch export** - multiple images packaged in ZIP

---

## 📊 Feature Comparison

| Feature | Lyra Exporter | ChatGPT Exporter | Browser Plugins |
|---------|---------------|------------------|-----------------|
| Multi-platform | 6+ platforms | ChatGPT only | 1-2 platforms |
| Branch export | ✅ Full tree | ❌ Active path only | ❌ No branches |
| Artifacts/Canvas | ✅ Preserved | ⚠️ Text only | ❌ Stripped |
| PDF export | ✅ With fonts | ❌ No PDF | ⚠️ Plain PDF |
| Screenshot export | ✅ Auto-split | ❌ Manual | ❌ No |
| Thinking process | ✅ Full | ⚠️ Partial | ❌ No |
| Batch export | ✅ ZIP packing | ⚠️ Manual | ❌ One by one |
| Privacy | ✅ 100% local | ⚠️ Depends | ⚠️ Upload risk |
| Open source | ✅ MIT | ⚠️ Some | ❌ Closed |
| LaTeX rendering | ✅ KaTeX | ❌ No | ❌ No |
| Tagging system | ✅ 3 types | ❌ No | ❌ No |

---

## 🤝 Contributing

We're open to contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Areas we need help:**
- [ ] Automated tests
- [ ] More export formats (Word, HTML)
- [ ] Mobile app version
- [ ] More platform support
- [ ] Documentation translations

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details

**Co-created with Claude** - this entire project was built through conversations with AI. Meta, right?

---

## ⭐ Support This Project

If Lyra Exporter saved your conversations, give us a star! ⭐

It helps others discover this tool and keeps the project alive.

---

## 🔗 Links

- 🌐 **Live Demo**: https://yalums.github.io/lyra-exporter/
- 🔌 **Tampermonkey Script**: https://greasyfork.org/en/scripts/539579-lyra-s-exporter-fetch
- 📖 **Documentation**: [See Wiki](https://github.com/Yalums/lyra-exporter/wiki)
- 🐛 **Report Issues**: [GitHub Issues](https://github.com/Yalums/lyra-exporter/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Yalums/lyra-exporter/discussions)

---

<div align="center">

**Made with ❤️ and lots of AI conversations**

*Your conversations are precious. Keep them safe.*

</div>
