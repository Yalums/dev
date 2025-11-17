# PDF Markdown/LaTeX 渲染改进方案（保守版）

## 问题分析

### 为什么之前的方案失败了？

1. **字体变体不存在**
   - `SarasaMonoSC-Regular.ttf` 只有 `normal` 样式
   - 尝试使用 `bold`、`italic` 会导致jsPDF报错

2. **Unicode符号支持不确定**
   - 转换LaTeX为Unicode（如 α, β, ∑）可能导致显示为方块
   - 不同字体对Unicode的支持差异很大

3. **过度复杂的解析**
   - 复杂的正则表达式可能错误匹配
   - 增加了出错的可能性

## 实际可行的改进方案

### 方案1: 使用颜色和缩进（推荐）

**不使用字体变体，只使用颜色区分**

```javascript
// 标题 - 使用更大字号 + 深色
this.pdf.setFontSize(fontSize);
this.pdf.setTextColor(0, 0, 0); // 黑色

// 粗体 - 使用深色或重复打印（伪粗体）
this.pdf.setTextColor(0, 0, 0);
this.pdf.text(text, x, y);
this.pdf.text(text, x + 0.1, y); // 轻微偏移创建伪粗体效果

// 斜体 - 使用蓝色或灰色区分
this.pdf.setTextColor(70, 130, 180); // 蓝色

// 代码 - 使用courier字体 + 灰色背景
this.pdf.setFont('courier', 'normal');
this.pdf.setFillColor(245, 245, 245);
```

**优点:**
- 不依赖字体变体
- 视觉效果清晰
- 兼容性好

### 方案2: LaTeX简化（不使用Unicode）

**保持LaTeX文本，但改善格式**

```javascript
// 块级公式 - 添加背景和缩进
$$
E = mc^2
$$

// 行内公式 - 使用不同颜色
⟨ E = mc^2 ⟩

// 不转换为Unicode，保持原始LaTeX
```

**优点:**
- 不依赖字体对Unicode的支持
- LaTeX语法本身已经很直观
- 复制粘贴后仍然可用

### 方案3: 最小化Markdown支持

**只支持最基本、最安全的格式**

支持项目：
- ✅ 标题（# - ######）- 仅调整字号
- ✅ 代码块（```）- 已有支持
- ✅ 列表（-、*、1.）- 使用项目符号
- ✅ 引用（>）- 添加左侧竖线
- ❌ 粗体/斜体 - 暂不支持
- ❌ 链接 - 暂不支持
- ❌ 行内代码 - 暂不支持

**原因:**
- 避免复杂的正则表达式
- 减少出错可能
- 保持可维护性

## 推荐实施方案

### 阶段1: 仅改善视觉效果（最安全）

不改变文本内容，只优化视觉呈现：

1. **LaTeX公式**
   - 保持原始LaTeX文本
   - 添加浅蓝色背景
   - 使用蓝色文字
   - 添加"MATH"标签

2. **代码块**
   - 保持现有实现
   - 添加行号
   - 添加语言标签

3. **普通文本**
   - 保持原样
   - 不做任何解析

**优点:**
- 完全安全，不会出错
- 视觉效果已经很好
- 保持文本可复制性

### 阶段2: 添加简单的标题识别（可选）

如果阶段1成功，可以添加：

```javascript
// 只识别标题，不处理其他markdown
if (line.startsWith('# ')) {
  this.renderHeading(line, 1);
} else if (line.startsWith('## ')) {
  this.renderHeading(line, 2);
} else {
  this.renderPlainText(line);
}
```

**注意:**
- 不使用正则表达式
- 不递归解析
- 保持简单

## 不推荐的做法

❌ **使用字体变体**
```javascript
// 这会失败，因为字体没有这些变体
pdf.setFont(fontName, 'bold');
pdf.setFont(fontName, 'italic');
```

❌ **大量Unicode替换**
```javascript
// 这可能导致方框或乱码
'\\alpha' → 'α'
'\\sum' → '∑'
```

❌ **复杂的markdown解析**
```javascript
// 容易出错，难以维护
/\*\*(.+?)\*\*/g  // 可能误匹配
```

## 结论

在jsPDF + 单一字体文件的限制下：

1. **保持简单** - 不要过度解析
2. **使用颜色** - 而不是字体变体
3. **保持原文** - 而不是Unicode转换
4. **渐进增强** - 先做最安全的改进

这样既能改善PDF的视觉效果，又不会出现乱码或错误。
