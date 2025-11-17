# Lyra Exporter

<div align="center">

**すべてを残すAI会話エクスポートツール**

[![ライブデモ](https://img.shields.io/badge/🌐_ライブデモ-yalums.github.io-blue?style=for-the-badge)](https://yalums.github.io/lyra-exporter/)
[![Tampermonkeyスクリプト](https://img.shields.io/badge/🔌_Tampermonkey-Greasy_Fork-orange?style=for-the-badge)](https://greasyfork.org/ja/scripts/539579-lyra-s-exporter-fetch)
[![ライセンス](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[English](README.md) | [简体中文](README_zh.md) | 日本語 | [한국어](README_ko.md)

**100% オープンソース • プライバシー完全保護 • 分岐完全エクスポート**

</div>

---

## 🎯 なぜLyra Exporterなのか？

他のエクスポートツールは**会話の分岐を失い**、**重要なコンテンツを削除**します。このツールは違います。

| 機能 | Lyra Exporter | 他ツール |
|---------|---------------|--------|
| **分岐エクスポート** | ✅ 完全なツリー構造 | ❌ 永久消失 |
| **Canvas/Artifacts** | ✅ 完全保持 | ❌ 削除される |
| **日本語PDF** | ✅ フォント内蔵、文字化けなし | ❌ □□□表示 |
| **思考プロセス** | ✅ Claude/ChatGPT o1対応 | ❌ 非対応 |
| **プライバシー** | ✅ 100%ローカル処理 | ⚠️ サーバーアップロード |
| **一括エクスポート** | ✅ 全会話→ZIP | ⚠️ 一つずつ |
| **エクスポート形式** | ✅ Markdown + PDF + 画像 | ⚠️ Markdownのみ |

---

## ✨ 特徴

### 🌲 完全な分岐保存
ChatGPT、Claude、Geminiの会話分岐を完全保存する**唯一のツール**。メッセージを編集して新しいパスを作成しても、**すべてのバージョン**を保存します。

### 🔒 プライバシー完全保護
- **バックエンドなし** - すべてブラウザで処理
- **アナリティクスなし** - トラッキングしません
- **ネットワークリクエストなし** - データはデバイスから出ません
- **オープンソース** - 自分でコードを監査できます

### 📦 すべて保持
他ツールが削除するものも保存：
- ✅ **Claude Artifacts** - コード、ドキュメント、チャート
- ✅ **ChatGPT Canvas** - すべてのキャンバスとイテレーション
- ✅ **思考プロセス** - Claudeの内部思考、o1の推論
- ✅ **ツール呼び出し** - Web検索、コード実行、ファイル読み込み
- ✅ **画像** - ユーザーアップロードとAI生成画像
- ✅ **LaTeX数式** - UIとPDFエクスポートでレンダリング

### 🎨 3つのエクスポート形式

#### 1️⃣ Markdownエクスポート
- GitHub形式、構文ハイライト付き
- 分岐情報をコメントとして埋め込み
- タグマーカー：`[✅ 完了]` `[⭐ 重要]`
- バージョン管理に最適

#### 2️⃣ PDFエクスポート *（独自機能）*
- **日本語フォント内蔵**（ARUDJingxihei） - □□□表示なし
- **LaTeXレンダリング** - 数式を正しく表示
- **太字・斜体対応** - 適切なMarkdown形式
- **コード構文ハイライト** - 読みやすいコードブロック
- **A4ページレイアウト** - 印刷可能

#### 3️⃣ スクリーンショットエクスポート *（独自機能）*
- **ピクセル完璧** - UIの外観を正確にキャプチャ
- **自動分割** - 長い会話を複数画像に
- **プラットフォームスタイル** - 色、アバター、アイコンを保持
- **ライト/ダークテーマ** - エクスポートテーマを選択

### 🏷️ スマートタグシステム
- メッセージにマーク：✅ 完了 | ⭐ 重要 | 🗑️ 削除
- **必要なものだけエクスポート** - タグでフィルター
- ファイル間統計 - すべてのタグ付きメッセージを表示
- エクスポートでタグ保持

### 🌍 マルチプラットフォーム対応

**6つ以上のAIプラットフォームをサポート：**
- 🤖 **Claude** - 単一チャット + アカウント全体エクスポート（プロジェクト、Artifacts、思考）
- 💬 **ChatGPT** - 単一チャット + アカウント全体エクスポート（Canvas、o1思考、ワークスペース）
- 🔷 **Gemini** - 分岐付き会話
- 📚 **NotebookLM** - ノートブックエクスポート
- 🎓 **Google AI Studio** - AI Studioチャット
- 🎭 **SillyTavern** - 分岐付きJSONL

**アカウント全体エクスポート** ChatGPTとClaude対応 - ワンクリックで会話履歴全体を取得：
- ワークスペース/プロジェクト間のすべての会話
- 添付ファイル、Artifacts、Canvasアイテム
- 思考プロセスとツール呼び出し
- Markdown/PDF/画像にワンクリック一括変換

---

## 🚀 クイックスタート

### オプション1：オンライン利用（推奨）

**アクセスするだけ：** [https://yalums.github.io/lyra-exporter/](https://yalums.github.io/lyra-exporter/)

### オプション2：コンパニオンスクリプトをインストール

Tampermonkeyスクリプトで**ワンクリック**で会話取得：

1. [Tampermonkey](https://www.tampermonkey.net/)をインストール
2. [Lyra Exporter Fetch](https://greasyfork.org/ja/scripts/539579-lyra-s-exporter-fetch)をインストール
3. ChatGPT/Claude/Geminiにアクセスしてエクスポートボタンをクリック
4. Lyra Exporterに自動ロード ✨

### オプション3：ローカル実行

```bash
git clone https://github.com/Yalums/lyra-exporter.git
cd lyra-exporter
npm install
npm start
```

---

## 📸 スクリーンショット

<details>
<summary>クリックして展開</summary>

### ウェルカムページ
![Welcome](https://i.postimg.cc/T3cSmKBK/Pix-Pin-2025-10-15-08-32-35.png)

### グローバル検索
![Search](https://i.postimg.cc/C1xSd5Hp/Pix-Pin-2025-10-16-16-33-44.png)

### カードビュー
![Cards](https://i.postimg.cc/05Fq2JqY/Pix-Pin-2025-10-15-08-46-09.png)

### 分岐付きタイムライン
![Timeline](https://i.postimg.cc/hG1SX40R/Pix-Pin-2025-10-15-08-44-10.png)

</details>

---

## 🎯 ユースケース

### 開発者向け
- 構文ハイライト付きコードスニペットをエクスポート
- すべてのArtifactsとツール呼び出しを保持
- AI会話をバージョン管理
- 適切な形式で会話を共有

### 研究者向け
- 研究会話全体をエクスポート
- PDFでLaTeX数式を正しくレンダリング
- 重要な洞察にタグ付けして後で確認
- 会話間検索

### プライバシー重視ユーザー向け
- 100%ローカル処理 - データアップロードなし
- オープンソースコードを監査
- AI会話を完全制御
- トラッキングやアナリティクスなし

### パワーユーザー向け
- 数百の会話を一括エクスポート
- タグとスターで整理
- ニーズに応じた複数のエクスポート形式
- アカウント履歴全体のバックアップ

---

## 🛠️ 技術スタック

- **React 19.1** - モダンUIフレームワーク
- **TailwindCSS 3.4** - ユーティリティファーストスタイリング
- **jsPDF** - カスタムフォント付きPDF生成
- **html2canvas** - スクリーンショットレンダリング
- **KaTeX** - LaTeX数式レンダリング
- **react-markdown** - Markdown表示

**バックエンドなし。データベースなし。純粋なクライアントサイドマジック。** ✨

---

## 🌟 独自機能詳細

### 分岐可視化
会話は直線的ではありません。メッセージを編集して再生成すると、**分岐**が作成されます。以下ができる唯一のツール：
- すべての分岐ポイントを自動検出
- 会話ツリーを可視化
- すべての分岐をエクスポート（アクティブパスだけでなく）
- 分岐間を視覚的にナビゲート

### 日本語対応PDFエクスポート
ほとんどのPDFエクスポートツールは日本語で`□□□`を表示します。このツールは違います。
- **ARUDJingxiheiフォント内蔵**（オープンソース、各約9MB）
- **3つのフォントウェイト**：Regular、Bold、Light
- **フォント検証**：TTFマジックナンバー、ファイルサイズ、Unicode cmapチェック
- **グレースフルフォールバック**：フォント失敗時はHelveticaに
- **CJKカバレッジ**：簡体字/繁体字中国語、日本語漢字、韓国語漢字

### スクリーンショットエクスポート
なぜスクリーンショット？形式が重要だからです。
- **プラットフォーム固有スタイリング** - ChatGPT緑、Claude紫を保持
- **自動分割** - Xピクセル以上の会話→複数画像
- **設定可能** - 幅、高さ制限、スケール、形式（PNG/JPG）、テーマ
- **一括エクスポート** - 複数画像をZIPにパッケージ

---

## 📊 機能比較

| 機能 | Lyra Exporter | ChatGPT Exporter | ブラウザプラグイン |
|---------|---------------|------------------|-----------------|
| マルチプラットフォーム | 6つ以上 | ChatGPTのみ | 1-2プラットフォーム |
| 分岐エクスポート | ✅ 完全ツリー | ❌ アクティブパスのみ | ❌ 分岐なし |
| Artifacts/Canvas | ✅ 保持 | ⚠️ テキストのみ | ❌ 削除 |
| PDFエクスポート | ✅ フォント付き | ❌ PDFなし | ⚠️ プレーンPDF |
| スクリーンショット | ✅ 自動分割 | ❌ 手動 | ❌ なし |
| 思考プロセス | ✅ 完全 | ⚠️ 部分的 | ❌ なし |
| 一括エクスポート | ✅ ZIPパッキング | ⚠️ 手動 | ❌ 一つずつ |
| プライバシー | ✅ 100%ローカル | ⚠️ 依存 | ⚠️ アップロードリスク |
| オープンソース | ✅ MIT | ⚠️ 一部 | ❌ クローズド |
| LaTeXレンダリング | ✅ KaTeX | ❌ なし | ❌ なし |
| タグシステム | ✅ 3タイプ | ❌ なし | ❌ なし |

---

## 🤝 コントリビューション

コントリビューションを歓迎します！ガイドラインは[CONTRIBUTING.md](CONTRIBUTING.md)を参照してください。

**ヘルプが必要な分野：**
- [ ] 自動テスト
- [ ] 追加エクスポート形式（Word、HTML）
- [ ] モバイルアプリ版
- [ ] プラットフォームサポート追加
- [ ] ドキュメント翻訳

---

## 📜 ライセンス

MITライセンス - 詳細は[LICENSE](LICENSE)を参照

**Claudeと共同作成** - このプロジェクト全体はAIとの会話を通じて構築されました。メタですね？

---

## ⭐ このプロジェクトをサポート

Lyra Exporterがあなたの会話を保存したら、スターをください！⭐

他の人がこのツールを発見し、プロジェクトを存続させるのに役立ちます。

---

## 🔗 リンク

- 🌐 **ライブデモ**: https://yalums.github.io/lyra-exporter/
- 🔌 **Tampermonkeyスクリプト**: https://greasyfork.org/ja/scripts/539579-lyra-s-exporter-fetch
- 📖 **ドキュメント**: [Wikiを見る](https://github.com/Yalums/lyra-exporter/wiki)
- 🐛 **問題を報告**: [GitHub Issues](https://github.com/Yalums/lyra-exporter/issues)
- 💬 **ディスカッション**: [GitHub Discussions](https://github.com/Yalums/lyra-exporter/discussions)

---

<div align="center">

**❤️とたくさんのAI会話で作られました**

*あなたの会話は貴重です。安全に保ちましょう。*

</div>
