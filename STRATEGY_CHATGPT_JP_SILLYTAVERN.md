# ChatGPT日本 + SillyTavern 双线作战计划
# ChatGPT Japan + SillyTavern Dual-Track Strategy

---

## 🎯 为什么这两个方向？

### ChatGPT日本市场
- 📊 **全球使用率第2** - 仅次于美国
- 💼 **企业采用率高** - 商务文档需求大
- 📚 **整理文化** - 日本人爱分类整理
- 🔒 **隐私意识强** - 本地处理是卖点
- 📕 **PDF需求** - 我们有日文字体支持

### SillyTavern社区
- 🤓 **技术极客** - 会贡献代码、反馈质量高
- 📚 **对话量大** - 几百条对话很常见
- 🎨 **创作者** - 需要整理角色、剧情
- 🌍 **国际化** - 英日用户都多
- 💎 **付费意愿高** - 愿意支持好工具

---

## 🎌 战线1：ChatGPT日本市场突破

### Phase 1: 社区营销（Week 1-2）

#### 1.1 Twitter日语推广

**发布时间：** 日本时间 上午10-11点 或 晚上8-9点

**Thread内容：**
```
🚀 ChatGPTユーザーの皆さんへ

会話の「分岐」、ちゃんと保存できていますか？

編集→再生成で作った別の回答、
実は他のツールでは全部消えています😱

スレッドで詳しく解説↓
[1/8]

---

❌ 他のエクスポートツールの問題

ChatGPTで前のメッセージを編集して
「再生成」すると、会話が「分岐」します。

従来ツール：現在の経路のみ保存
→ 他の分岐は永久に消失

これ、かなり痛いですよね...
[2/8]

---

✅ Lyra Exporterの解決策

すべての分岐を完全保存する
唯一のツールです！

[分岐ツリーの画像]

• 自動的に分岐点を検出
• 完全な会話ツリーをエクスポート
• UIで分岐を可視化
• すべてのパスを保存
[3/8]

---

📕 日本語PDF完全対応

多くのPDFツール：
日本語が「□□□」に文字化け

Lyra Exporter：
• オープンソース日本語フォント内蔵
• LaTeX数式もきれいに表示
• 太字・斜体対応

[日本語PDFサンプル画像]

商談記録、議事録、レポート作成に最適！
[4/8]

---

🏷️ タグ付けで整理

日本人が得意な「整理術」を活かせます：

✅ 完了 - 処理済みの会話
⭐ 重要 - 後で見返す内容
🗑️ 削除 - 不要なメッセージ

タグ付きメッセージだけ
選択的にエクスポート可能

[タグシステム画像]

文房具好きな日本人にピッタリ！
[5/8]

---

🔍 全会話を一括検索

数百の会話から
あの内容どこだっけ？

グローバル検索機能で
すべての会話を横断検索

• メッセージ内容
• 会話タイトル
• タグ
• 画像の有無

[検索画面画像]
[6/8]

---

🔒 100%プライバシー保護

企業秘密、個人情報も安心：

• サーバーなし - 全てブラウザで処理
• データ送信ゼロ
• トラッキングなし
• 完全オープンソース（MIT）

あなたのデータは
あなたのデバイスに残ります

金融・医療・法務でも使えます
[7/8]

---

無料で今すぐ使えます：
🌐 https://yalums.github.io/lyra-exporter

対応：
• ChatGPT（全アカウントエクスポート対応）
• Claude、Gemini、NotebookLM、AI Studio

GitHub⭐してくれると嬉しいです：
https://github.com/Yalums/lyra-exporter

#ChatGPT #ChatGPT活用 #AI #生成AI #オープンソース #プライバシー
[8/8]
```

#### 1.2 Qiita技術記事

**タイトル：**
```
ChatGPTの会話を「分岐」ごと完全保存する
オープンソースツールを作った話
```

**構成：**
```markdown
# はじめに

ChatGPTを仕事で使っていて、こんな経験ありませんか？

「あれ、さっき生成した別バージョンの回答、どこ行った？」
「編集して再生成したら、前の回答が消えた...」

これ、実は**会話の分岐**が失われているんです。

今回、この問題を解決する「Lyra Exporter」というツールを作りました。

# 問題：会話の分岐が消える

## ChatGPTの会話分岐とは

[図解：編集→再生成で分岐が生成される様子]

## 既存ツールの問題点

[比較表：他ツール vs Lyra Exporter]

# 解決策：完全な分岐保存

## 技術的アプローチ

```javascript
// 分岐検出アルゴリズム
function detectBranches(messages) {
  // UUIDベースの親子関係構築
  // 分岐点の特定
  // 全パスの列挙
}
```

## 実装のポイント

1. UUID親子関係の構築
2. 分岐点の検出
3. ツリー構造の保存

# 日本語PDF対応の苦労

## なぜ文字化けするのか

[TTFフォント埋め込みの解説]

## 解決方法

```javascript
// ARUDJingxiheiフォント埋め込み
doc.addFileToVFS('font.ttf', base64);
doc.addFont('font.ttf', 'ARUDJingxihei', 'normal');
```

# その他の機能

• タグシステム
• グローバル検索
• 3つのエクスポート形式
• プライバシー保護

# 使い方

[スクリーンショット付き手順]

# まとめ

完全無料・オープンソース（MIT）です。
ぜひ使ってみてください！

• デモ: https://yalums.github.io/lyra-exporter
• GitHub: https://github.com/Yalums/lyra-exporter
• 技術詳細: Wiki参照

フィードバック・貢献お待ちしています！
```

**タグ：**
```
ChatGPT, AI, オープンソース, React, PDF, プライバシー,
Markdown, エクスポート, 日本語対応, jsPDF
```

#### 1.3 YouTube日本語チュートリアル

**動画タイトル：**
```
【無料】ChatGPTの会話を完全バックアップ！
分岐も全部残せる神ツール | Lyra Exporter
```

**動画構成（12分）：**
```
0:00 - イントロ：なぜバックアップが必要？
0:45 - 既存ツールの問題点（分岐が消える）
1:30 - Lyra Exporter紹介
2:00 - 機能1：分岐保存（実演）
4:00 - 機能2：日本語PDF（文字化けなし）
6:00 - 機能3：タグ付けと整理
7:30 - 機能4：グローバル検索
8:30 - 使い方デモ（ChatGPT→エクスポート）
10:30 - プライバシー保護の重要性
11:30 - まとめ・リンク

サムネイル：
「ChatGPT会話バックアップ」
「分岐も全保存！」
「無料・日本語対応」
```

---

## 🎭 战线2：SillyTavern社区深度合作

### Phase 1: 社区渗透（Week 1）

#### 2.1 SillyTavern Discord

**加入服务器：**
https://discord.gg/sillytavern

**发布策略：**

**#showcase频道：**
```
Hey everyone! 👋

I built a tool that might be useful for SillyTavern users who want
to backup and organize their conversations.

**Lyra Exporter** - https://github.com/Yalums/lyra-exporter

What makes it special for ST users:

🌲 **Complete branch preservation**
   - ST supports branching, but exporting loses them
   - Lyra exports the FULL conversation tree
   - All your story paths preserved

📚 **Organize by character/scenario**
   - Tag system: ✅ completed, ⭐ important, 🗑️ delete
   - Filter and export only tagged messages
   - Perfect for managing multiple characters

🔍 **Global search**
   - Search across ALL your conversations
   - Find that perfect dialogue snippet
   - Search by character, scene, or content

📦 **Three export formats**
   - Markdown (GitHub style, easy to edit)
   - PDF (with embedded fonts, printable)
   - Screenshot (visual archival)

🔒 **100% privacy-first**
   - All processing happens locally
   - No data uploads
   - Open source (MIT)

Already supports ST's JSONL format with branches!

Would love feedback from the community. What features would be
most useful for roleplay/creative writing workflows?

[Screenshots of branch visualization, tag system]
```

**#help频道（过几天后）：**
```
💡 Tip: Backing up SillyTavern conversations

If you're looking for a way to backup your ST chats with full
branch preservation, I made a tool for that:

https://yalums.github.io/lyra-exporter

Supports ST's JSONL format and keeps all branches intact.
You can also tag important messages and export selectively.

Hope it helps!
```

#### 2.2 Reddit r/SillyTavern

**发帖标题：**
```
[Tool] Export SillyTavern chats with complete branch preservation
+ tagging + global search
```

**正文：**
```markdown
Hey fellow ST users!

I created **Lyra Exporter**, a tool for backing up and organizing
AI conversations. It works great with SillyTavern's JSONL format.

## Why I built this

I was frustrated that exporting ST chats lost all the branches.
When you edit a message and regenerate, you create story branches -
but most tools only save the active path.

## What it does for ST users

### 🌲 Complete Branch Preservation
- Exports the FULL conversation tree
- All your story paths preserved
- Branch visualization in timeline view
- [Screenshot of branch tree]

### 🏷️ Character/Scenario Organization
- Tag messages: ✅ completed, ⭐ important, 🗑️ delete
- Filter by tags before export
- Perfect for managing multiple characters/scenarios
- Cross-conversation statistics
- [Screenshot of tag system]

### 🔍 Global Search
- Search across ALL imported conversations
- Find dialogues by character, scene, content
- Filter by: images, thinking, artifacts
- [Screenshot of search]

### 📦 Three Export Formats
- **Markdown**: Easy to edit, version control
- **PDF**: Embedded fonts (no garbled text), printable
- **Screenshot**: Visual archival with auto-splitting

### 🔒 Privacy-First
- 100% local processing (no backend)
- No tracking/analytics
- Open source (MIT license)

## How to use with SillyTavern

1. Export your ST chat as JSONL (with branches)
2. Open Lyra Exporter: https://yalums.github.io/lyra-exporter
3. Import the JSONL file
4. All branches automatically detected!
5. Tag, search, export

## Links

- **Live Demo**: https://yalums.github.io/lyra-exporter
- **GitHub**: https://github.com/Yalums/lyra-exporter
- **Wiki**: [detailed docs]

## Features I'm considering adding for ST users

- Character card export/import
- Dialogue statistics per character
- Story branch visualization (tree diagram)
- Batch rename by character/scenario

**What would be most useful for your workflow?**

Feedback and contributions welcome! It's open source (MIT).

---

*Note: This is a web app (PWA), works on any browser.
No installation needed, completely free.*
```

#### 2.3 SillyTavern GitHub

**在Issues/Discussions搜索相关话题：**
- "export"
- "backup"
- "branches"
- "archive"

**友好回复：**
```
Hey! I built a tool that might help with this:
https://github.com/Yalums/lyra-exporter

It preserves ST's conversation branches when exporting.
Let me know if it works for your use case!
```

### Phase 2: SillyTavern专属功能（Week 2-3）

#### 功能增强清单

**优先级1（立即添加）：**

1. **Character Statistics**
   ```javascript
   // 每个角色的统计
   {
     characterName: "Alice",
     messageCount: 156,
     wordCount: 12453,
     firstAppearance: "2024-01-15",
     lastSeen: "2024-11-17",
     tags: { completed: 12, important: 5 }
   }
   ```

2. **Scenario Templates**
   ```javascript
   // 场景导出模板
   exportScenario({
     title: "Fantasy Quest",
     characters: ["Hero", "Wizard", "Dragon"],
     tags: ["important"],
     format: "markdown"
   });
   ```

3. **Batch Rename**
   ```javascript
   // 按角色/时间自动命名
   renameConversations({
     pattern: "{character}_{date}_{index}",
     // 输出：Alice_2024-11-17_001.md
   });
   ```

**优先级2（后续）：**

4. **Story Branch Diagram**
   - 树状图可视化剧情分支
   - Mermaid.js生成图表
   - 导出为SVG/PNG

5. **Character Card Integration**
   - 导入ST角色卡片
   - 关联对话与角色
   - 导出时包含角色设定

6. **Dialogue Analysis**
   - 情感分析
   - 常用词统计
   - 角色性格一致性检查

---

## 📊 预期效果

### ChatGPT日本市场

**Week 1-2:**
- Twitter: 1000-3000 impressions
- Qiita: 200-500 views
- YouTube: 100-500 views
- GitHub stars from Japan: +20-50

**Month 1-2:**
- 日本用户占比: 15-25%
- Qiita trending（可能）
- 日本技术博客转载（2-3个）

### SillyTavern社区

**Week 1:**
- Discord反馈: 10-20条
- Reddit upvotes: 50-100
- GitHub stars from ST users: +30-60

**Month 1:**
- ST用户占比: 10-15%
- Feature requests: 5-10条
- Pull requests: 1-3个
- 可能被ST官方推荐

---

## 🎯 成功指标

### ChatGPT日本
- [ ] Qiita文章 > 300 views
- [ ] Twitter thread > 2000 impressions
- [ ] YouTube > 500 views
- [ ] GitHub日本用户 > 50 stars

### SillyTavern
- [ ] Discord成员使用 > 20人
- [ ] Reddit帖子 > 80 upvotes
- [ ] Feature request > 5条
- [ ] 被ST官方文档引用

---

## 📅 执行时间表

### Week 1: ChatGPT日本启动
- Day 1: Twitter日语thread
- Day 2-3: Qiita文章撰写
- Day 4-5: YouTube视频录制
- Day 6-7: 社区互动、收集反馈

### Week 2: SillyTavern渗透
- Day 1: 加入Discord、Reddit
- Day 2: Discord showcase发布
- Day 3: Reddit详细帖子
- Day 4-5: 回复评论、收集需求
- Day 6-7: 开始ST专属功能开发

### Week 3: 功能增强
- ST Character Statistics实现
- ST Scenario Templates实现
- 文档更新
- 两个社区持续互动

### Week 4: 总结优化
- 数据分析
- 用户反馈整理
- Bug修复
- 下阶段规划

---

## 💡 独特卖点总结

### ChatGPT日本用户
1. **日文PDF无乱码** - 商务文档必备
2. **完整分支保存** - 方案对比工作流
3. **整理系统** - 符合日本文化
4. **隐私保护** - 企业可用

### SillyTavern用户
1. **分支树导出** - 保存所有剧情线
2. **角色管理** - 多角色对话整理
3. **全局搜索** - 跨对话查找台词
4. **批量操作** - 大量对话管理
5. **开源可扩展** - 技术社区友好

---

## 🚀 立即行动清单

**今天：**
- [ ] 准备Twitter日语thread截图
- [ ] 开始Qiita文章草稿
- [ ] 加入SillyTavern Discord

**明天：**
- [ ] 发布Twitter日语thread
- [ ] Discord自我介绍 + 观察社区

**本周内：**
- [ ] Qiita文章发布
- [ ] Reddit r/SillyTavern发帖
- [ ] 收集两个社区的反馈

**下周：**
- [ ] 实现Character Statistics
- [ ] YouTube日语视频录制
- [ ] 持续社区互动

---

**准备开战了吗？ԅ(¯ㅂ¯ԅ)** 🔥
