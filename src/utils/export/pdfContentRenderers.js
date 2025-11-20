// utils/export/pdfContentRenderers.js
// PDF 内容渲染器 - 代码块、Markdown 和内容区块渲染
//
// 职责：
// - 代码块渲染（支持跨页、语法标记）
// - Markdown 渲染（标题、引用、列表、内联格式）
// - 内容区块渲染（Thinking、Artifact、Tool、Citations、Attachments）

/**
 * PDF 样式配置（从主文件导入需要的常量）
 * 注意：这些常量需要与 pdfExportManager.js 中的 PDF_STYLES 保持一致
 */
export const PDF_STYLES = {
  // 字体大小
  FONT_SIZE_TITLE: 20,
  FONT_SIZE_H1: 16,
  FONT_SIZE_H2: 14,
  FONT_SIZE_SENDER: 12,
  FONT_SIZE_BODY: 10,
  FONT_SIZE_CODE: 9,
  FONT_SIZE_TIMESTAMP: 8,

  // 颜色 (RGB)
  COLOR_SENDER_HUMAN: [0, 102, 204],      // 蓝色
  COLOR_SENDER_ASSISTANT: [102, 102, 102], // 灰色
  COLOR_TIMESTAMP: [150, 150, 150],        // 浅灰
  COLOR_CODE_BG: [245, 245, 245],          // 代码背景
  COLOR_SECTION_BG: [250, 250, 250],       // 区块背景
  COLOR_TEXT: [0, 0, 0],                   // 黑色文本
  COLOR_BORDER: [200, 200, 200],           // 边框颜色

  // 间距
  MARGIN_LEFT: 15,
  MARGIN_RIGHT: 15,
  MARGIN_TOP: 15,
  MARGIN_BOTTOM: 25,
  LINE_HEIGHT: 5,
  SECTION_SPACING: 8,
  MESSAGE_SPACING: 10,

  // 页面
  PAGE_WIDTH: 210,  // A4 宽度(mm)
  PAGE_HEIGHT: 297, // A4 高度(mm)
};

/**
 * 渲染代码块（支持跨页）
 * @param {object} context - PDF 上下文 { pdf, currentY, chineseFontName, availableFontWeights }
 * @param {string} code - 代码内容
 * @param {string} language - 语言标识符
 * @param {function} cleanText - 文本清理函数
 * @param {function} checkPageBreak - 分页检查函数
 * @param {function} safeGetTextWidth - 安全获取文本宽度函数
 */
export function renderCodeBlock(context, code, language = '', cleanText, checkPageBreak, safeGetTextWidth) {
  const { pdf, chineseFontName, availableFontWeights } = context;
  checkPageBreak(context, PDF_STYLES.FONT_SIZE_CODE + PDF_STYLES.SECTION_SPACING * 2);

  const maxWidth = PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_LEFT - PDF_STYLES.MARGIN_RIGHT;
  const lineNumberWidth = 8;
  const codeWidth = maxWidth - lineNumberWidth - 8;
  const padding = 3;

  const cleanCode = cleanText(code);
  const cleanLanguage = cleanText(language);

  // 渲染语言标签
  if (cleanLanguage) {
    pdf.setFontSize(PDF_STYLES.FONT_SIZE_TIMESTAMP);
    pdf.setTextColor(100, 100, 100);
    const labelText = cleanLanguage.toUpperCase();
    const labelWidth = safeGetTextWidth(context, labelText) + 4;
    pdf.setFillColor(220, 220, 220);
    pdf.roundedRect(
      PDF_STYLES.MARGIN_LEFT,
      context.currentY - 3,
      labelWidth,
      5,
      1,
      1,
      'F'
    );
    pdf.text(labelText, PDF_STYLES.MARGIN_LEFT + 2, context.currentY);
    context.currentY += PDF_STYLES.LINE_HEIGHT * 1.2;
  }

  // 处理代码行
  pdf.setFontSize(PDF_STYLES.FONT_SIZE_CODE);
  pdf.setFont(chineseFontName);
  const codeLines = cleanCode.split('\n');
  const wrappedLines = [];

  codeLines.forEach(line => {
    if (!line) {
      wrappedLines.push({ text: '', lineNumber: wrappedLines.length + 1 });
      return;
    }
    const cleanLine = cleanText(line);
    if (!cleanLine) {
      wrappedLines.push({ text: '', lineNumber: wrappedLines.length + 1 });
      return;
    }

    try {
      const wrapped = pdf.splitTextToSize(cleanLine, codeWidth);
      wrapped.forEach((wLine, idx) => {
        wrappedLines.push({
          text: wLine,
          lineNumber: idx === 0 ? wrappedLines.length + 1 : null
        });
      });
    } catch (error) {
      wrappedLines.push({ text: cleanLine, lineNumber: wrappedLines.length + 1 });
    }
  });

  // 逐行渲染，遇到需要换页时自动换页
  const blockStartY = context.currentY;
  const blockStartPage = pdf.internal.getCurrentPageInfo().pageNumber;
  let isFirstLine = true;

  // 先绘制第一页的背景和边框起始部分
  const firstPageHeight = Math.min(
    wrappedLines.length * PDF_STYLES.LINE_HEIGHT + padding * 2,
    PDF_STYLES.PAGE_HEIGHT - PDF_STYLES.MARGIN_BOTTOM - context.currentY
  );
  pdf.setFillColor(248, 248, 248);
  pdf.rect(
    PDF_STYLES.MARGIN_LEFT,
    blockStartY - padding,
    maxWidth,
    firstPageHeight,
    'F'
  );

  context.currentY = blockStartY;

  wrappedLines.forEach(({ text, lineNumber }, index) => {
    // 检查是否需要换页
    if (context.currentY + PDF_STYLES.FONT_SIZE_CODE > PDF_STYLES.PAGE_HEIGHT - PDF_STYLES.MARGIN_BOTTOM) {
      // 先绘制当前页的代码块底部边框
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      const currentPageBottom = context.currentY;
      pdf.line(
        PDF_STYLES.MARGIN_LEFT,
        blockStartY - padding,
        PDF_STYLES.MARGIN_LEFT,
        currentPageBottom
      );
      pdf.line(
        PDF_STYLES.MARGIN_LEFT + maxWidth,
        blockStartY - padding,
        PDF_STYLES.MARGIN_LEFT + maxWidth,
        currentPageBottom
      );

      // 换页
      pdf.addPage();
      context.currentY = PDF_STYLES.MARGIN_TOP;

      // 在新页绘制代码块背景（连续样式）
      const remainingLines = wrappedLines.length - index;
      const newPageHeight = Math.min(
        remainingLines * PDF_STYLES.LINE_HEIGHT + padding,
        PDF_STYLES.PAGE_HEIGHT - PDF_STYLES.MARGIN_BOTTOM - context.currentY
      );
      pdf.setFillColor(248, 248, 248);
      pdf.rect(
        PDF_STYLES.MARGIN_LEFT,
        context.currentY - padding,
        maxWidth,
        newPageHeight,
        'F'
      );

      isFirstLine = false;
    }

    // 渲染行号
    if (lineNumber !== null) {
      pdf.setFontSize(PDF_STYLES.FONT_SIZE_CODE - 1);
      pdf.setTextColor(150, 150, 150);
      const lineNumStr = String(lineNumber).padStart(3, ' ');
      pdf.text(lineNumStr, PDF_STYLES.MARGIN_LEFT + 1, context.currentY);
    }

    // 渲染代码文本（支持 **粗体** 和 ### 标题）
    const safeLine = cleanText(text);
    if (safeLine !== null && safeLine !== undefined) {
      // 解析粗体和标题标记
      const segments = parseCodeLineBold(safeLine);
      const isHeading = segments.some(s => s.heading);

      // 根据标题级别设置字号和颜色
      if (isHeading) {
        const level = segments[0].heading;
        const headingSizes = [14, 13, 12, 11, 10, 10]; // H1-H6 字号
        pdf.setFontSize(headingSizes[level - 1] || PDF_STYLES.FONT_SIZE_CODE);
        pdf.setTextColor(20, 20, 20); // 深色
      } else {
        pdf.setFontSize(PDF_STYLES.FONT_SIZE_CODE);
        pdf.setTextColor(50, 50, 50);
      }

      let currentX = PDF_STYLES.MARGIN_LEFT + lineNumberWidth + 2;

      segments.forEach(segment => {
        // 标题或粗体使用bold字体
        if ((segment.heading || segment.bold) && availableFontWeights.includes('bold')) {
          pdf.setFont(chineseFontName, 'bold');
        } else {
          // 使用普通字体（保持中文支持）
          pdf.setFont(chineseFontName, 'normal');
        }

        pdf.text(segment.text, currentX, context.currentY);
        currentX += safeGetTextWidth(context, segment.text);
      });

      // 恢复默认字体和字号
      pdf.setFont(chineseFontName, 'normal');
      pdf.setFontSize(PDF_STYLES.FONT_SIZE_CODE);
      pdf.setTextColor(50, 50, 50);
    }
    context.currentY += PDF_STYLES.LINE_HEIGHT;
  });

  // 绘制最后的边框和行号分隔线
  const endPage = pdf.internal.getCurrentPageInfo().pageNumber;

  // 如果跨页，需要在每一页绘制边框
  for (let page = blockStartPage; page <= endPage; page++) {
    pdf.setPage(page);
    const isFirst = (page === blockStartPage);
    const isLast = (page === endPage);

    let boxStartY, boxEndY;
    if (isFirst && isLast) {
      // 单页代码块
      boxStartY = blockStartY - padding;
      boxEndY = context.currentY + padding;
    } else if (isFirst) {
      // 第一页
      boxStartY = blockStartY - padding;
      boxEndY = PDF_STYLES.PAGE_HEIGHT - PDF_STYLES.MARGIN_BOTTOM;
    } else if (isLast) {
      // 最后一页
      boxStartY = PDF_STYLES.MARGIN_TOP - padding;
      boxEndY = context.currentY + padding;
    } else {
      // 中间页
      boxStartY = PDF_STYLES.MARGIN_TOP - padding;
      boxEndY = PDF_STYLES.PAGE_HEIGHT - PDF_STYLES.MARGIN_BOTTOM;
    }

    // 绘制边框
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    if (isFirst && isLast) {
      pdf.roundedRect(PDF_STYLES.MARGIN_LEFT, boxStartY, maxWidth, boxEndY - boxStartY, 1.5, 1.5, 'S');
    } else {
      pdf.line(PDF_STYLES.MARGIN_LEFT, boxStartY, PDF_STYLES.MARGIN_LEFT, boxEndY);
      pdf.line(PDF_STYLES.MARGIN_LEFT + maxWidth, boxStartY, PDF_STYLES.MARGIN_LEFT + maxWidth, boxEndY);
      if (isFirst) {
        pdf.line(PDF_STYLES.MARGIN_LEFT, boxStartY, PDF_STYLES.MARGIN_LEFT + maxWidth, boxStartY);
      }
      if (isLast) {
        pdf.line(PDF_STYLES.MARGIN_LEFT, boxEndY, PDF_STYLES.MARGIN_LEFT + maxWidth, boxEndY);
      }
    }

    // 绘制行号分隔线
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.2);
    pdf.line(
      PDF_STYLES.MARGIN_LEFT + lineNumberWidth,
      boxStartY,
      PDF_STYLES.MARGIN_LEFT + lineNumberWidth,
      boxEndY
    );
  }

  // 确保回到最后一页
  pdf.setPage(endPage);

  // 恢复默认样式
  pdf.setFont(chineseFontName);
  pdf.setTextColor(...PDF_STYLES.COLOR_TEXT);
  context.currentY += PDF_STYLES.SECTION_SPACING;
}

/**
 * 解析代码行中的粗体/标题标记
 * 支持：
 * - **粗体文本**
 * - ### 标题文本 (Markdown 风格)
 * @param {string} line - 代码行
 * @returns {Array} - 片段数组 [{text, bold, heading}]
 */
export function parseCodeLineBold(line) {
  const segments = [];

  // 1. 检查标题标记 (### 开头)
  const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
  if (headingMatch) {
    segments.push({
      text: headingMatch[2],
      bold: false,
      heading: headingMatch[1].length // 标题级别 (1-6)
    });
    return segments;
  }

  // 2. 解析粗体标记 **text**
  let currentIndex = 0;
  const boldRegex = /\*\*(.+?)\*\*/g;
  let match;

  while ((match = boldRegex.exec(line)) !== null) {
    // 添加粗体前的文本
    if (match.index > currentIndex) {
      segments.push({
        text: line.substring(currentIndex, match.index),
        bold: false,
        heading: null
      });
    }

    // 添加粗体文本
    segments.push({
      text: match[1],
      bold: true,
      heading: null
    });

    currentIndex = match.index + match[0].length;
  }

  // 添加剩余文本
  if (currentIndex < line.length) {
    segments.push({
      text: line.substring(currentIndex),
      bold: false,
      heading: null
    });
  }

  // 如果没有任何标记，返回整行
  if (segments.length === 0) {
    segments.push({ text: line, bold: false, heading: null });
  }

  return segments;
}

/**
 * 将代码行按页分组
 * @param {object} context - PDF 上下文
 * @param {Array} wrappedLines - 包装后的代码行
 * @returns {Array} - 分组后的行 [{page, startY, lines: [...]}]
 */
export function groupCodeLinesByPage(context, wrappedLines) {
  const { pdf } = context;
  const groups = [];
  let currentGroup = null;
  const bottomLimit = PDF_STYLES.PAGE_HEIGHT - PDF_STYLES.MARGIN_BOTTOM;

  let simulatedY = context.currentY;
  let simulatedPage = pdf.internal.getCurrentPageInfo().pageNumber;

  wrappedLines.forEach((line) => {
    // 检查是否需要换页
    if (simulatedY + PDF_STYLES.FONT_SIZE_CODE > bottomLimit) {
      simulatedPage++;
      simulatedY = PDF_STYLES.MARGIN_TOP;
      currentGroup = null; // 开始新组
    }

    // 如果没有当前组或换页了，创建新组
    if (!currentGroup || currentGroup.page !== simulatedPage) {
      currentGroup = {
        page: simulatedPage,
        startY: simulatedY,
        lines: []
      };
      groups.push(currentGroup);
    }

    // 添加行到当前组
    currentGroup.lines.push(line);
    simulatedY += PDF_STYLES.LINE_HEIGHT;
  });

  return groups;
}

/**
 * 渲染 Markdown 格式文本
 * @param {object} context - PDF 上下文
 * @param {string} text - Markdown 文本
 * @param {number} maxWidth - 最大宽度
 * @param {function} cleanText - 文本清理函数
 * @param {function} checkPageBreak - 分页检查函数
 * @param {function} renderInlineSegments - 行内片段渲染函数
 * @param {function} parseInlineMarkdown - 行内 Markdown 解析函数
 */
export function renderMarkdownText(context, text, maxWidth, cleanText, checkPageBreak, renderInlineSegments, parseInlineMarkdown) {
  if (!text || text.trim().length === 0) {
    context.currentY += PDF_STYLES.LINE_HEIGHT;
    return;
  }

  const cleanedText = cleanText(text);
  if (!cleanedText || cleanedText.trim().length === 0) {
    context.currentY += PDF_STYLES.LINE_HEIGHT;
    return;
  }

  // 按行分割
  const lines = cleanedText.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 空行
    if (!line || line.trim().length === 0) {
      context.currentY += PDF_STYLES.LINE_HEIGHT * 0.5;
      continue;
    }

    // Markdown 标题 (# ## ### 等)
    if (line.match(/^#{1,6}\s+/)) {
      renderMarkdownHeading(context, line, maxWidth, cleanText, checkPageBreak, renderInlineSegments, parseInlineMarkdown);
      continue;
    }

    // Markdown 引用 (> 开头)
    if (line.match(/^>\s+/)) {
      renderMarkdownQuote(context, line, maxWidth, cleanText, checkPageBreak, renderInlineSegments, parseInlineMarkdown);
      continue;
    }

    // Markdown 列表 (- * + 开头，或数字列表)
    if (line.match(/^[\s]*[-*+]\s+/) || line.match(/^[\s]*\d+\.\s+/)) {
      renderMarkdownList(context, line, maxWidth, cleanText, checkPageBreak, renderInlineSegments, parseInlineMarkdown);
      continue;
    }

    // 普通文本（支持行内格式）
    renderMarkdownInlineFormats(context, line, maxWidth, checkPageBreak, renderInlineSegments, parseInlineMarkdown);
  }
}

/**
 * 渲染 Markdown 标题
 */
export function renderMarkdownHeading(context, line, maxWidth, cleanText, checkPageBreak, renderInlineSegments, parseInlineMarkdown) {
  const { pdf, chineseFontName, availableFontWeights } = context;
  const match = line.match(/^(#{1,6})\s+(.+)$/);
  if (!match) return;

  const level = match[1].length;
  const text = match[2];

  // 根据级别设置字号
  const fontSizes = [16, 14, 12, 11, 10, 10]; // H1-H6
  const fontSize = fontSizes[level - 1] || PDF_STYLES.FONT_SIZE_BODY;

  checkPageBreak(context, fontSize + PDF_STYLES.LINE_HEIGHT);

  pdf.setFontSize(fontSize);

  // 尝试使用粗体
  if (availableFontWeights.includes('bold')) {
    pdf.setFont(chineseFontName, 'bold');
  } else {
    pdf.setFont(chineseFontName, 'normal');
  }

  pdf.setTextColor(...PDF_STYLES.COLOR_TEXT);

  // 解析行内格式
  const segments = parseInlineMarkdown(text);
  renderInlineSegments(context, segments, maxWidth, cleanText, checkPageBreak);

  // 恢复默认样式
  pdf.setFont(chineseFontName, 'normal');
  pdf.setFontSize(PDF_STYLES.FONT_SIZE_BODY);
  context.currentY += PDF_STYLES.LINE_HEIGHT * 0.5;
}

/**
 * 渲染 Markdown 引用块
 */
export function renderMarkdownQuote(context, line, maxWidth, cleanText, checkPageBreak, renderInlineSegments, parseInlineMarkdown) {
  const { pdf } = context;
  const match = line.match(/^>\s+(.+)$/);
  if (!match) return;

  const text = match[1];

  checkPageBreak(context, PDF_STYLES.FONT_SIZE_BODY + 10);

  // 绘制引用样式（左侧竖线）
  pdf.setDrawColor(150, 150, 150);
  pdf.setLineWidth(1);
  pdf.line(
    PDF_STYLES.MARGIN_LEFT,
    context.currentY - 3,
    PDF_STYLES.MARGIN_LEFT,
    context.currentY + 3
  );

  // 引用文本缩进
  const originalMarginLeft = PDF_STYLES.MARGIN_LEFT;
  PDF_STYLES.MARGIN_LEFT += 5;

  pdf.setFontSize(PDF_STYLES.FONT_SIZE_BODY);
  pdf.setTextColor(80, 80, 80);

  // 解析行内格式
  const segments = parseInlineMarkdown(text);
  renderInlineSegments(context, segments, maxWidth - 5, cleanText, checkPageBreak);

  // 恢复边距
  PDF_STYLES.MARGIN_LEFT = originalMarginLeft;
  pdf.setTextColor(...PDF_STYLES.COLOR_TEXT);
}

/**
 * 渲染 Markdown 列表
 */
export function renderMarkdownList(context, line, maxWidth, cleanText, checkPageBreak, renderInlineSegments, parseInlineMarkdown) {
  const { pdf } = context;

  // 解析列表标记
  let match = line.match(/^([\s]*)([-*+])\s+(.+)$/);  // 无序列表
  if (!match) {
    match = line.match(/^([\s]*)(\d+\.)\s+(.+)$/);    // 有序列表
  }
  if (!match) return;

  const indent = match[1].length;
  const marker = match[2];
  const text = match[3];

  checkPageBreak(context, PDF_STYLES.FONT_SIZE_BODY + 5);

  pdf.setFontSize(PDF_STYLES.FONT_SIZE_BODY);
  pdf.setTextColor(...PDF_STYLES.COLOR_TEXT);

  // 缩进
  const indentWidth = indent * 2;
  const markerX = PDF_STYLES.MARGIN_LEFT + indentWidth;

  // 渲染列表标记
  pdf.text(marker, markerX, context.currentY);

  // 列表内容缩进
  const originalMarginLeft = PDF_STYLES.MARGIN_LEFT;
  PDF_STYLES.MARGIN_LEFT = markerX + 7;

  // 解析行内格式
  const segments = parseInlineMarkdown(text);
  renderInlineSegments(context, segments, maxWidth - indentWidth - 7, cleanText, checkPageBreak);

  // 恢复边距
  PDF_STYLES.MARGIN_LEFT = originalMarginLeft;
}

/**
 * 渲染包含行内格式的 Markdown 文本
 */
export function renderMarkdownInlineFormats(context, line, maxWidth, checkPageBreak, renderInlineSegments, parseInlineMarkdown) {
  checkPageBreak(context, PDF_STYLES.FONT_SIZE_BODY);

  // 解析行内格式（粗体、斜体、行内代码等）
  const segments = parseInlineMarkdown(line);

  // 渲染片段
  context.pdf.setFontSize(PDF_STYLES.FONT_SIZE_BODY);
  context.pdf.setTextColor(...PDF_STYLES.COLOR_TEXT);

  renderInlineSegments(context, segments, maxWidth, context.cleanText, checkPageBreak);
}

/**
 * 解析行内 Markdown 格式
 * 支持：**粗体**、*斜体*、`行内代码`、[链接](url)
 * @param {string} text - 原始文本
 * @returns {Array} - 片段数组 [{type, text, url}]
 */
export function parseInlineMarkdown(text) {
  const segments = [];
  let currentIndex = 0;

  // 正则表达式（按优先级排序）
  const patterns = [
    { type: 'code', regex: /`([^`]+)`/g },              // 行内代码
    { type: 'link', regex: /\[([^\]]+)\]\(([^)]+)\)/g }, // 链接
    { type: 'bold', regex: /\*\*([^*]+)\*\*/g },        // 粗体
    { type: 'italic', regex: /\*([^*]+)\*/g },          // 斜体
  ];

  // 收集所有匹配
  const matches = [];
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      matches.push({
        type: pattern.type,
        start: match.index,
        end: match.index + match[0].length,
        text: match[1],
        url: pattern.type === 'link' ? match[2] : null
      });
    }
  });

  // 按起始位置排序
  matches.sort((a, b) => a.start - b.start);

  // 过滤重叠的匹配（保留外层）
  const filteredMatches = [];
  let lastEnd = 0;
  matches.forEach(m => {
    if (m.start >= lastEnd) {
      filteredMatches.push(m);
      lastEnd = m.end;
    }
  });

  // 构建片段数组
  currentIndex = 0;
  filteredMatches.forEach(m => {
    // 添加匹配前的普通文本
    if (m.start > currentIndex) {
      segments.push({
        type: 'text',
        text: text.substring(currentIndex, m.start)
      });
    }

    // 添加格式化文本
    segments.push(m);
    currentIndex = m.end;
  });

  // 添加最后的普通文本
  if (currentIndex < text.length) {
    segments.push({
      type: 'text',
      text: text.substring(currentIndex)
    });
  }

  // 如果没有任何格式，返回整个文本
  if (segments.length === 0) {
    segments.push({ type: 'text', text: text });
  }

  return segments;
}

/**
 * 渲染thinking区块
 */
export function renderThinking(context, thinking, cleanText, checkPageBreak) {
  renderSection(context, '💭 Thinking', thinking, PDF_STYLES.COLOR_SECTION_BG, cleanText, checkPageBreak);
}

/**
 * 渲染Artifact
 */
export function renderArtifact(context, artifact, cleanText, checkPageBreak) {
  const title = `📄 Artifact: ${artifact.title || 'Untitled'}`;
  const content = artifact.content || '';
  renderSection(context, title, content, PDF_STYLES.COLOR_SECTION_BG, cleanText, checkPageBreak);
}

/**
 * 渲染工具调用
 */
export function renderTool(context, tool, cleanText, checkPageBreak) {
  const title = `🔧 Tool: ${tool.name || 'Unknown'}`;
  const content = `Input: ${JSON.stringify(tool.input, null, 2)}\n\nOutput: ${tool.output || 'N/A'}`;
  renderSection(context, title, content, PDF_STYLES.COLOR_SECTION_BG, cleanText, checkPageBreak);
}

/**
 * 渲染引用
 */
export function renderCitations(context, citations, cleanText, checkPageBreak) {
  const title = '📚 Citations';
  const content = citations.map((cit, i) =>
    `[${i + 1}] ${cit.title || cit.url || 'Unknown'}`
  ).join('\n');
  renderSection(context, title, content, PDF_STYLES.COLOR_SECTION_BG, cleanText, checkPageBreak);
}

/**
 * 渲染附件
 */
export function renderAttachments(context, attachments, cleanText, checkPageBreak) {
  const title = '📎 Attachments';
  const content = attachments.map((att, i) =>
    `[${i + 1}] ${att.file_name || att.name || 'file'} (${att.file_type || att.type || 'unknown'})`
  ).join('\n');
  renderSection(context, title, content, PDF_STYLES.COLOR_SECTION_BG, cleanText, checkPageBreak);
}

/**
 * 通用区块渲染(带背景)
 * @param {object} context - PDF 上下文
 * @param {string} title - 区块标题
 * @param {string} content - 区块内容
 * @param {Array} bgColor - 背景颜色 RGB
 * @param {function} cleanText - 文本清理函数
 * @param {function} checkPageBreak - 分页检查函数
 */
export function renderSection(context, title, content, bgColor, cleanText, checkPageBreak) {
  const { pdf } = context;
  checkPageBreak(context, PDF_STYLES.FONT_SIZE_H2 + PDF_STYLES.SECTION_SPACING * 2);

  const maxWidth = PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_LEFT - PDF_STYLES.MARGIN_RIGHT;

  // 清理标题和内容
  const cleanTitle = cleanText(title);
  const cleanContent = cleanText(content);

  // 处理内容换行,带错误处理
  let contentLines;
  try {
    contentLines = pdf.splitTextToSize(cleanContent, maxWidth - 4);
  } catch (error) {
    console.error('[PDF导出] 区块内容分割失败:', error);
    contentLines = cleanContent.split('\n');
  }

  const bgHeight = PDF_STYLES.LINE_HEIGHT * (contentLines.length + 2);

  // 绘制背景
  pdf.setFillColor(...bgColor);
  pdf.rect(
    PDF_STYLES.MARGIN_LEFT,
    context.currentY - 3,
    maxWidth,
    bgHeight,
    'F'
  );

  // 渲染标题
  pdf.setFontSize(PDF_STYLES.FONT_SIZE_H2);
  pdf.setTextColor(...PDF_STYLES.COLOR_TEXT);
  if (cleanTitle && cleanTitle.trim().length > 0) {
    pdf.text(cleanTitle, PDF_STYLES.MARGIN_LEFT + 2, context.currentY);
  }
  context.currentY += PDF_STYLES.LINE_HEIGHT * 1.2;

  // 渲染内容
  pdf.setFontSize(PDF_STYLES.FONT_SIZE_BODY);
  contentLines.forEach(line => {
    checkPageBreak(context, PDF_STYLES.FONT_SIZE_BODY);
    const cleanLine = cleanText(line);
    if (cleanLine && cleanLine.trim().length > 0) {
      pdf.text(cleanLine, PDF_STYLES.MARGIN_LEFT + 2, context.currentY);
    }
    context.currentY += PDF_STYLES.LINE_HEIGHT;
  });

  context.currentY += PDF_STYLES.SECTION_SPACING;
}

/**
 * 解析文本中的代码块（移除了 LaTeX 支持）
 * @param {string} text - 原始文本
 * @returns {Array} - 部分数组 [{type, content, language}]
 */
export function parseTextWithCodeBlocks(text) {
  const parts = [];
  const codeBlockRegex = /```([^\n]*?)\s*\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // 添加代码块前的文本
    if (match.index > lastIndex) {
      const plainText = text.substring(lastIndex, match.index);
      if (plainText.trim()) {
        parts.push({ type: 'text', content: plainText });
      }
    }

    // 添加代码块
    const language = (match[1] || '').trim();
    parts.push({
      type: 'code',
      language: language,
      content: match[2]
    });

    lastIndex = match.index + match[0].length;
  }

  // 添加最后的文本
  if (lastIndex < text.length) {
    const plainText = text.substring(lastIndex);
    if (plainText.trim()) {
      parts.push({ type: 'text', content: plainText });
    }
  }

  // 如果没有代码块，返回整个文本
  if (parts.length === 0) {
    parts.push({ type: 'text', content: text });
  }

  return parts;
}
