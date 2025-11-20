// utils/export/pdfTextHelpers.js
// PDF 文本处理和页面管理助手
//
// 职责：
// - 文本清理和Unicode标准化
// - 安全字体操作
// - 内联样式渲染（粗体、斜体、代码、链接）
// - 页面管理（分页、页脚、书签、目录）

/**
 * PDF样式配置
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
  FONT_SIZE_HEADER: 8,
  FONT_SIZE_FOOTER: 8,

  // 颜色 (RGB)
  COLOR_SENDER_HUMAN: [0, 102, 204],      // 蓝色
  COLOR_SENDER_ASSISTANT: [102, 102, 102], // 灰色
  COLOR_TIMESTAMP: [150, 150, 150],        // 浅灰
  COLOR_CODE_BG: [245, 245, 245],          // 代码背景
  COLOR_SECTION_BG: [250, 250, 250],       // 区块背景
  COLOR_TEXT: [0, 0, 0],                   // 黑色文本
  COLOR_HEADER: [100, 100, 100],           // 页眉颜色
  COLOR_FOOTER: [150, 150, 150],           // 页脚颜色
  COLOR_BORDER: [200, 200, 200],           // 边框颜色

  // 间距
  MARGIN_LEFT: 15,
  MARGIN_RIGHT: 15,
  MARGIN_TOP: 15,    // 顶部边距（移除页眉，增加空间利用率）
  MARGIN_BOTTOM: 25, // 底部边距为页脚留空间
  LINE_HEIGHT: 5,
  SECTION_SPACING: 8,
  MESSAGE_SPACING: 10,
  FOOTER_HEIGHT: 15, // 页脚高度

  // 页面
  PAGE_WIDTH: 210, // A4 宽度(mm)
  PAGE_HEIGHT: 297, // A4 高度(mm)
};

/**
 * 清理和标准化文本，防止编码问题
 * @param {string} text - 原始文本
 * @returns {string} - 清理后的文本
 */
export function cleanText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  try {
    // 1. Unicode 标准化（NFC 模式）
    let cleaned = text.normalize('NFC');

    // 2. 移除控制字符和不可打印字符（保留换行符和制表符）
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

    // 3. 处理常见的Latin连字（ligatures），将其转换回普通字符组合
    const ligatureMap = {
      '\uFB00': 'ff',    // ﬀ
      '\uFB01': 'fi',    // ﬁ
      '\uFB02': 'fl',    // ﬂ
      '\uFB03': 'ffi',   // ﬃ
      '\uFB04': 'ffl',   // ﬄ
      '\uFB05': 'st',    // ﬅ
      '\uFB06': 'st',    // ﬆ
      '\u00C6': 'AE',    // Æ
      '\u00E6': 'ae',    // æ
      '\u0152': 'OE',    // Œ
      '\u0153': 'oe',    // œ
      '\u00DF': 'ss',    // ß
      '\u1E9E': 'SS',    // ẞ
    };

    // 批量替换连字
    for (const [ligature, replacement] of Object.entries(ligatureMap)) {
      cleaned = cleaned.replace(new RegExp(ligature, 'g'), replacement);
    }

    // 4. 处理特殊Unicode字符（可能导致jsPDF问题）
    // 移除零宽字符
    cleaned = cleaned.replace(/[\u200B-\u200F\u2060\uFEFF]/g, '');

    // 5. 注意：不再移除私人使用区字符，因为某些字体可能使用这些区域
    // 如果确实需要移除，应该更精确地处理
    // cleaned = cleaned.replace(/[\uE000-\uF8FF]/g, ''); // 注释掉这行，防止删除有用的特殊字符

    // 6. 标准化引号和标点符号（修复乱码问题）
    // 将各种引号统一为标准ASCII引号或中文引号
    const quoteMap = {
      // 英文引号标准化
      '\u201C': '"',  // " (左双引号) -> "
      '\u201D': '"',  // " (右双引号) -> "
      '\u2018': "'",  // ' (左单引号) -> '
      '\u2019': "'",  // ' (右单引号) -> '
      '\u2033': '"',  // ″ (双撇号) -> "
      '\u2032': "'",  // ′ (单撇号) -> '

      // 中文引号保持原样（字体应该支持）
      // '\u300C': '「', // 「
      // '\u300D': '」', // 」
      // '\u300E': '『', // 『
      // '\u300F': '』', // 』

      // 其他标点标准化
      '\u2014': '--', // — (em dash) -> --
      '\u2013': '-',  // – (en dash) -> -
      '\u2026': '...', // … (省略号) -> ...
      '\u2022': '·',  // • (项目符号) -> ·
      '\u00B7': '·',  // · (中点)

      // 星号标准化
      '\u2217': '*',  // ∗ (星号运算符) -> *
      '\u2731': '*',  // ✱ (粗星号) -> *
      '\u2732': '*',  // ✲ (开放中心星号) -> *
      '\u2605': '*',  // ★ (黑色星号) -> *
      '\u2606': '*',  // ☆ (白色星号) -> *

      // 加号标准化
      '\u2795': '+',  // ➕ (粗加号) -> +
      '\uFF0B': '+',  // ＋ (全角加号) -> +
    };

    // 批量替换
    for (const [from, to] of Object.entries(quoteMap)) {
      cleaned = cleaned.replace(new RegExp(from, 'g'), to);
    }

    // 7. 处理全角字符转半角（可选，根据需要）
    // 全角数字和字母转半角
    cleaned = cleaned.replace(/[\uFF10-\uFF19]/g, (ch) => {
      return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
    });
    cleaned = cleaned.replace(/[\uFF21-\uFF3A]/g, (ch) => {
      return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
    });
    cleaned = cleaned.replace(/[\uFF41-\uFF5A]/g, (ch) => {
      return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
    });

    // 全角空格转半角
    cleaned = cleaned.replace(/\u3000/g, ' ');

    return cleaned;
  } catch (error) {
    console.error('[PDF导出] 文本清理失败:', error);
    // 如果清理失败，返回简化处理的文本
    return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }
}

/**
 * 安全地设置字体，如果字体变体不可用则自动回退
 * @param {Object} context - 上下文对象 { pdf, chineseFontName, availableFontWeights }
 * @param {string} fontName - 字体名称
 * @param {string} fontStyle - 字体样式 (normal, bold, light, italic, bolditalic)
 * @returns {boolean} - 是否成功设置
 */
export function safeSetFont(context, fontName, fontStyle = 'normal') {
  try {
    // 如果请求的样式可用，直接使用
    if (context.availableFontWeights.includes(fontStyle)) {
      context.pdf.setFont(fontName, fontStyle);
      return true;
    }

    // 字体变体不可用，进行智能回退
    console.warn(`[PDF导出] 字体变体 ${fontStyle} 不可用，尝试回退...`);

    // 回退策略
    if (fontStyle === 'bold' || fontStyle === 'bolditalic') {
      // 粗体：优先尝试 normal，如果没有则用第一个可用的
      if (context.availableFontWeights.includes('normal')) {
        context.pdf.setFont(fontName, 'normal');
        console.log(`[PDF导出] ✓ 回退到 normal 字体`);
        return false; // 返回 false 表示使用了回退
      }
    }

    if (fontStyle === 'italic' || fontStyle === 'bolditalic') {
      // 斜体：中文字体通常没有斜体，回退到 light 或 normal
      if (context.availableFontWeights.includes('light')) {
        context.pdf.setFont(fontName, 'light');
        console.log(`[PDF导出] ✓ 斜体回退到 light 字体`);
        return false;
      } else if (context.availableFontWeights.includes('normal')) {
        context.pdf.setFont(fontName, 'normal');
        console.log(`[PDF导出] ✓ 斜体回退到 normal 字体`);
        return false;
      }
    }

    // 默认回退：使用第一个可用的字体变体
    if (context.availableFontWeights.length > 0) {
      const fallbackStyle = context.availableFontWeights[0];
      context.pdf.setFont(fontName, fallbackStyle);
      console.log(`[PDF导出] ✓ 回退到 ${fallbackStyle} 字体`);
      return false;
    }

    // 最终回退：使用 normal
    context.pdf.setFont(fontName, 'normal');
    console.log(`[PDF导出] ✓ 回退到 normal 字体`);
    return false;
  } catch (error) {
    console.error(`[PDF导出] 设置字体失败:`, error);
    // 最后的保险：使用默认字体
    context.pdf.setFont(fontName || context.chineseFontName);
    return false;
  }
}

/**
 * 安全地获取文本宽度，处理字体元数据缺失的情况
 * @param {Object} context - 上下文对象 { pdf, chineseFontName, availableFontWeights }
 * @param {string} text - 要测量的文本
 * @returns {number} - 文本宽度
 */
export function safeGetTextWidth(context, text) {
  if (!text || typeof text !== 'string') {
    return 0;
  }

  try {
    // 检查当前字体是否有 Unicode 元数据
    const font = context.pdf.getFont();
    if (!font.metadata || !font.metadata.Unicode) {
      const currentStyle = font.fontStyle || 'normal';
      console.warn(`[PDF导出] 当前字体 (${currentStyle}) 缺少 Unicode 元数据`);

      // 只在非normal字体时回退
      if (currentStyle !== 'normal') {
        console.log('[PDF导出] 回退到 normal 字体');
        safeSetFont(context, context.chineseFontName, 'normal');
        // 重新尝试获取宽度
        return context.pdf.getTextWidth(text);
      } else {
        // normal字体也有问题，使用近似值
        console.warn('[PDF导出] normal 字体也缺少元数据，使用近似计算');
        const fontSize = context.pdf.getFontSize();
        return text.length * fontSize * 0.5;
      }
    }

    return context.pdf.getTextWidth(text);
  } catch (error) {
    console.error('[PDF导出] getTextWidth 失败:', error);
    // 如果失败，使用近似值：字符数 * 字体大小 * 0.5
    const fontSize = context.pdf.getFontSize();
    return text.length * fontSize * 0.5;
  }
}

/**
 * 安全地渲染文本，自动处理边界
 * @param {Object} context - 上下文对象
 * @param {string} text - 要渲染的文本
 * @param {number} x - X 坐标
 * @param {number} y - Y 坐标
 * @param {number} maxWidth - 最大宽度（可选）
 */
export function safeRenderText(context, text, x, y, maxWidth = null) {
  if (!text || typeof text !== 'string') {
    return;
  }

  const cleanedText = cleanText(text);
  if (!cleanedText) {
    return;
  }

  // 如果指定了 maxWidth，检查文本宽度
  if (maxWidth) {
    const textWidth = safeGetTextWidth(context, cleanedText);
    if (textWidth > maxWidth) {
      // 文本过长，进行截断并添加省略号
      console.warn('[PDF导出] 文本过长，将被截断:', cleanedText.substring(0, 50));
      // 尝试使用 splitTextToSize 拆分（只渲染第一行）
      try {
        const lines = context.pdf.splitTextToSize(cleanedText, maxWidth);
        if (lines.length > 0) {
          context.pdf.text(lines[0], x, y);
        }
      } catch (error) {
        // 如果失败，尝试简单截断
        let truncated = cleanedText;
        while (safeGetTextWidth(context, truncated + '...') > maxWidth && truncated.length > 0) {
          truncated = truncated.substring(0, truncated.length - 1);
        }
        context.pdf.text(truncated + '...', x, y);
      }
      return;
    }
  }

  // 文本长度合适，直接渲染
  context.pdf.text(cleanedText, x, y);
}

/**
 * 渲染纯文本(带自动换行)
 * @param {Object} context - 上下文对象
 * @param {string} text - 文本内容
 * @param {number} maxWidth - 最大宽度
 */
export function renderPlainText(context, text, maxWidth) {
  // 处理空文本
  if (!text || text.trim().length === 0) {
    context.currentY += PDF_STYLES.LINE_HEIGHT;
    return;
  }

  // 清理文本，防止编码问题
  const cleanedText = cleanText(text);

  if (!cleanedText || cleanedText.trim().length === 0) {
    console.warn('[PDF导出] 文本清理后为空，跳过');
    context.currentY += PDF_STYLES.LINE_HEIGHT;
    return;
  }

  // 使用 splitTextToSize 自动处理换行,支持Unicode字符
  let lines;
  try {
    lines = context.pdf.splitTextToSize(cleanedText, maxWidth);
  } catch (error) {
    console.error('[PDF导出] splitTextToSize失败，使用简单换行:', error);
    // 如果splitTextToSize失败,使用简单的换行逻辑
    lines = cleanedText.split('\n');
  }

  lines.forEach(line => {
    checkPageBreak(context, PDF_STYLES.FONT_SIZE_BODY);

    // 再次清理单行文本（防止splitTextToSize引入问题）
    const cleanLine = cleanText(line);
    if (cleanLine && cleanLine.trim().length > 0) {
      context.pdf.text(cleanLine, PDF_STYLES.MARGIN_LEFT, context.currentY);
    }
    context.currentY += PDF_STYLES.LINE_HEIGHT;
  });
}

/**
 * 应用中日韩标点避头尾规则
 * @param {Object} context - 上下文对象（这里实际不使用，保持签名一致）
 * @param {Array} lines - 文本行数组
 * @returns {Array} - 处理后的行数组
 */
export function applyCJKPunctuationRules(context, lines) {
  if (!lines || lines.length <= 1) return lines;

  // 不能出现在行首的标点（避头）
  const noLineStart = /^[。，、；：！？）》」』】"',.;:!?)}\]]/;
  // 不能出现在行尾的标点（避尾）
  const noLineEnd = /[（《「『【"'(\[{]$/;

  const result = [];
  let prevLine = lines[0];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i];

    // 检查当前行开头是否有不能在行首的标点
    if (noLineStart.test(currentLine)) {
      // 将标点移到上一行末尾
      const punct = currentLine[0];
      prevLine = prevLine + punct;
      lines[i] = currentLine.substring(1);
      continue;
    }

    // 检查上一行结尾是否有不能在行尾的标点
    if (noLineEnd.test(prevLine)) {
      // 将标点移到当前行开头
      const punct = prevLine[prevLine.length - 1];
      prevLine = prevLine.substring(0, prevLine.length - 1);
      lines[i] = punct + currentLine;
    }

    result.push(prevLine);
    prevLine = lines[i];
  }

  result.push(prevLine);
  return result;
}

/**
 * 渲染内联片段
 * @param {Object} context - 上下文对象
 * @param {Array} segments - 片段数组
 * @param {number} maxWidth - 最大宽度
 */
export function renderInlineSegments(context, segments, maxWidth) {
  let currentX = PDF_STYLES.MARGIN_LEFT;
  let currentLineText = '';
  let currentLineSegments = [];

  segments.forEach((segment, idx) => {
    const text = cleanText(segment.text || '');
    if (!text) return;

    // 设置样式并测量宽度
    applySegmentStyle(context, segment.type);
    const textWidth = safeGetTextWidth(context, text);
    const availableWidth = PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_RIGHT - currentX;

    // 如果单个 segment 本身就超过可用宽度，需要拆分
    if (textWidth > availableWidth && currentLineSegments.length === 0) {
      // 这是新行的第一个 segment，但它太长了
      // 尝试使用 splitTextToSize 拆分
      try {
        const maxSegmentWidth = PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_LEFT - PDF_STYLES.MARGIN_RIGHT;
        let splitLines = context.pdf.splitTextToSize(text, maxSegmentWidth);
        // 应用中文标点避头尾规则
        splitLines = applyCJKPunctuationRules(context, splitLines);

        // 渲染除最后一行外的所有行
        for (let i = 0; i < splitLines.length - 1; i++) {
          checkPageBreak(context, PDF_STYLES.FONT_SIZE_BODY);
          currentLineSegments = [{
            ...segment,
            x: PDF_STYLES.MARGIN_LEFT,
            text: splitLines[i]
          }];
          renderSegmentLine(context, currentLineSegments);
          context.currentY += PDF_STYLES.LINE_HEIGHT;
        }

        // 最后一行准备与后续 segment 合并
        const lastLine = splitLines[splitLines.length - 1];
        const lastLineWidth = safeGetTextWidth(context, lastLine);
        currentLineSegments = [{
          ...segment,
          x: PDF_STYLES.MARGIN_LEFT,
          text: lastLine
        }];
        currentX = PDF_STYLES.MARGIN_LEFT + lastLineWidth;
      } catch (error) {
        console.warn('[PDF导出] 文本拆分失败，强制换行:', error);
        // 如果拆分失败，直接渲染（可能会超出边界，但至少不会崩溃）
        currentLineSegments.push({
          ...segment,
          x: currentX,
          text: text
        });
        currentX += textWidth;
      }
      return;
    }

    // 检查是否需要换行
    if (currentX + textWidth > PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_RIGHT && currentLineSegments.length > 0) {
      // 先检查是否需要分页
      checkPageBreak(context, PDF_STYLES.FONT_SIZE_BODY);

      // 渲染当前行
      renderSegmentLine(context, currentLineSegments);
      context.currentY += PDF_STYLES.LINE_HEIGHT;

      // 重置行状态
      currentX = PDF_STYLES.MARGIN_LEFT;
      currentLineSegments = [];

      // 重新检查新行上这个 segment 是否超出边界
      if (textWidth > maxWidth) {
        // 即使在新行，segment 仍然太长，需要拆分
        try {
          let splitLines = context.pdf.splitTextToSize(text, maxWidth);
          // 应用中文标点避头尾规则
          splitLines = applyCJKPunctuationRules(context, splitLines);
          for (let i = 0; i < splitLines.length - 1; i++) {
            checkPageBreak(context, PDF_STYLES.FONT_SIZE_BODY);
            const tempSegments = [{
              ...segment,
              x: PDF_STYLES.MARGIN_LEFT,
              text: splitLines[i]
            }];
            renderSegmentLine(context, tempSegments);
            context.currentY += PDF_STYLES.LINE_HEIGHT;
          }
          // 最后一行
          const lastLine = splitLines[splitLines.length - 1];
          const lastLineWidth = safeGetTextWidth(context, lastLine);
          currentLineSegments = [{
            ...segment,
            x: PDF_STYLES.MARGIN_LEFT,
            text: lastLine
          }];
          currentX = PDF_STYLES.MARGIN_LEFT + lastLineWidth;
        } catch (error) {
          console.warn('[PDF导出] 文本拆分失败:', error);
          currentLineSegments.push({
            ...segment,
            x: currentX,
            text: text
          });
          currentX += textWidth;
        }
        return;
      }
    }

    // 添加到当前行
    currentLineSegments.push({
      ...segment,
      x: currentX,
      text: text
    });
    currentX += textWidth;
  });

  // 渲染最后一行
  if (currentLineSegments.length > 0) {
    checkPageBreak(context, PDF_STYLES.FONT_SIZE_BODY);
    renderSegmentLine(context, currentLineSegments);
    context.currentY += PDF_STYLES.LINE_HEIGHT;
  }

  // 恢复默认样式
  context.pdf.setFont(context.chineseFontName, 'normal');
  context.pdf.setTextColor(...PDF_STYLES.COLOR_TEXT);
}

/**
 * 渲染一行segment
 * @param {Object} context - 上下文对象
 * @param {Array} segments - 片段数组
 */
export function renderSegmentLine(context, segments) {
  segments.forEach(segment => {
    applySegmentStyle(context, segment.type);

    if (segment.type === 'link') {
      // 渲染链接（添加下划线）
      context.pdf.textWithLink(segment.text, segment.x, context.currentY, {
        url: segment.url || '#'
      });
      // 绘制下划线
      const textWidth = safeGetTextWidth(context, segment.text);
      context.pdf.line(segment.x, context.currentY + 0.5, segment.x + textWidth, context.currentY + 0.5);
    } else if (segment.type === 'code') {
      // 渲染行内代码（添加背景色）
      // 注意：字体和颜色已经在 applySegmentStyle 中设置，这里只添加背景
      const textWidth = safeGetTextWidth(context, segment.text);
      const padding = 1;
      context.pdf.setFillColor(245, 245, 245);
      context.pdf.rect(segment.x - padding, context.currentY - 3, textWidth + padding * 2, 4, 'F');
      // 不要重新设置颜色和字体，使用 applySegmentStyle 中已设置的
      context.pdf.text(segment.text, segment.x, context.currentY);
    } else {
      // 普通文本
      context.pdf.text(segment.text, segment.x, context.currentY);
    }
  });
}

/**
 * 应用segment样式
 * @param {Object} context - 上下文对象
 * @param {string} type - 样式类型
 */
export function applySegmentStyle(context, type) {
  context.pdf.setFontSize(PDF_STYLES.FONT_SIZE_BODY);
  context.pdf.setTextColor(...PDF_STYLES.COLOR_TEXT);

  switch (type) {
    case 'bold':
      console.log('[PDF导出] 应用粗体样式, 字体:', context.chineseFontName, '可用变体:', context.availableFontWeights);
      // 使用粗体字体（如果可用，否则自动回退）
      const boldSuccess = safeSetFont(context, context.chineseFontName, 'bold');
      console.log('[PDF导出] safeSetFont 返回:', boldSuccess);
      if (!boldSuccess) {
        // 如果粗体字体不可用，使用明显的视觉区分
        console.warn('[PDF导出] 粗体字体不可用，使用视觉回退方案: 深蓝色 RGB(20,20,150) + 字体大小', PDF_STYLES.FONT_SIZE_BODY + 1);
        // 使用深蓝色 + 增大字体来明显区分粗体
        context.pdf.setTextColor(20, 20, 150); // 深蓝色，非常明显
        context.pdf.setFontSize(PDF_STYLES.FONT_SIZE_BODY + 1); // 增加1pt，更明显
      } else {
        console.log('[PDF导出] 使用字体粗体变体');
      }
      break;
    case 'italic':
      // 使用 light 字体表示斜体（中文字体通常没有真正的斜体）
      const lightSuccess = safeSetFont(context, context.chineseFontName, 'light');
      if (!lightSuccess) {
        // 如果没有 light，用颜色区分
        context.pdf.setTextColor(70, 130, 180); // 蓝色表示强调
      }
      break;
    case 'bold-italic':
      // 粗斜体：尝试使用 bold，如果没有则用 normal + 颜色
      const boldItalicSuccess = safeSetFont(context, context.chineseFontName, 'bolditalic');
      if (!boldItalicSuccess) {
        // 回退：尝试只用 bold
        const boldOnlySuccess = safeSetFont(context, context.chineseFontName, 'bold');
        if (!boldOnlySuccess) {
          // bold 也不可用，使用深蓝色区分
          context.pdf.setTextColor(30, 60, 120); // 深蓝色（粗体+斜体）
          context.pdf.setFontSize(PDF_STYLES.FONT_SIZE_BODY + 0.5);
        } else {
          // bold 可用，添加颜色表示斜体
          context.pdf.setTextColor(70, 130, 180); // 蓝色表示斜体
        }
      }
      break;
    case 'code':
      context.pdf.setFont('courier', 'normal');
      context.pdf.setFontSize(PDF_STYLES.FONT_SIZE_CODE);
      context.pdf.setTextColor(220, 50, 50);
      break;
    case 'link':
      // 使用 light 字体和蓝色表示链接
      const linkLightSuccess = safeSetFont(context, context.chineseFontName, 'light');
      if (!linkLightSuccess) {
        safeSetFont(context, context.chineseFontName, 'normal');
      }
      context.pdf.setTextColor(0, 102, 204); // 蓝色
      break;
    default:
      safeSetFont(context, context.chineseFontName, 'normal');
  }
}

/**
 * 检查是否需要分页
 * @param {Object} context - 上下文对象
 * @param {number} requiredSpace - 需要的空间（默认20）
 */
export function checkPageBreak(context, requiredSpace = 20) {
  const bottomLimit = PDF_STYLES.PAGE_HEIGHT - PDF_STYLES.MARGIN_BOTTOM;

  if (context.currentY + requiredSpace > bottomLimit) {
    context.pdf.addPage();
    context.currentY = PDF_STYLES.MARGIN_TOP;
  }
}

/**
 * 渲染页脚
 * @param {Object} context - 上下文对象
 * @param {number} pageNumber - 当前页码
 * @param {number} totalPages - 总页数
 */
export function renderFooter(context, pageNumber, totalPages) {
  const originalY = context.currentY;
  const originalFontSize = context.pdf.internal.getFontSize();

  // 设置页脚样式
  context.pdf.setFontSize(PDF_STYLES.FONT_SIZE_FOOTER);
  context.pdf.setTextColor(...PDF_STYLES.COLOR_FOOTER);

  const footerY = PDF_STYLES.PAGE_HEIGHT - 10;

  // 绘制页脚上方的分隔线
  context.pdf.setDrawColor(...PDF_STYLES.COLOR_BORDER);
  context.pdf.setLineWidth(0.1);
  context.pdf.line(
    PDF_STYLES.MARGIN_LEFT,
    PDF_STYLES.PAGE_HEIGHT - PDF_STYLES.FOOTER_HEIGHT,
    PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_RIGHT,
    PDF_STYLES.PAGE_HEIGHT - PDF_STYLES.FOOTER_HEIGHT
  );

  // 左侧显示导出时间
  const exportText = `Exported: ${context.exportDate}`;
  context.pdf.text(exportText, PDF_STYLES.MARGIN_LEFT, footerY);

  // 右侧显示页码
  const pageText = `${pageNumber} / ${totalPages}`;
  const pageTextWidth = safeGetTextWidth(context, pageText);
  context.pdf.text(pageText, PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_RIGHT - pageTextWidth, footerY);

  // 恢复原始设置
  context.pdf.setFontSize(originalFontSize);
  context.pdf.setTextColor(...PDF_STYLES.COLOR_TEXT);
  context.currentY = originalY;
}

/**
 * 添加PDF书签（outline）
 * @param {Object} context - 上下文对象
 */
export function addBookmarks(context) {
  if (!context.messageAnchors || context.messageAnchors.length === 0) return;

  // jsPDF的outline功能
  // 创建书签树结构
  try {
    context.messageAnchors.forEach((anchor) => {
      const sender = anchor.sender === 'human' ? 'Human' : 'Assistant';
      const title = `${anchor.index}. ${sender}`;

      // 使用jsPDF的outline API
      // 注意：jsPDF的outline功能可能需要插件支持
      if (context.pdf.outline) {
        context.pdf.outline.add(null, title, { pageNumber: anchor.page });
      }
    });
  } catch (error) {
    console.warn('[PDF导出] 书签添加失败（可能不支持）:', error);
  }
}

/**
 * 为所有页面添加页脚
 * @param {Object} context - 上下文对象
 */
export function addFooters(context) {
  const totalPages = context.pdf.internal.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    context.pdf.setPage(i);
    renderFooter(context, i, totalPages);
  }
}

/**
 * 渲染目录（Table of Contents）带页码链接
 * @param {Object} context - 上下文对象
 * @param {number} tocPage - 目录所在页码
 * @param {Array} messages - 消息列表
 */
export function renderTOCWithLinks(context, tocPage, messages) {
  // 切换到目录页
  context.pdf.setPage(tocPage);
  context.currentY = PDF_STYLES.MARGIN_TOP;

  // 渲染目录标题
  context.pdf.setFontSize(PDF_STYLES.FONT_SIZE_H1);
  context.pdf.setTextColor(...PDF_STYLES.COLOR_TEXT);
  context.pdf.text('Table of Contents', PDF_STYLES.MARGIN_LEFT, context.currentY);
  context.currentY += PDF_STYLES.LINE_HEIGHT * 2;

  // 绘制标题下方的分隔线
  context.pdf.setDrawColor(...PDF_STYLES.COLOR_BORDER);
  context.pdf.setLineWidth(0.3);
  context.pdf.line(
    PDF_STYLES.MARGIN_LEFT,
    context.currentY,
    PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_RIGHT,
    context.currentY
  );
  context.currentY += PDF_STYLES.LINE_HEIGHT;

  // 渲染消息列表
  context.pdf.setFontSize(PDF_STYLES.FONT_SIZE_BODY);
  const maxWidth = PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_LEFT - PDF_STYLES.MARGIN_RIGHT;

  context.messageAnchors.forEach((anchor, idx) => {
    const message = messages[idx];
    if (!message) return;

    checkPageBreak(context, PDF_STYLES.FONT_SIZE_BODY * 2);

    const messageNumber = `${anchor.index}.`;
    const sender = anchor.sender === 'human' ? 'Human' : 'Assistant';

    // 获取消息预览（前50个字符）
    let preview = anchor.title || '';
    preview = cleanText(preview);
    preview = preview.replace(/\n/g, ' ').substring(0, 50);
    if (preview.length >= 50) {
      preview += '...';
    }

    // 添加分支标记
    let branchMarker = '';
    if (message.branchInfo?.isBranchPoint) {
      branchMarker = ` [Branch ${message.branchInfo.childCount}]`;
    }

    // 构建目录条目和页码
    const entry = `${messageNumber} ${sender}${branchMarker}`;
    const pageNum = `p.${anchor.page}`;

    // 设置发送者颜色
    const color = anchor.sender === 'human'
      ? PDF_STYLES.COLOR_SENDER_HUMAN
      : PDF_STYLES.COLOR_SENDER_ASSISTANT;
    context.pdf.setTextColor(...color);

    // 计算页码位置（右对齐）
    const pageNumWidth = safeGetTextWidth(context, pageNum);
    const pageNumX = PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_RIGHT - pageNumWidth;

    // 渲染条目（作为链接）
    const entryY = context.currentY;
    context.pdf.textWithLink(entry, PDF_STYLES.MARGIN_LEFT + 5, entryY, {
      pageNumber: anchor.page
    });

    // 渲染页码（也作为链接）
    context.pdf.setTextColor(...PDF_STYLES.COLOR_TIMESTAMP);
    context.pdf.textWithLink(pageNum, pageNumX, entryY, {
      pageNumber: anchor.page
    });

    // 渲染预览（如果有）
    if (preview) {
      context.pdf.setFontSize(PDF_STYLES.FONT_SIZE_TIMESTAMP);
      context.pdf.setTextColor(...PDF_STYLES.COLOR_TIMESTAMP);
      context.currentY += PDF_STYLES.LINE_HEIGHT;
      checkPageBreak(context, PDF_STYLES.FONT_SIZE_TIMESTAMP);
      context.pdf.text(preview, PDF_STYLES.MARGIN_LEFT + 10, context.currentY);
      context.pdf.setFontSize(PDF_STYLES.FONT_SIZE_BODY);
    }

    context.currentY += PDF_STYLES.LINE_HEIGHT * 1.5;
  });
}
