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

  // 颜色 (RGB)
  COLOR_SENDER_HUMAN: [0, 102, 204],      // 蓝色
  COLOR_SENDER_ASSISTANT: [102, 102, 102], // 灰色
  COLOR_TIMESTAMP: [150, 150, 150],        // 浅灰
  COLOR_CODE_BG: [245, 245, 245],          // 代码背景
  COLOR_SECTION_BG: [250, 250, 250],       // 区块背景
  COLOR_TEXT: [0, 0, 0],                   // 黑色文本

  // 间距
  MARGIN_LEFT: 15,
  MARGIN_RIGHT: 15,
  MARGIN_TOP: 20,
  MARGIN_BOTTOM: 20,
  LINE_HEIGHT: 5,
  SECTION_SPACING: 8,
  MESSAGE_SPACING: 10,

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

    // 渲染消息
    for (let i = 0; i < messages.length; i++) {
      this.renderMessage(messages[i], i + 1);
    }

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
   * 渲染单条消息
   */
  renderMessage(message, index) {
    this.checkPageBreak(PDF_STYLES.FONT_SIZE_SENDER + PDF_STYLES.MESSAGE_SPACING);

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

    // 处理代码块
    const parts = this.parseTextWithCodeBlocks(text);

    parts.forEach(part => {
      if (part.type === 'code') {
        this.renderCodeBlock(part.content, part.language);
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
   * 渲染代码块
   */
  renderCodeBlock(code, language = '') {
    this.checkPageBreak(PDF_STYLES.FONT_SIZE_CODE + PDF_STYLES.SECTION_SPACING * 2);

    const maxWidth = PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_LEFT - PDF_STYLES.MARGIN_RIGHT;
    const codeWidth = maxWidth - 4; // 留出左右padding

    // 清理代码内容
    const cleanCode = this.cleanText(code);
    const cleanLanguage = this.cleanText(language);

    // 渲染语言标签
    if (cleanLanguage) {
      this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_TIMESTAMP);
      this.pdf.setTextColor(...PDF_STYLES.COLOR_TIMESTAMP);
      this.pdf.text(`[${cleanLanguage}]`, PDF_STYLES.MARGIN_LEFT + 2, this.currentY);
      this.currentY += PDF_STYLES.LINE_HEIGHT;
    }

    // 预处理代码行,进行自动换行
    this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_CODE);
    // 使用中文字体而不是courier，以支持代码块中的中文注释
    // this.pdf.setFont('courier');  // courier不支持中文
    this.pdf.setFont(this.chineseFontName);
    const codeLines = cleanCode.split('\n');
    const wrappedLines = [];
    
    codeLines.forEach(line => {
      if (!line) {
        wrappedLines.push('');
        return;
      }
      // 清理单行代码
      const cleanLine = this.cleanText(line);
      if (!cleanLine) {
        wrappedLines.push('');
        return;
      }
      
      // 使用splitTextToSize自动换行,考虑等宽字体
      try {
        const wrapped = this.pdf.splitTextToSize(cleanLine, codeWidth);
        wrappedLines.push(...wrapped);
      } catch (error) {
        // 如果splitTextToSize失败,手动换行
        const charsPerLine = Math.floor(codeWidth / 2); // 粗略估算
        for (let i = 0; i < cleanLine.length; i += charsPerLine) {
          wrappedLines.push(cleanLine.substring(i, i + charsPerLine));
        }
      }
    });

    // 计算背景高度
    const bgHeight = PDF_STYLES.LINE_HEIGHT * (wrappedLines.length + 1) + 6;

    // 绘制背景
    this.pdf.setFillColor(...PDF_STYLES.COLOR_CODE_BG);
    this.pdf.rect(
      PDF_STYLES.MARGIN_LEFT,
      this.currentY - 3,
      maxWidth,
      bgHeight,
      'F'
    );

    // 渲染代码内容(已自动换行)
    this.pdf.setTextColor(...PDF_STYLES.COLOR_TEXT);
    wrappedLines.forEach(line => {
      this.checkPageBreak(PDF_STYLES.FONT_SIZE_CODE);
      const safeLine = this.cleanText(line);
      if (safeLine !== null && safeLine !== undefined) {
        this.pdf.text(safeLine, PDF_STYLES.MARGIN_LEFT + 2, this.currentY);
      }
      this.currentY += PDF_STYLES.LINE_HEIGHT;
    });

    // 恢复默认字体
    this.pdf.setFont(this.chineseFontName);
    this.currentY += PDF_STYLES.SECTION_SPACING;
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
   * 解析文本中的代码块
   */
  parseTextWithCodeBlocks(text) {
    const parts = [];
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
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
      parts.push({
        type: 'code',
        language: match[1] || '',
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

    // 如果没有代码块,返回整个文本
    if (parts.length === 0) {
      parts.push({ type: 'text', content: text });
    }

    return parts;
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
