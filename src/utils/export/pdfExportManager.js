// utils/export/pdfExportManager.js
// PDF导出管理器 - 核心导出逻辑
//
// 重构说明：
// - 移除了 LaTeX 渲染功能（不可用）
// - 代码块和 Markdown 渲染已移至 pdfContentRenderers.js
// - 文本处理和页面管理已移至 pdfTextHelpers.js
// - 字体处理保留在 pdfFontHelper.js
//
// 当前职责：
// - 导出流程协调
// - 消息结构渲染
// - 文件名生成

import { jsPDF } from 'jspdf';
import { DateTimeUtils } from '../fileParser';
import { addChineseFontSupport } from './pdfFontHelper';

// 导入内容渲染器
import {
  PDF_STYLES,
  renderCodeBlock,
  parseCodeLineBold,
  renderMarkdownText,
  renderThinking,
  renderArtifact,
  renderTool,
  renderCitations,
  renderAttachments,
  renderSection,
  parseTextWithCodeBlocks,
  parseInlineMarkdown
} from './pdfContentRenderers';

// 导入文本和页面助手
import {
  cleanText,
  safeSetFont,
  safeGetTextWidth,
  safeRenderText,
  renderPlainText,
  applyCJKPunctuationRules,
  renderInlineSegments,
  renderSegmentLine,
  applySegmentStyle,
  checkPageBreak,
  renderFooter,
  addBookmarks,
  addFooters,
  renderTOCWithLinks
} from './pdfTextHelpers';

/**
 * 获取页面尺寸配置
 * @param {string} format - 页面格式 ('a4', 'letter', 'supernote')
 * @returns {object} - 页面尺寸 { width, height, name }
 */
function getPageDimensions(format) {
  const formats = {
    a4: {
      width: 210,   // mm
      height: 297,  // mm
      name: 'A4'
    },
    letter: {
      width: 215.9, // 8.5 inches
      height: 279.4, // 11 inches
      name: 'Letter'
    },
    supernote: {
      width: 227,   // mm (Supernote Manta 10.7")
      height: 303,  // mm
      name: 'Supernote Manta'
    }
  };

  return formats[format] || formats.a4;
}

/**
 * PDF导出管理器类
 */
export class PDFExportManager {
  constructor() {
    this.pdf = null;
    this.currentY = PDF_STYLES.MARGIN_TOP;
    this.config = {};
    this.useChineseFont = false;
    this.chineseFontName = 'helvetica';
    this.availableFontWeights = [];
    this.isSystemFont = false;
    this.meta = null;
    this.exportDate = null;
    this.messageAnchors = [];
  }

  /**
   * 获取上下文对象（用于传递给辅助函数）
   */
  getContext() {
    return {
      pdf: this.pdf,
      currentY: this.currentY,
      chineseFontName: this.chineseFontName,
      availableFontWeights: this.availableFontWeights,
      messageAnchors: this.messageAnchors,
      meta: this.meta,
      exportDate: this.exportDate
    };
  }

  /**
   * 更新上下文（从辅助函数调用后更新状态）
   */
  updateFromContext(context) {
    this.currentY = context.currentY;
    this.messageAnchors = context.messageAnchors;
  }

  /**
   * 主导出方法
   */
  async exportToPDF(messages, meta, config = {}) {
    console.log('[PDF导出] 开始导出', {
      messageCount: messages.length,
      config
    });

    this.meta = meta;
    this.exportDate = DateTimeUtils.formatDateTime(new Date());
    this.messageAnchors = [];

    this.config = {
      includeThinking: config.includeThinking ?? true,
      includeArtifacts: config.includeArtifacts ?? true,
      includeTimestamps: config.includeTimestamps ?? false,
      includeTools: config.includeTools ?? true,
      includeCitations: config.includeCitations ?? true,
      highQuality: config.highQuality ?? false,
      pageFormat: config.pageFormat || 'a4',
      ...config
    };

    // 获取页面尺寸
    const pageDimensions = getPageDimensions(this.config.pageFormat);
    console.log(`[PDF导出] 使用页面格式: ${pageDimensions.name} (${pageDimensions.width}mm × ${pageDimensions.height}mm)`);

    // 更新 PDF_STYLES 的页面尺寸
    PDF_STYLES.PAGE_WIDTH = pageDimensions.width;
    PDF_STYLES.PAGE_HEIGHT = pageDimensions.height;

    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pageDimensions.width, pageDimensions.height],
      compress: true
    });

    try {
      console.log('[PDF导出] 开始加载中文字体...');
      const fontLoadResult = await addChineseFontSupport(this.pdf);
      this.useChineseFont = fontLoadResult.success;
      this.chineseFontName = fontLoadResult.fontName;
      this.availableFontWeights = fontLoadResult.availableWeights || [];
      this.isSystemFont = fontLoadResult.isSystemFont || false;

      if (!this.useChineseFont) {
        console.warn('[PDF导出] 中文字体加载失败，将使用默认字体');
      } else {
        const fontType = this.isSystemFont ? '系统字体' : '项目字体';
        console.log(`[PDF导出] 中文字体加载成功: ${this.chineseFontName} (${fontType})`);
        console.log(`[PDF导出] 可用字体变体: ${this.availableFontWeights.join(', ')}`);
      }
    } catch (error) {
      console.error('[PDF导出] 字体加载异常:', error);
      this.useChineseFont = false;
      this.chineseFontName = 'helvetica';
      this.availableFontWeights = [];
      this.isSystemFont = false;
    }

    this.pdf.setFont(this.chineseFontName);

    this.renderTitle(meta);
    this.renderMetadata(meta);
    this.currentY += PDF_STYLES.SECTION_SPACING;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      if (i > 0 && message.sender === 'human') {
        this.pdf.addPage();
        this.currentY = PDF_STYLES.MARGIN_TOP;
      }

      this.renderMessage(message, i + 1);
    }

    const hasTOC = messages.length > 1;
    if (hasTOC) {
      console.log('[PDF导出] 生成目录...');
      this.pdf.addPage();
      const tocPageNumber = this.pdf.internal.getCurrentPageInfo().pageNumber;
      this.currentY = PDF_STYLES.MARGIN_TOP;

      const context = this.getContext();
      renderTOCWithLinks(context, tocPageNumber, messages);
      this.updateFromContext(context);
    }

    console.log('[PDF导出] 添加书签...');
    const context = this.getContext();
    addBookmarks(context);
    this.updateFromContext(context);

    console.log('[PDF导出] 添加页脚...');
    addFooters(context);
    this.updateFromContext(context);

    const fileName = this.generateFileName(meta);
    this.pdf.save(fileName);

    console.log('[PDF导出] 导出完成:', fileName);
    return true;
  }

  renderTitle(meta) {
    this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_TITLE);
    this.pdf.setTextColor(...PDF_STYLES.COLOR_TEXT);

    const rawTitle = meta.name || 'Conversation';
    const title = cleanText(rawTitle);
    const maxWidth = PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_LEFT - PDF_STYLES.MARGIN_RIGHT;

    let titleLines;
    try {
      titleLines = this.pdf.splitTextToSize(title, maxWidth);
    } catch (error) {
      console.error('[PDF导出] 标题分割失败:', error);
      titleLines = [title];
    }

    const context = this.getContext();
    titleLines.forEach(line => {
      checkPageBreak(context, PDF_STYLES.FONT_SIZE_TITLE);
      const cleanLine = cleanText(line);
      if (cleanLine && cleanLine.trim().length > 0) {
        this.pdf.text(cleanLine, PDF_STYLES.MARGIN_LEFT, context.currentY);
      }
      context.currentY += PDF_STYLES.LINE_HEIGHT * 1.5;
    });
    this.updateFromContext(context);

    this.currentY += PDF_STYLES.SECTION_SPACING;
  }

  renderMetadata(meta) {
    this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_TIMESTAMP);
    this.pdf.setTextColor(...PDF_STYLES.COLOR_TIMESTAMP);

    const lines = [];
    if (meta.platform) lines.push(`Platform: ${meta.platform}`);
    if (meta.created_at) lines.push(`Created: ${meta.created_at}`);
    if (meta.updated_at) lines.push(`Updated: ${meta.updated_at}`);
    lines.push(`Exported: ${DateTimeUtils.formatDateTime(new Date())}`);

    const context = this.getContext();
    lines.forEach(line => {
      checkPageBreak(context, PDF_STYLES.FONT_SIZE_TIMESTAMP);
      this.pdf.text(line, PDF_STYLES.MARGIN_LEFT, context.currentY);
      context.currentY += PDF_STYLES.LINE_HEIGHT;
    });
    this.updateFromContext(context);
  }

  renderMessage(message, index) {
    const context = this.getContext();
    checkPageBreak(context, PDF_STYLES.FONT_SIZE_SENDER + PDF_STYLES.MESSAGE_SPACING);

    const currentPage = this.pdf.internal.getCurrentPageInfo().pageNumber;
    const currentY = context.currentY;
    context.messageAnchors.push({
      index,
      page: currentPage,
      y: currentY,
      sender: message.sender,
      title: message.display_text ? message.display_text.substring(0, 50) : ''
    });

    this.renderSender(message, index);

    if (this.config.includeTimestamps && message.timestamp) {
      this.renderTimestamp(message.timestamp);
    }

    if (message.thinking && this.config.includeThinking && message.sender !== 'human') {
      renderThinking(context, message.thinking, cleanText, checkPageBreak);
      this.updateFromContext(context);
    }

    if (message.display_text) {
      this.renderBody(message.display_text);
    }

    if (message.attachments?.length > 0 && message.sender === 'human') {
      renderAttachments(context, message.attachments, cleanText, checkPageBreak);
      this.updateFromContext(context);
    }

    if (message.artifacts?.length > 0 && this.config.includeArtifacts && message.sender !== 'human') {
      message.artifacts.forEach(artifact => {
        renderArtifact(context, artifact, cleanText, checkPageBreak);
        this.updateFromContext(context);
      });
    }

    if (message.tools?.length > 0 && this.config.includeTools) {
      message.tools.forEach(tool => {
        renderTool(context, tool, cleanText, checkPageBreak);
        this.updateFromContext(context);
      });
    }

    if (message.citations?.length > 0 && this.config.includeCitations) {
      renderCitations(context, message.citations, cleanText, checkPageBreak);
      this.updateFromContext(context);
    }

    context.currentY += PDF_STYLES.MESSAGE_SPACING;
    this.updateFromContext(context);
  }

  renderSender(message, index) {
    this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_SENDER);

    const color = message.sender === 'human'
      ? PDF_STYLES.COLOR_SENDER_HUMAN
      : PDF_STYLES.COLOR_SENDER_ASSISTANT;

    this.pdf.setTextColor(...color);

    const senderLabel = message.sender === 'human' ? 'Human' : 'Assistant';
    const label = `${index}. ${senderLabel}`;

    let finalLabel = label;
    if (message.branchInfo?.isBranchPoint) {
      const branchMarker = ` [Branch ${message.branchInfo.childCount}]`;
      finalLabel = label + branchMarker;
    }

    const cleanLabel = cleanText(finalLabel);
    if (cleanLabel && cleanLabel.trim().length > 0) {
      this.pdf.text(cleanLabel, PDF_STYLES.MARGIN_LEFT, this.currentY);
    }

    this.currentY += PDF_STYLES.LINE_HEIGHT * 1.2;
  }

  renderTimestamp(timestamp) {
    this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_TIMESTAMP);
    this.pdf.setTextColor(...PDF_STYLES.COLOR_TIMESTAMP);
    this.pdf.text(timestamp, PDF_STYLES.MARGIN_LEFT, this.currentY);
    this.currentY += PDF_STYLES.LINE_HEIGHT;
  }

  renderBody(text) {
    this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_BODY);
    this.pdf.setTextColor(...PDF_STYLES.COLOR_TEXT);

    const maxWidth = PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_LEFT - PDF_STYLES.MARGIN_RIGHT;
    const parts = parseTextWithCodeBlocks(text);
    const context = this.getContext();

    parts.forEach(part => {
      if (part.type === 'code') {
        renderCodeBlock(
          context,
          part.content,
          part.language,
          cleanText,
          checkPageBreak,
          safeGetTextWidth
        );
        this.updateFromContext(context);
      } else {
        renderMarkdownText(
          context,
          part.content,
          maxWidth,
          cleanText,
          checkPageBreak,
          renderInlineSegments,
          parseInlineMarkdown
        );
        this.updateFromContext(context);
      }
    });

    this.currentY = context.currentY + PDF_STYLES.LINE_HEIGHT;
  }

  generateFileName(meta) {
    const platform = this.getPlatformPrefix(meta.platform);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const title = (meta.name || 'conversation').substring(0, 30).replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    return `${platform}_${title}_${timestamp}.pdf`;
  }

  getPlatformPrefix(platform) {
    const prefixes = {
      'claude': 'CLA',
      'chatgpt': 'GPT',
      'gemini': 'GEM',
      'notebooklm': 'NLM',
      'google ai studio': 'GAS',
      'sillytavern': 'STV'
    };
    return prefixes[platform?.toLowerCase()] || 'CONV';
  }
}
