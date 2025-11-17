// utils/export/pdfExportManager.js
// PDF导出管理器 - 基于jsPDF实现纯文本PDF导出
//
// 使用 SarasaMonoSC-Regular.ttf 字体支持中文显示
import { jsPDF } from 'jspdf';
import { DateTimeUtils } from '../fileParser';
import { addChineseFontSupport } from './pdfFontHelper';

/**
 * PDF样式配置
 */
const PDF_STYLES = {
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
 * PDF导出管理器类
 */
export class PDFExportManager {
  constructor() {
    this.pdf = null;
    this.currentY = PDF_STYLES.MARGIN_TOP;
    this.config = {};
    this.useChineseFont = false; // 是否成功加载了中文字体
    this.chineseFontName = 'helvetica'; // 当前使用的字体名称
    this.meta = null; // 保存元数据用于页脚
    this.exportDate = null; // 导出时间
    this.messageAnchors = []; // 保存每条消息的位置信息用于目录链接和书签
  }

  /**
   * 清理和标准化文本，防止编码问题
   * @param {string} text - 原始文本
   * @returns {string} - 清理后的文本
   */
  cleanText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    try {
      // 1. Unicode 标准化（NFC 模式）
      let cleaned = text.normalize('NFC');
      
      // 2. 移除控制字符和不可打印字符（保留换行符和制表符）
      cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
      
      // 3. 处理特殊Unicode字符（可能导致jsPDF问题）
      // 移除零宽字符
      cleaned = cleaned.replace(/[\u200B-\u200F\u2060\uFEFF]/g, '');
      
      // 4. 处理特殊的拉丁字符和符号（可能导致编码问题）
      // 这些字符在PDF中可能显示不正确
      cleaned = cleaned.replace(/[\uE000-\uF8FF]/g, ''); // 私人使用区
      
      return cleaned;
    } catch (error) {
      console.error('[PDF导出] 文本清理失败:', error);
      // 如果清理失败，返回简化处理的文本
      return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    }
  }

  /**
   * 主导出方法
   * @param {Array} messages - 消息列表
   * @param {Object} meta - 元数据(title, platform, created_at, updated_at)
   * @param {Object} config - 导出配置
   */
  async exportToPDF(messages, meta, config = {}) {
    console.log('[PDF导出] 开始导出', {
      messageCount: messages.length,
      config
    });

    // 保存元数据和导出时间
    this.meta = meta;
    this.exportDate = DateTimeUtils.formatDateTime(new Date());
    this.messageAnchors = []; // 重置消息锚点

    this.config = {
      includeThinking: config.includeThinking ?? true,
      includeArtifacts: config.includeArtifacts ?? true,
      includeTimestamps: config.includeTimestamps ?? false,
      includeTools: config.includeTools ?? true,
      includeCitations: config.includeCitations ?? true,
      highQuality: config.highQuality ?? false,
      ...config
    };

    // 初始化PDF文档
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // 尝试加载中文字体（异步加载可能需要时间）
    try {
      console.log('[PDF导出] 开始加载中文字体...');
      const fontLoadResult = await addChineseFontSupport(this.pdf);
      this.useChineseFont = fontLoadResult.success;
      this.chineseFontName = fontLoadResult.fontName;

      if (!this.useChineseFont) {
        console.warn('[PDF导出] 中文字体加载失败，将使用默认字体（中文可能显示为方框）');
      } else {
        console.log(`[PDF导出] 中文字体加载成功: ${this.chineseFontName}`);
      }
    } catch (error) {
      console.error('[PDF导出] 字体加载异常:', error);
      this.useChineseFont = false;
      this.chineseFontName = 'helvetica';
    }

    // 无论字体是否加载成功，都设置一个默认字体
    this.pdf.setFont(this.chineseFontName);

    // 渲染文档
    this.renderTitle(meta);
    this.renderMetadata(meta);
    this.currentY += PDF_STYLES.SECTION_SPACING;

    // 如果有多于1条消息，预留目录页
    const hasTOC = messages.length > 1;
    let tocPageNumber = 0;
    if (hasTOC) {
      this.pdf.addPage();
      tocPageNumber = this.pdf.internal.getCurrentPageInfo().pageNumber;
      this.currentY = PDF_STYLES.MARGIN_TOP;
    }

    // 渲染消息
    for (let i = 0; i < messages.length; i++) {
      // 如果有目录，第一条消息需要新开一页
      if (hasTOC && i === 0) {
        this.pdf.addPage();
        this.currentY = PDF_STYLES.MARGIN_TOP;
      }
      this.renderMessage(messages[i], i + 1);
    }

    // 生成目录（带页码链接）
    if (hasTOC) {
      console.log('[PDF导出] 生成目录...');
      this.renderTOCWithLinks(tocPageNumber, messages);
    }

    // 添加PDF书签
    console.log('[PDF导出] 添加PDF书签...');
    this.addBookmarks();

    // 为所有页面添加页脚
    console.log('[PDF导出] 添加页脚...');
    this.addFooters();

    // 生成文件名并保存
    const fileName = this.generateFileName(meta);
    this.pdf.save(fileName);

    console.log('[PDF导出] 导出完成:', fileName);
    return true;
  }

  /**
   * 渲染标题页
   */
  renderTitle(meta) {
    this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_TITLE);
    this.pdf.setTextColor(...PDF_STYLES.COLOR_TEXT);

    const rawTitle = meta.name || 'Conversation';
    const title = this.cleanText(rawTitle); // 清理标题文本
    const maxWidth = PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_LEFT - PDF_STYLES.MARGIN_RIGHT;

    // 标题可能很长,需要自动换行
    // 注意: 如果字体加载失败,splitTextToSize可能会报错
    let titleLines;
    try {
      titleLines = this.pdf.splitTextToSize(title, maxWidth);
    } catch (error) {
      console.error('[PDF导出] 标题分割失败,使用原始标题:', error);
      // 如果splitTextToSize失败,直接使用原始标题
      titleLines = [title];
    }
    
    titleLines.forEach(line => {
      this.checkPageBreak(PDF_STYLES.FONT_SIZE_TITLE);
      const cleanLine = this.cleanText(line);
      if (cleanLine && cleanLine.trim().length > 0) {
        this.pdf.text(cleanLine, PDF_STYLES.MARGIN_LEFT, this.currentY);
      }
      this.currentY += PDF_STYLES.LINE_HEIGHT * 1.5;
    });

    this.currentY += PDF_STYLES.SECTION_SPACING;
  }

  /**
   * 渲染元数据
   */
  renderMetadata(meta) {
    this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_TIMESTAMP);
    this.pdf.setTextColor(...PDF_STYLES.COLOR_TIMESTAMP);

    const lines = [];

    if (meta.platform) {
      lines.push(`Platform: ${meta.platform}`);
    }

    if (meta.created_at) {
      lines.push(`Created: ${meta.created_at}`);
    }

    if (meta.updated_at) {
      lines.push(`Updated: ${meta.updated_at}`);
    }

    lines.push(`Exported: ${DateTimeUtils.formatDateTime(new Date())}`);

    lines.forEach(line => {
      this.checkPageBreak(PDF_STYLES.FONT_SIZE_TIMESTAMP);
      this.pdf.text(line, PDF_STYLES.MARGIN_LEFT, this.currentY);
      this.currentY += PDF_STYLES.LINE_HEIGHT;
    });
  }

  /**
   * 渲染目录（Table of Contents）带页码链接
   * @param {number} tocPage - 目录所在页码
   * @param {Array} messages - 消息列表
   */
  renderTOCWithLinks(tocPage, messages) {
    // 切换到目录页
    this.pdf.setPage(tocPage);
    this.currentY = PDF_STYLES.MARGIN_TOP;

    // 渲染目录标题
    this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_H1);
    this.pdf.setTextColor(...PDF_STYLES.COLOR_TEXT);
    this.pdf.text('Table of Contents', PDF_STYLES.MARGIN_LEFT, this.currentY);
    this.currentY += PDF_STYLES.LINE_HEIGHT * 2;

    // 绘制标题下方的分隔线
    this.pdf.setDrawColor(...PDF_STYLES.COLOR_BORDER);
    this.pdf.setLineWidth(0.3);
    this.pdf.line(
      PDF_STYLES.MARGIN_LEFT,
      this.currentY,
      PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_RIGHT,
      this.currentY
    );
    this.currentY += PDF_STYLES.LINE_HEIGHT;

    // 渲染消息列表
    this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_BODY);
    const maxWidth = PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_LEFT - PDF_STYLES.MARGIN_RIGHT;

    this.messageAnchors.forEach((anchor, idx) => {
      const message = messages[idx];
      if (!message) return;

      this.checkPageBreak(PDF_STYLES.FONT_SIZE_BODY * 2);

      const messageNumber = `${anchor.index}.`;
      const sender = anchor.sender === 'human' ? 'Human' : 'Assistant';

      // 获取消息预览（前50个字符）
      let preview = anchor.title || '';
      preview = this.cleanText(preview);
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
      this.pdf.setTextColor(...color);

      // 计算页码位置（右对齐）
      const pageNumWidth = this.pdf.getTextWidth(pageNum);
      const pageNumX = PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_RIGHT - pageNumWidth;

      // 渲染条目（作为链接）
      const entryY = this.currentY;
      this.pdf.textWithLink(entry, PDF_STYLES.MARGIN_LEFT + 5, entryY, {
        pageNumber: anchor.page
      });

      // 渲染页码（也作为链接）
      this.pdf.setTextColor(...PDF_STYLES.COLOR_TIMESTAMP);
      this.pdf.textWithLink(pageNum, pageNumX, entryY, {
        pageNumber: anchor.page
      });

      // 渲染预览（如果有）
      if (preview) {
        this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_TIMESTAMP);
        this.pdf.setTextColor(...PDF_STYLES.COLOR_TIMESTAMP);
        this.currentY += PDF_STYLES.LINE_HEIGHT;
        this.checkPageBreak(PDF_STYLES.FONT_SIZE_TIMESTAMP);
        this.pdf.text(preview, PDF_STYLES.MARGIN_LEFT + 10, this.currentY);
        this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_BODY);
      }

      this.currentY += PDF_STYLES.LINE_HEIGHT * 1.5;
    });
  }

  /**
   * 渲染单条消息
   */
  renderMessage(message, index) {
    this.checkPageBreak(PDF_STYLES.FONT_SIZE_SENDER + PDF_STYLES.MESSAGE_SPACING);

    // 记录消息位置用于目录链接和书签
    const currentPage = this.pdf.internal.getCurrentPageInfo().pageNumber;
    const currentY = this.currentY;
    this.messageAnchors.push({
      index,
      page: currentPage,
      y: currentY,
      sender: message.sender,
      title: message.display_text ? message.display_text.substring(0, 50) : ''
    });

    // 渲染发送者标签
    this.renderSender(message, index);

    // 渲染时间戳
    if (this.config.includeTimestamps && message.timestamp) {
      this.renderTimestamp(message.timestamp);
    }

    // 渲染thinking(前置)
    if (message.thinking && this.config.includeThinking && message.sender !== 'human') {
      this.renderThinking(message.thinking);
    }

    // 渲染正文
    if (message.display_text) {
      this.renderBody(message.display_text);
    }

    // 渲染附件
    if (message.attachments?.length > 0 && message.sender === 'human') {
      this.renderAttachments(message.attachments);
    }

    // 渲染Artifacts
    if (message.artifacts?.length > 0 && this.config.includeArtifacts && message.sender !== 'human') {
      message.artifacts.forEach(artifact => {
        this.renderArtifact(artifact);
      });
    }

    // 渲染工具调用
    if (message.tools?.length > 0 && this.config.includeTools) {
      message.tools.forEach(tool => {
        this.renderTool(tool);
      });
    }

    // 渲染引用
    if (message.citations?.length > 0 && this.config.includeCitations) {
      this.renderCitations(message.citations);
    }

    // 消息间距
    this.currentY += PDF_STYLES.MESSAGE_SPACING;
  }

  /**
   * 渲染发送者标签
   */
  renderSender(message, index) {
    this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_SENDER);

    // 根据发送者设置颜色
    const color = message.sender === 'human'
      ? PDF_STYLES.COLOR_SENDER_HUMAN
      : PDF_STYLES.COLOR_SENDER_ASSISTANT;

    this.pdf.setTextColor(...color);

    // 构建发送者标签
    const senderLabel = message.sender === 'human' ? 'Human' : 'Assistant';
    const label = `${index}. ${senderLabel}`;

    // 添加分支标记
    let finalLabel = label;
    if (message.branchInfo?.isBranchPoint) {
      const branchMarker = ` [Branch ${message.branchInfo.childCount}]`;
      finalLabel = label + branchMarker;
    }

    // 清理并输出标签
    const cleanLabel = this.cleanText(finalLabel);
    if (cleanLabel && cleanLabel.trim().length > 0) {
      this.pdf.text(cleanLabel, PDF_STYLES.MARGIN_LEFT, this.currentY);
    }

    this.currentY += PDF_STYLES.LINE_HEIGHT * 1.2;
  }

  /**
   * 渲染时间戳
   */
  renderTimestamp(timestamp) {
    this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_TIMESTAMP);
    this.pdf.setTextColor(...PDF_STYLES.COLOR_TIMESTAMP);
    this.pdf.text(timestamp, PDF_STYLES.MARGIN_LEFT, this.currentY);
    this.currentY += PDF_STYLES.LINE_HEIGHT;
  }

  /**
   * 渲染正文
   */
  renderBody(text) {
    this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_BODY);
    this.pdf.setTextColor(...PDF_STYLES.COLOR_TEXT);

    const maxWidth = PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_LEFT - PDF_STYLES.MARGIN_RIGHT;

    // 处理代码块和LaTeX公式
    const parts = this.parseTextWithCodeBlocksAndLatex(text);

    parts.forEach(part => {
      if (part.type === 'code') {
        this.renderCodeBlock(part.content, part.language);
      } else if (part.type === 'latex-block') {
        this.renderLatexBlock(part.content);
      } else if (part.type === 'latex-inline') {
        this.renderLatexInline(part.content, maxWidth);
      } else {
        this.renderPlainText(part.content, maxWidth);
      }
    });

    this.currentY += PDF_STYLES.LINE_HEIGHT;
  }

  /**
   * 渲染纯文本(带自动换行)
   */
  renderPlainText(text, maxWidth) {
    // 处理空文本
    if (!text || text.trim().length === 0) {
      this.currentY += PDF_STYLES.LINE_HEIGHT;
      return;
    }

    // 清理文本，防止编码问题
    const cleanedText = this.cleanText(text);
    
    if (!cleanedText || cleanedText.trim().length === 0) {
      console.warn('[PDF导出] 文本清理后为空，跳过');
      this.currentY += PDF_STYLES.LINE_HEIGHT;
      return;
    }

    // 使用 splitTextToSize 自动处理换行,支持Unicode字符
    let lines;
    try {
      lines = this.pdf.splitTextToSize(cleanedText, maxWidth);
    } catch (error) {
      console.error('[PDF导出] splitTextToSize失败，使用简单换行:', error);
      // 如果splitTextToSize失败,使用简单的换行逻辑
      lines = cleanedText.split('\n');
    }

    lines.forEach(line => {
      this.checkPageBreak(PDF_STYLES.FONT_SIZE_BODY);
      
      // 再次清理单行文本（防止splitTextToSize引入问题）
      const cleanLine = this.cleanText(line);
      if (cleanLine && cleanLine.trim().length > 0) {
        this.pdf.text(cleanLine, PDF_STYLES.MARGIN_LEFT, this.currentY);
      }
      this.currentY += PDF_STYLES.LINE_HEIGHT;
    });
  }

  /**
   * 渲染代码块（支持跨页）- 简化版，逐行渲染
   */
  renderCodeBlock(code, language = '') {
    this.checkPageBreak(PDF_STYLES.FONT_SIZE_CODE + PDF_STYLES.SECTION_SPACING * 2);

    const maxWidth = PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_LEFT - PDF_STYLES.MARGIN_RIGHT;
    const lineNumberWidth = 8;
    const codeWidth = maxWidth - lineNumberWidth - 8;
    const padding = 3;

    const cleanCode = this.cleanText(code);
    const cleanLanguage = this.cleanText(language);

    // 渲染语言标签
    if (cleanLanguage) {
      this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_TIMESTAMP);
      this.pdf.setTextColor(100, 100, 100);
      const labelText = cleanLanguage.toUpperCase();
      const labelWidth = this.pdf.getTextWidth(labelText) + 4;
      this.pdf.setFillColor(220, 220, 220);
      this.pdf.roundedRect(
        PDF_STYLES.MARGIN_LEFT,
        this.currentY - 3,
        labelWidth,
        5,
        1,
        1,
        'F'
      );
      this.pdf.text(labelText, PDF_STYLES.MARGIN_LEFT + 2, this.currentY);
      this.currentY += PDF_STYLES.LINE_HEIGHT * 1.2;
    }

    // 处理代码行
    this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_CODE);
    this.pdf.setFont(this.chineseFontName);
    const codeLines = cleanCode.split('\n');
    const wrappedLines = [];

    codeLines.forEach(line => {
      if (!line) {
        wrappedLines.push({ text: '', lineNumber: wrappedLines.length + 1 });
        return;
      }
      const cleanLine = this.cleanText(line);
      if (!cleanLine) {
        wrappedLines.push({ text: '', lineNumber: wrappedLines.length + 1 });
        return;
      }

      try {
        const wrapped = this.pdf.splitTextToSize(cleanLine, codeWidth);
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
    const blockStartY = this.currentY;
    const blockStartPage = this.pdf.internal.getCurrentPageInfo().pageNumber;
    let isFirstLine = true;

    // 先绘制第一页的背景和边框起始部分
    const firstPageHeight = Math.min(
      wrappedLines.length * PDF_STYLES.LINE_HEIGHT + padding * 2,
      PDF_STYLES.PAGE_HEIGHT - PDF_STYLES.MARGIN_BOTTOM - this.currentY
    );
    this.pdf.setFillColor(248, 248, 248);
    this.pdf.rect(
      PDF_STYLES.MARGIN_LEFT,
      blockStartY - padding,
      maxWidth,
      firstPageHeight,
      'F'
    );

    this.currentY = blockStartY;

    wrappedLines.forEach(({ text, lineNumber }, index) => {
      // 检查是否需要换页
      if (this.currentY + PDF_STYLES.FONT_SIZE_CODE > PDF_STYLES.PAGE_HEIGHT - PDF_STYLES.MARGIN_BOTTOM) {
        // 先绘制当前页的代码块底部边框
        this.pdf.setDrawColor(200, 200, 200);
        this.pdf.setLineWidth(0.3);
        const currentPageBottom = this.currentY;
        this.pdf.line(
          PDF_STYLES.MARGIN_LEFT,
          blockStartY - padding,
          PDF_STYLES.MARGIN_LEFT,
          currentPageBottom
        );
        this.pdf.line(
          PDF_STYLES.MARGIN_LEFT + maxWidth,
          blockStartY - padding,
          PDF_STYLES.MARGIN_LEFT + maxWidth,
          currentPageBottom
        );

        // 换页
        this.pdf.addPage();
        this.currentY = PDF_STYLES.MARGIN_TOP;
        
        // 在新页绘制代码块背景（连续样式）
        const remainingLines = wrappedLines.length - index;
        const newPageHeight = Math.min(
          remainingLines * PDF_STYLES.LINE_HEIGHT + padding,
          PDF_STYLES.PAGE_HEIGHT - PDF_STYLES.MARGIN_BOTTOM - this.currentY
        );
        this.pdf.setFillColor(248, 248, 248);
        this.pdf.rect(
          PDF_STYLES.MARGIN_LEFT,
          this.currentY - padding,
          maxWidth,
          newPageHeight,
          'F'
        );
        
        isFirstLine = false;
      }

      // 渲染行号
      if (lineNumber !== null) {
        this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_CODE - 1);
        this.pdf.setTextColor(150, 150, 150);
        const lineNumStr = String(lineNumber).padStart(3, ' ');
        this.pdf.text(lineNumStr, PDF_STYLES.MARGIN_LEFT + 1, this.currentY);
      }

      // 渲染代码文本
      this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_CODE);
      this.pdf.setTextColor(50, 50, 50);
      const safeLine = this.cleanText(text);
      if (safeLine !== null && safeLine !== undefined) {
        this.pdf.text(safeLine, PDF_STYLES.MARGIN_LEFT + lineNumberWidth + 2, this.currentY);
      }
      this.currentY += PDF_STYLES.LINE_HEIGHT;
    });

    // 绘制最后的边框和行号分隔线
    const endPage = this.pdf.internal.getCurrentPageInfo().pageNumber;
    
    // 如果跨页，需要在每一页绘制边框
    for (let page = blockStartPage; page <= endPage; page++) {
      this.pdf.setPage(page);
      const isFirst = (page === blockStartPage);
      const isLast = (page === endPage);
      
      let boxStartY, boxEndY;
      if (isFirst && isLast) {
        // 单页代码块
        boxStartY = blockStartY - padding;
        boxEndY = this.currentY + padding;
      } else if (isFirst) {
        // 第一页
        boxStartY = blockStartY - padding;
        boxEndY = PDF_STYLES.PAGE_HEIGHT - PDF_STYLES.MARGIN_BOTTOM;
      } else if (isLast) {
        // 最后一页
        boxStartY = PDF_STYLES.MARGIN_TOP - padding;
        boxEndY = this.currentY + padding;
      } else {
        // 中间页
        boxStartY = PDF_STYLES.MARGIN_TOP - padding;
        boxEndY = PDF_STYLES.PAGE_HEIGHT - PDF_STYLES.MARGIN_BOTTOM;
      }
      
      // 绘制边框
      this.pdf.setDrawColor(200, 200, 200);
      this.pdf.setLineWidth(0.3);
      if (isFirst && isLast) {
        this.pdf.roundedRect(PDF_STYLES.MARGIN_LEFT, boxStartY, maxWidth, boxEndY - boxStartY, 1.5, 1.5, 'S');
      } else {
        this.pdf.line(PDF_STYLES.MARGIN_LEFT, boxStartY, PDF_STYLES.MARGIN_LEFT, boxEndY);
        this.pdf.line(PDF_STYLES.MARGIN_LEFT + maxWidth, boxStartY, PDF_STYLES.MARGIN_LEFT + maxWidth, boxEndY);
        if (isFirst) {
          this.pdf.line(PDF_STYLES.MARGIN_LEFT, boxStartY, PDF_STYLES.MARGIN_LEFT + maxWidth, boxStartY);
        }
        if (isLast) {
          this.pdf.line(PDF_STYLES.MARGIN_LEFT, boxEndY, PDF_STYLES.MARGIN_LEFT + maxWidth, boxEndY);
        }
      }
      
      // 绘制行号分隔线
      this.pdf.setDrawColor(220, 220, 220);
      this.pdf.setLineWidth(0.2);
      this.pdf.line(
        PDF_STYLES.MARGIN_LEFT + lineNumberWidth,
        boxStartY,
        PDF_STYLES.MARGIN_LEFT + lineNumberWidth,
        boxEndY
      );
    }

    // 确保回到最后一页
    this.pdf.setPage(endPage);
    
    // 恢复默认样式
    this.pdf.setFont(this.chineseFontName);
    this.pdf.setTextColor(...PDF_STYLES.COLOR_TEXT);
    this.currentY += PDF_STYLES.SECTION_SPACING;
  }

  /**
   * 将代码行按页分组
   * @param {Array} wrappedLines - 包装后的代码行
   * @returns {Array} - 分组后的行 [{page, startY, lines: [...]}]
   */
  groupCodeLinesByPage(wrappedLines) {
    const groups = [];
    let currentGroup = null;
    const bottomLimit = PDF_STYLES.PAGE_HEIGHT - PDF_STYLES.MARGIN_BOTTOM;

    let simulatedY = this.currentY;
    let simulatedPage = this.pdf.internal.getCurrentPageInfo().pageNumber;

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
   * 渲染块级LaTeX公式（支持跨页）- 简化版
   * @param {string} latex - LaTeX公式内容
   */
  renderLatexBlock(latex) {
    this.checkPageBreak(PDF_STYLES.FONT_SIZE_BODY + PDF_STYLES.SECTION_SPACING * 2);

    const maxWidth = PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_LEFT - PDF_STYLES.MARGIN_RIGHT;
    const padding = 3;
    const cleanLatex = this.cleanText(latex);

    // 渲染"Math"标签
    this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_TIMESTAMP);
    this.pdf.setTextColor(70, 130, 180);
    const labelText = 'MATH';
    const labelWidth = this.pdf.getTextWidth(labelText) + 4;
    this.pdf.setFillColor(230, 240, 250);
    this.pdf.roundedRect(
      PDF_STYLES.MARGIN_LEFT,
      this.currentY - 3,
      labelWidth,
      5,
      1,
      1,
      'F'
    );
    this.pdf.text(labelText, PDF_STYLES.MARGIN_LEFT + 2, this.currentY);
    this.currentY += PDF_STYLES.LINE_HEIGHT * 1.2;

    // 处理公式文本
    this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_BODY);
    this.pdf.setFont(this.chineseFontName);

    let formulaLines;
    try {
      formulaLines = this.pdf.splitTextToSize(cleanLatex, maxWidth - 8);
    } catch (error) {
      formulaLines = cleanLatex.split('\n');
    }

    // 逐行渲染
    const blockStartY = this.currentY;
    const blockStartPage = this.pdf.internal.getCurrentPageInfo().pageNumber;

    // 绘制第一页的背景
    const firstPageHeight = Math.min(
      formulaLines.length * PDF_STYLES.LINE_HEIGHT + padding * 2,
      PDF_STYLES.PAGE_HEIGHT - PDF_STYLES.MARGIN_BOTTOM - this.currentY
    );
    this.pdf.setFillColor(245, 250, 255);
    this.pdf.rect(
      PDF_STYLES.MARGIN_LEFT,
      blockStartY - padding,
      maxWidth,
      firstPageHeight,
      'F'
    );

    this.currentY = blockStartY;

    formulaLines.forEach((line, index) => {
      // 检查是否需要换页
      if (this.currentY + PDF_STYLES.FONT_SIZE_BODY > PDF_STYLES.PAGE_HEIGHT - PDF_STYLES.MARGIN_BOTTOM) {
        // 换页
        this.pdf.addPage();
        this.currentY = PDF_STYLES.MARGIN_TOP;

        // 在新页绘制背景
        const remainingLines = formulaLines.length - index;
        const newPageHeight = Math.min(
          remainingLines * PDF_STYLES.LINE_HEIGHT + padding,
          PDF_STYLES.PAGE_HEIGHT - PDF_STYLES.MARGIN_BOTTOM - this.currentY
        );
        this.pdf.setFillColor(245, 250, 255);
        this.pdf.rect(
          PDF_STYLES.MARGIN_LEFT,
          this.currentY - padding,
          maxWidth,
          newPageHeight,
          'F'
        );
      }

      // 渲染公式文本
      this.pdf.setTextColor(30, 60, 120);
      const safeLine = this.cleanText(line);
      if (safeLine && safeLine.trim().length > 0) {
        this.pdf.text(safeLine, PDF_STYLES.MARGIN_LEFT + 4, this.currentY);
      }
      this.currentY += PDF_STYLES.LINE_HEIGHT;
    });

    // 绘制边框
    const endPage = this.pdf.internal.getCurrentPageInfo().pageNumber;

    for (let page = blockStartPage; page <= endPage; page++) {
      this.pdf.setPage(page);
      const isFirst = (page === blockStartPage);
      const isLast = (page === endPage);

      let boxStartY, boxEndY;
      if (isFirst && isLast) {
        boxStartY = blockStartY - padding;
        boxEndY = this.currentY + padding;
      } else if (isFirst) {
        boxStartY = blockStartY - padding;
        boxEndY = PDF_STYLES.PAGE_HEIGHT - PDF_STYLES.MARGIN_BOTTOM;
      } else if (isLast) {
        boxStartY = PDF_STYLES.MARGIN_TOP - padding;
        boxEndY = this.currentY + padding;
      } else {
        boxStartY = PDF_STYLES.MARGIN_TOP - padding;
        boxEndY = PDF_STYLES.PAGE_HEIGHT - PDF_STYLES.MARGIN_BOTTOM;
      }

      // 绘制边框
      this.pdf.setDrawColor(180, 210, 240);
      this.pdf.setLineWidth(0.4);
      if (isFirst && isLast) {
        this.pdf.roundedRect(PDF_STYLES.MARGIN_LEFT, boxStartY, maxWidth, boxEndY - boxStartY, 1.5, 1.5, 'S');
      } else {
        this.pdf.line(PDF_STYLES.MARGIN_LEFT, boxStartY, PDF_STYLES.MARGIN_LEFT, boxEndY);
        this.pdf.line(PDF_STYLES.MARGIN_LEFT + maxWidth, boxStartY, PDF_STYLES.MARGIN_LEFT + maxWidth, boxEndY);
        if (isFirst) {
          this.pdf.line(PDF_STYLES.MARGIN_LEFT, boxStartY, PDF_STYLES.MARGIN_LEFT + maxWidth, boxStartY);
        }
        if (isLast) {
          this.pdf.line(PDF_STYLES.MARGIN_LEFT, boxEndY, PDF_STYLES.MARGIN_LEFT + maxWidth, boxEndY);
        }
      }
    }

    // 确保回到最后一页
    this.pdf.setPage(endPage);

    // 恢复默认样式
    this.pdf.setTextColor(...PDF_STYLES.COLOR_TEXT);
    this.currentY += PDF_STYLES.SECTION_SPACING;
  }

  /**
   * 将LaTeX行按页分组
   * @param {Array} lines - LaTeX公式行
   * @returns {Array} - 分组后的行 [{page, startY, lines: [...]}]
   */
  groupLatexLinesByPage(lines) {
    const groups = [];
    let currentGroup = null;
    const bottomLimit = PDF_STYLES.PAGE_HEIGHT - PDF_STYLES.MARGIN_BOTTOM;

    let simulatedY = this.currentY;
    let simulatedPage = this.pdf.internal.getCurrentPageInfo().pageNumber;

    lines.forEach((line) => {
      // 检查是否需要换页
      if (simulatedY + PDF_STYLES.FONT_SIZE_BODY > bottomLimit) {
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
   * 渲染行内LaTeX公式
   * @param {string} latex - LaTeX公式内容
   * @param {number} maxWidth - 最大宽度
   */
  renderLatexInline(latex, maxWidth) {
    const cleanLatex = this.cleanText(latex);

    // 设置行内公式样式
    this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_BODY);

    // 添加前缀和后缀标记
    const formulaText = `⟨ ${cleanLatex} ⟩`;

    // 使用特殊颜色标识数学公式
    this.pdf.setTextColor(70, 130, 180); // 蓝色

    try {
      const lines = this.pdf.splitTextToSize(formulaText, maxWidth);
      lines.forEach(line => {
        this.checkPageBreak(PDF_STYLES.FONT_SIZE_BODY);
        const safeLine = this.cleanText(line);
        if (safeLine && safeLine.trim().length > 0) {
          this.pdf.text(safeLine, PDF_STYLES.MARGIN_LEFT, this.currentY);
        }
        this.currentY += PDF_STYLES.LINE_HEIGHT;
      });
    } catch (error) {
      this.pdf.text(formulaText, PDF_STYLES.MARGIN_LEFT, this.currentY);
      this.currentY += PDF_STYLES.LINE_HEIGHT;
    }

    // 恢复默认颜色
    this.pdf.setTextColor(...PDF_STYLES.COLOR_TEXT);
  }

  /**
   * 渲染thinking区块
   */
  renderThinking(thinking) {
    this.renderSection('💭 Thinking', thinking, PDF_STYLES.COLOR_SECTION_BG);
  }

  /**
   * 渲染Artifact
   */
  renderArtifact(artifact) {
    const title = `📄 Artifact: ${artifact.title || 'Untitled'}`;
    const content = artifact.content || '';
    this.renderSection(title, content, PDF_STYLES.COLOR_SECTION_BG);
  }

  /**
   * 渲染工具调用
   */
  renderTool(tool) {
    const title = `🔧 Tool: ${tool.name || 'Unknown'}`;
    const content = `Input: ${JSON.stringify(tool.input, null, 2)}\n\nOutput: ${tool.output || 'N/A'}`;
    this.renderSection(title, content, PDF_STYLES.COLOR_SECTION_BG);
  }

  /**
   * 渲染引用
   */
  renderCitations(citations) {
    const title = '📚 Citations';
    const content = citations.map((cit, i) =>
      `[${i + 1}] ${cit.title || cit.url || 'Unknown'}`
    ).join('\n');
    this.renderSection(title, content, PDF_STYLES.COLOR_SECTION_BG);
  }

  /**
   * 渲染附件
   */
  renderAttachments(attachments) {
    const title = '📎 Attachments';
    const content = attachments.map((att, i) =>
      `[${i + 1}] ${att.file_name || att.name || 'file'} (${att.file_type || att.type || 'unknown'})`
    ).join('\n');
    this.renderSection(title, content, PDF_STYLES.COLOR_SECTION_BG);
  }

  /**
   * 通用区块渲染(带背景)
   */
  renderSection(title, content, bgColor) {
    this.checkPageBreak(PDF_STYLES.FONT_SIZE_H2 + PDF_STYLES.SECTION_SPACING * 2);

    const maxWidth = PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_LEFT - PDF_STYLES.MARGIN_RIGHT;
    
    // 清理标题和内容
    const cleanTitle = this.cleanText(title);
    const cleanContent = this.cleanText(content);
    
    // 处理内容换行,带错误处理
    let contentLines;
    try {
      contentLines = this.pdf.splitTextToSize(cleanContent, maxWidth - 4);
    } catch (error) {
      console.error('[PDF导出] 区块内容分割失败:', error);
      contentLines = cleanContent.split('\n');
    }
    
    const bgHeight = PDF_STYLES.LINE_HEIGHT * (contentLines.length + 2);

    // 绘制背景
    this.pdf.setFillColor(...bgColor);
    this.pdf.rect(
      PDF_STYLES.MARGIN_LEFT,
      this.currentY - 3,
      maxWidth,
      bgHeight,
      'F'
    );

    // 渲染标题
    this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_H2);
    this.pdf.setTextColor(...PDF_STYLES.COLOR_TEXT);
    if (cleanTitle && cleanTitle.trim().length > 0) {
      this.pdf.text(cleanTitle, PDF_STYLES.MARGIN_LEFT + 2, this.currentY);
    }
    this.currentY += PDF_STYLES.LINE_HEIGHT * 1.2;

    // 渲染内容
    this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_BODY);
    contentLines.forEach(line => {
      this.checkPageBreak(PDF_STYLES.FONT_SIZE_BODY);
      const cleanLine = this.cleanText(line);
      if (cleanLine && cleanLine.trim().length > 0) {
        this.pdf.text(cleanLine, PDF_STYLES.MARGIN_LEFT + 2, this.currentY);
      }
      this.currentY += PDF_STYLES.LINE_HEIGHT;
    });

    this.currentY += PDF_STYLES.SECTION_SPACING;
  }

  /**
   * 渲染页脚
   * @param {number} pageNumber - 当前页码
   * @param {number} totalPages - 总页数
   */
  renderFooter(pageNumber, totalPages) {
    const originalY = this.currentY;
    const originalFontSize = this.pdf.internal.getFontSize();

    // 设置页脚样式
    this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_FOOTER);
    this.pdf.setTextColor(...PDF_STYLES.COLOR_FOOTER);

    const footerY = PDF_STYLES.PAGE_HEIGHT - 10;

    // 绘制页脚上方的分隔线
    this.pdf.setDrawColor(...PDF_STYLES.COLOR_BORDER);
    this.pdf.setLineWidth(0.1);
    this.pdf.line(
      PDF_STYLES.MARGIN_LEFT,
      PDF_STYLES.PAGE_HEIGHT - PDF_STYLES.FOOTER_HEIGHT,
      PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_RIGHT,
      PDF_STYLES.PAGE_HEIGHT - PDF_STYLES.FOOTER_HEIGHT
    );

    // 左侧显示导出时间
    const exportText = `Exported: ${this.exportDate}`;
    this.pdf.text(exportText, PDF_STYLES.MARGIN_LEFT, footerY);

    // 右侧显示页码
    const pageText = `${pageNumber} / ${totalPages}`;
    const pageTextWidth = this.pdf.getTextWidth(pageText);
    this.pdf.text(pageText, PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_RIGHT - pageTextWidth, footerY);

    // 恢复原始设置
    this.pdf.setFontSize(originalFontSize);
    this.pdf.setTextColor(...PDF_STYLES.COLOR_TEXT);
    this.currentY = originalY;
  }

  /**
   * 添加PDF书签（outline）
   */
  addBookmarks() {
    if (this.messageAnchors.length === 0) return;

    // jsPDF的outline功能
    // 创建书签树结构
    try {
      this.messageAnchors.forEach((anchor) => {
        const sender = anchor.sender === 'human' ? 'Human' : 'Assistant';
        const title = `${anchor.index}. ${sender}`;

        // 使用jsPDF的outline API
        // 注意：jsPDF的outline功能可能需要插件支持
        if (this.pdf.outline) {
          this.pdf.outline.add(null, title, { pageNumber: anchor.page });
        }
      });
    } catch (error) {
      console.warn('[PDF导出] 书签添加失败（可能不支持）:', error);
    }
  }

  /**
   * 为所有页面添加页脚
   */
  addFooters() {
    const totalPages = this.pdf.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      this.pdf.setPage(i);
      this.renderFooter(i, totalPages);
    }
  }

  /**
   * 检查是否需要分页
   */
  checkPageBreak(requiredSpace = 20) {
    const bottomLimit = PDF_STYLES.PAGE_HEIGHT - PDF_STYLES.MARGIN_BOTTOM;

    if (this.currentY + requiredSpace > bottomLimit) {
      this.pdf.addPage();
      this.currentY = PDF_STYLES.MARGIN_TOP;
    }
  }

  /**
   * 解析文本中的代码块和LaTeX公式
   * 优先级：代码块 > LaTeX块级公式 > LaTeX行内公式
   */
  parseTextWithCodeBlocksAndLatex(text) {
    const parts = [];
    const elements = [];

    // 1. 首先提取所有代码块
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    let match;
    let lastIndex = 0;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      elements.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'code',
        language: match[1] || '',
        content: match[2]
      });
    }

    // 2. 提取块级LaTeX公式（$$...$$）
    const latexBlockRegex = /\$\$([\s\S]*?)\$\$/g;
    while ((match = latexBlockRegex.exec(text)) !== null) {
      // 检查是否与代码块重叠
      const overlaps = elements.some(el =>
        (match.index >= el.start && match.index < el.end) ||
        (match.index + match[0].length > el.start && match.index + match[0].length <= el.end)
      );
      if (!overlaps) {
        elements.push({
          start: match.index,
          end: match.index + match[0].length,
          type: 'latex-block',
          content: match[1].trim()
        });
      }
    }

    // 3. 提取行内LaTeX公式（$...$，但不是$$）
    const latexInlineRegex = /(?<!\$)\$(?!\$)((?:\\.|[^$\\])+?)\$(?!\$)/g;
    while ((match = latexInlineRegex.exec(text)) !== null) {
      // 检查是否与已有元素重叠
      const overlaps = elements.some(el =>
        (match.index >= el.start && match.index < el.end) ||
        (match.index + match[0].length > el.start && match.index + match[0].length <= el.end)
      );
      if (!overlaps) {
        elements.push({
          start: match.index,
          end: match.index + match[0].length,
          type: 'latex-inline',
          content: match[1].trim()
        });
      }
    }

    // 4. 按位置排序所有元素
    elements.sort((a, b) => a.start - b.start);

    // 5. 构建最终的parts数组
    lastIndex = 0;
    elements.forEach(element => {
      // 添加元素前的文本
      if (element.start > lastIndex) {
        const plainText = text.substring(lastIndex, element.start);
        if (plainText.trim()) {
          parts.push({ type: 'text', content: plainText });
        }
      }

      // 添加元素本身
      parts.push(element);
      lastIndex = element.end;
    });

    // 添加最后的文本
    if (lastIndex < text.length) {
      const plainText = text.substring(lastIndex);
      if (plainText.trim()) {
        parts.push({ type: 'text', content: plainText });
      }
    }

    // 如果没有特殊元素,返回整个文本
    if (parts.length === 0) {
      parts.push({ type: 'text', content: text });
    }

    return parts;
  }

  /**
   * 解析文本中的代码块（旧方法，保留以兼容）
   */
  parseTextWithCodeBlocks(text) {
    return this.parseTextWithCodeBlocksAndLatex(text);
  }

  /**
   * 生成文件名
   */
  generateFileName(meta) {
    const date = DateTimeUtils.getCurrentDate();
    const cleanTitle = (meta.name || 'conversation').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    return `${cleanTitle}_${date}.pdf`;
  }

  /**
   * 获取平台前缀
   */
  getPlatformPrefix(platform) {
    const platformLower = (platform || '').toLowerCase();

    if (platformLower.includes('chatgpt')) return 'chatgpt';
    if (platformLower.includes('gemini')) return 'gemini';
    if (platformLower.includes('notebooklm')) return 'notebooklm';
    if (platformLower.includes('aistudio')) return 'aistudio';
    if (platformLower.includes('sillytavern')) return 'sillytavern';

    return 'claude';
  }
}

// 导出单例实例
export const pdfExportManager = new PDFExportManager();
