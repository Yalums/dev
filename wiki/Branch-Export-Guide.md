# Branch Export Guide / 分支导出指南

**This is Lyra Exporter's most unique feature** - we're the **ONLY tool** that fully preserves conversation branches.

**这是 Lyra Exporter 最独特的功能** - 我们是**唯一**完整保留对话分支的工具。

---

## 🌲 What Are Conversation Branches? / 什么是对话分支？

### English Explanation

When you use ChatGPT or Claude, you can **edit a previous message** and regenerate the AI's response. This creates a **branch point** - like a fork in the road. Your conversation now has multiple possible paths.

**Example:**
```
You: "Write a poem about cats"
AI: [Poem v1]
   ↓
You edit to: "Write a haiku about cats"  ← Branch point!
   ↓
AI: [Haiku v1]
   ↓
You regenerate  ← Another branch!
   ↓
AI: [Haiku v2]
```

Now your conversation has **3 different paths**:
- Original path: Poem v1
- Branch 1: Haiku v1
- Branch 2: Haiku v2

### 中文说明

当你使用 ChatGPT 或 Claude 时，可以**编辑之前的消息**并重新生成AI的回复。这会创建一个**分支点** - 就像岔路口。你的对话现在有了多条可能的路径。

**示例：**
```
你："写一首关于猫的诗"
AI：[诗歌 v1]
   ↓
你编辑为："写一首关于猫的俳句"  ← 分支点！
   ↓
AI：[俳句 v1]
   ↓
你重新生成  ← 又一个分支！
   ↓
AI：[俳句 v2]
```

现在你的对话有了**3条不同路径**：
- 原始路径：诗歌 v1
- 分支1：俳句 v1
- 分支2：俳句 v2

---

## ❌ The Problem with Other Tools / 其他工具的问题

### What Most Tools Do / 大多数工具的做法

**They only save the ACTIVE path** - all other branches are lost forever! 😢

**它们只保存当前活跃路径** - 其他所有分支永久丢失！😢

**Example:**
```
Original conversation:
├─ You: "Write a poem"
│  ├─ AI: [Poem v1]  ← Branch 1
│  └─ AI: [Poem v2]  ← Branch 2 (ACTIVE)
└─ You: "Make it rhyme"
   └─ AI: [Response]

Other tools export:
└─ You: "Write a poem"
   └─ AI: [Poem v2]  ← Only this one!
   └─ You: "Make it rhyme"
      └─ AI: [Response]

❌ Poem v1 is GONE!
```

### Why This Matters / 为什么这很重要

You lose:
- ❌ Alternative ideas the AI generated
- ❌ Different coding solutions
- ❌ Earlier versions of your edits
- ❌ Exploration paths you tried
- ❌ Potentially better answers

你会失去：
- ❌ AI生成的替代想法
- ❌ 不同的代码解决方案
- ❌ 你编辑的早期版本
- ❌ 你尝试过的探索路径
- ❌ 可能更好的答案

---

## ✅ How Lyra Exporter Solves This / Lyra Exporter 如何解决

### Complete Branch Detection / 完整分支检测

**We preserve EVERYTHING:**
1. Detect all branch points automatically
2. Build the complete conversation tree
3. Export all paths (not just the active one)
4. Visualize branches in the UI

**我们保留一切：**
1. 自动检测所有分支点
2. 构建完整对话树
3. 导出所有路径（不仅仅是活跃路径）
4. 在UI中可视化分支

---

## 🎯 How to Use Branch Export / 如何使用分支导出

### Step 1: Import Your Conversation / 导入对话

**Using Tampermonkey Script (Recommended):**
1. Install [Lyra Exporter Fetch](https://greasyfork.org/en/scripts/539579-lyra-s-exporter-fetch)
2. Go to ChatGPT/Claude conversation
3. Click the export button
4. Conversation auto-loads with ALL branches

**使用 Tampermonkey 脚本（推荐）：**
1. 安装 [Lyra Exporter Fetch](https://greasyfork.org/en/scripts/539579-lyra-s-exporter-fetch)
2. 前往 ChatGPT/Claude 对话页面
3. 点击导出按钮
4. 对话自动加载，包含所有分支

**Manual Import:**
1. Download conversation JSON from ChatGPT/Claude
2. Open Lyra Exporter
3. Upload the JSON file
4. Branches automatically detected

**手动导入：**
1. 从 ChatGPT/Claude 下载对话JSON
2. 打开 Lyra Exporter
3. 上传JSON文件
4. 自动检测分支

---

### Step 2: View Branches in UI / 在UI中查看分支

**Timeline View** shows branches visually:

**时间线视图**可视化显示分支：

```
👤 You: "Write a function to sort an array"

├─ 🤖 AI (Branch 1): [Bubble sort implementation]
│
├─ 🤖 AI (Branch 2): [Quick sort implementation]  ← Branch indicator
│
└─ 🤖 AI (Branch 3): [Merge sort implementation]  ← Branch indicator

👤 You: "Explain time complexity"
```

**Branch indicators show:**
- Number of alternative responses
- Which branch is currently selected
- Navigation to switch between branches

**分支指示器显示：**
- 替代回复的数量
- 当前选择的是哪个分支
- 可导航切换分支

---

### Step 3: Export with Branches / 导出含分支的对话

#### Markdown Export / Markdown导出

**All branches are embedded as comments:**

**所有分支作为注释嵌入：**

```markdown
**You:** Write a function to sort an array

**AI:** [Bubble sort implementation]

<!-- BRANCH POINT: 3 alternatives -->
<!-- Branch 2/3 -->
**AI (Alternative):** [Quick sort implementation]

<!-- Branch 3/3 -->
**AI (Alternative):** [Merge sort implementation]
<!-- END BRANCHES -->

**You:** Explain time complexity
```

#### PDF Export / PDF导出

Branches are formatted clearly:

分支格式清晰：

```
User: Write a function