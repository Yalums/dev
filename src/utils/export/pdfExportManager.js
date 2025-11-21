// utils/export/pdfExportManager.js
// PDF导出管理器 - 基于jsPDF实现纯文本PDF导出
//
// 使用 ARUDJingxihei 字体家族支持中文显示（Regular、Bold、Light 三种字重）
// 支持 Markdown 渲染（标题、粗体、斜体、列表、引用等）
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
    this.availableFontWeights = []; // 可用的字体变体 (normal, bold, light 等)
    this.isSystemFont = false; // 是否使用系统字体
    this.meta = null; // 保存元数据用于页脚
    this.exportDate = null; // 导出时间
    this.messageAnchors = []; // 保存每条消息的位置信息用于目录链接和书签
  }

  /**
   * 安全地设置字体，如果字体变体不可用则自动回退
   * @param {string} fontName - 字体名称
   * @param {string} fontStyle - 字体样式 (normal, bold, light, italic, bolditalic)
   * @returns {boolean} - 是否成功设置
   */
  safeSetFont(fontName, fontStyle = 'normal') {
    try {
      // 如果请求的样式可用，直接使用
      if (this.availableFontWeights.includes(fontStyle)) {
        this.pdf.setFont(fontName, fontStyle);
        return true;
      }

      // 字体变体不可用，进行智能回退
      console.warn(`[PDF导出] 字体变体 ${fontStyle} 不可用，尝试回退...`);

      // 回退策略
      if (fontStyle === 'bold' || fontStyle === 'bolditalic') {
        // 粗体：优先尝试 normal，如果没有则用第一个可用的
        if (this.availableFontWeights.includes('normal')) {
          this.pdf.setFont(fontName, 'normal');
          console.log(`[PDF导出] ✓ 回退到 normal 字体`);
          return false; // 返回 false 表示使用了回退
        }
      }

      if (fontStyle === 'italic' || fontStyle === 'bolditalic') {
        // 斜体：中文字体通常没有斜体，回退到 light 或 normal
        if (this.availableFontWeights.includes('light')) {
          this.pdf.setFont(fontName, 'light');
          console.log(`[PDF导出] ✓ 斜体回退到 light 字体`);
          return false;
        } else if (this.availableFontWeights.includes('normal')) {
          this.pdf.setFont(fontName, 'normal');
          console.log(`[PDF导出] ✓ 斜体回退到 normal 字体`);
          return false;
        }
      }

      // 默认回退：使用第一个可用的字体变体
      if (this.availableFontWeights.length > 0) {
        const fallbackStyle = this.availableFontWeights[0];
        this.pdf.setFont(fontName, fallbackStyle);
        console.log(`[PDF导出] ✓ 回退到 ${fallbackStyle} 字体`);
        return false;
      }

      // 最终回退：使用 normal
      this.pdf.setFont(fontName, 'normal');
      console.log(`[PDF导出] ✓ 回退到 normal 字体`);
      return false;
    } catch (error) {
      console.error(`[PDF导出] 设置字体失败:`, error);
      // 最后的保险：使用默认字体
      this.pdf.setFont(fontName || this.chineseFontName);
      return false;
    }
  }

  /**
   * 安全地获取文本宽度，处理字体元数据缺失的情况
   * @param {string} text - 要测量的文本
   * @returns {number} - 文本宽度
   */
  safeGetTextWidth(text) {
    if (!text || typeof text !== 'string') {
      return 0;
    }

    try {
      // 检查当前字体是否有 Unicode 元数据
      const font = this.pdf.getFont();
      if (!font.metadata || !font.metadata.Unicode) {
        const currentStyle = font.fontStyle || 'normal';
        console.warn(`[PDF导出] 当前字体 (${currentStyle}) 缺少 Unicode 元数据`);

        // 只在非normal字体时回退
        if (currentStyle !== 'normal') {
          console.log('[PDF导出] 回退到 normal 字体');
          this.safeSetFont(this.chineseFontName, 'normal');
          // 重新尝试获取宽度
          return this.pdf.getTextWidth(text);
        } else {
          // normal字体也有问题，使用近似值
          console.warn('[PDF导出] normal 字体也缺少元数据，使用近似计算');
          const fontSize = this.pdf.getFontSize();
          return text.length * fontSize * 0.5;
        }
      }

      return this.pdf.getTextWidth(text);
    } catch (error) {
      console.error('[PDF导出] getTextWidth 失败:', error);
      // 如果失败，使用近似值：字符数 * 字体大小 * 0.5
      const fontSize = this.pdf.getFontSize();
      return text.length * fontSize * 0.5;
    }
  }

  /**
   * 安全地渲染文本，自动处理边界
   * @param {string} text - 要渲染的文本
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {number} maxWidth - 最大宽度（可选）
   */
  safeRenderText(text, x, y, maxWidth = null) {
    if (!text || typeof text !== 'string') {
      return;
    }

    const cleanedText = this.cleanText(text);
    if (!cleanedText) {
      return;
    }

    // 如果指定了 maxWidth，检查文本宽度
    if (maxWidth) {
      const textWidth = this.safeGetTextWidth(cleanedText);
      if (textWidth > maxWidth) {
        // 文本过长，进行截断并添加省略号
        console.warn('[PDF导出] 文本过长，将被截断:', cleanedText.substring(0, 50));
        // 尝试使用 splitTextToSize 拆分（只渲染第一行）
        try {
          const lines = this.pdf.splitTextToSize(cleanedText, maxWidth);
          if (lines.length > 0) {
            this.pdf.text(lines[0], x, y);
          }
        } catch (error) {
          // 如果失败，尝试简单截断
          let truncated = cleanedText;
          while (this.safeGetTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
            truncated = truncated.substring(0, truncated.length - 1);
          }
          this.pdf.text(truncated + '...', x, y);
        }
        return;
      }
    }

    // 文本长度合适，直接渲染
    this.pdf.text(cleanedText, x, y);
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
      this.availableFontWeights = fontLoadResult.availableWeights || [];
      this.isSystemFont = fontLoadResult.isSystemFont || false;

      if (!this.useChineseFont) {
        console.warn('[PDF导出] 中文字体加载失败，将使用默认字体（中文可能显示为方框）');
        if (fontLoadResult.systemFontAvailable) {
          console.warn('[PDF导出] 提示：检测到系统有中文字体，但无法在浏览器环境中直接使用');
          console.warn('[PDF导出] 建议：请确保项目 public/fonts/ 目录下有中文字体文件');
        }
      } else {
        const fontType = this.isSystemFont ? '系统字体' : '项目字体';
        console.log(`[PDF导出] 中文字体加载成功: ${this.chineseFontName} (${fontType})`);
        console.log(`[PDF导出] 可用字体变体: ${this.availableFontWeights.join(', ')}`);
        if (fontLoadResult.systemFontInfo) {
          console.log(`[PDF导出] 系统字体信息: ${fontLoadResult.systemFontInfo.fontName}`);
        }
      }
    } catch (error) {
      console.error('[PDF导出] 字体加载异常:', error);
      this.useChineseFont = false;
      this.chineseFontName = 'helvetica';
      this.availableFontWeights = [];
      this.isSystemFont = false;
    }

    // 无论字体是否加载成功，都设置一个默认字体
    this.pdf.setFont(this.chineseFontName);

    // 渲染文档
    this.renderTitle(meta);
    this.renderMetadata(meta);
    this.currentY += PDF_STYLES.SECTION_SPACING;

    // 渲染消息
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      // 分页策略：一轮对话（用户消息+AI回复）结束后再换页
      // 只有当前是用户消息且不是第一条时才换页，这样一轮对话会在同一页或连续页面上
      if (i > 0 && message.sender === 'human') {
        this.pdf.addPage();
        this.currentY = PDF_STYLES.MARGIN_TOP;
      }

      this.renderMessage(message, i + 1);
    }

    // 生成目录（放在文档最后，避免页码混乱）
    const hasTOC = messages.length > 1;
    if (hasTOC) {
      console.log('[PDF导出] 生成目录（位于文档末尾）...');
      this.pdf.addPage();
      const tocPageNumber = this.pdf.internal.getCurrentPageInfo().pageNumber;
      this.currentY = PDF_STYLES.MARGIN_TOP;
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
      const pageNumWidth = this.safeGetTextWidth(pageNum);
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

    // 处理代码块
    const parts = this.parseTextWithCodeBlocksAndLatex(text);

    parts.forEach(part => {
      if (part.type === 'code') {
        this.renderCodeBlock(part.content, part.language);
      } else {
        // 渲染普通文本，支持markdown格式
        this.renderMarkdownText(part.content, maxWidth);
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
      const labelWidth = this.safeGetTextWidth(labelText) + 4;
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

      // 渲染代码文本（支持 **粗体** 和 ### 标题）
      const safeLine = this.cleanText(text);
      if (safeLine !== null && safeLine !== undefined) {
        // 解析粗体和标题标记
        const segments = this.parseCodeLineBold(safeLine);
        const isHeading = segments.some(s => s.heading);

        // 根据标题级别设置字号和颜色
        if (isHeading) {
          const level = segments[0].heading;
          const headingSizes = [14, 13, 12, 11, 10, 10]; // H1-H6 字号
          this.pdf.setFontSize(headingSizes[level - 1] || PDF_STYLES.FONT_SIZE_CODE);
          this.pdf.setTextColor(20, 20, 20); // 深色
        } else {
          this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_CODE);
          this.pdf.setTextColor(50, 50, 50);
        }

        let currentX = PDF_STYLES.MARGIN_LEFT + lineNumberWidth + 2;

        segments.forEach(segment => {
          // 标题或粗体使用bold字体
          if ((segment.heading || segment.bold) && this.availableFontWeights.includes('bold')) {
            this.pdf.setFont(this.chineseFontName, 'bold');
          } else {
            // 使用普通字体（保持中文支持）
            this.pdf.setFont(this.chineseFontName, 'normal');
          }

          this.pdf.text(segment.text, currentX, this.currentY);
          currentX += this.safeGetTextWidth(segment.text);
        });

        // 恢复默认字体和字号
        this.pdf.setFont(this.chineseFontName, 'normal');
        this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_CODE);
        this.pdf.setTextColor(50, 50, 50);
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
    const pageTextWidth = this.safeGetTextWidth(pageText);
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
   * 解析文本中的代码块
   */
  parseTextWithCodeBlocksAndLatex(text) {
    const parts = [];
    const elements = [];

    // 提取所有代码块（允许语言标识符后有空格）
    const codeBlockRegex = /```([^\n]*?)\s*\n([\s\S]*?)```/g;
    let match;
    let lastIndex = 0;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const language = (match[1] || '').trim(); // 清理语言标识符
      elements.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'code',
        language: language,
        content: match[2]
      });
    }

    // 按位置排序所有元素
    elements.sort((a, b) => a.start - b.start);

    // 构建最终的parts数组
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
   * 解析markdown格式的文本并渲染
   * 支持：粗体、斜体、行内代码、链接、列表、引用等
   */
  renderMarkdownText(text, maxWidth) {
    if (!text || text.trim().length === 0) {
      this.currentY += PDF_STYLES.LINE_HEIGHT;
      return;
    }

    const cleanedText = this.cleanText(text);
    if (!cleanedText || cleanedText.trim().length === 0) {
      this.currentY += PDF_STYLES.LINE_HEIGHT;
      return;
    }

    // 按行处理文本
    const lines = cleanedText.split('\n');

    lines.forEach(line => {
      this.checkPageBreak(PDF_STYLES.FONT_SIZE_BODY);

      // 处理不同类型的行
      if (line.trim() === '') {
        // 空行
        this.currentY += PDF_STYLES.LINE_HEIGHT;
      } else if (line.match(/^#{1,6}\s/)) {
        // 标题
        this.renderMarkdownHeading(line, maxWidth);
      } else if (line.match(/^>\s/)) {
        // 引用
        this.renderMarkdownQuote(line, maxWidth);
      } else if (line.match(/^[-*+]\s/) || line.match(/^\d+\.\s/)) {
        // 列表
        this.renderMarkdownList(line, maxWidth);
      } else {
        // 普通文本（可能包含行内格式）
        this.renderMarkdownInlineFormats(line, maxWidth);
      }
    });
  }

  /**
   * 渲染markdown标题
   */
  renderMarkdownHeading(line, maxWidth) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (!match) {
      this.renderPlainText(line, maxWidth);
      return;
    }

    const level = match[1].length;
    const text = match[2];

    // 根据标题级别设置字体大小
    const fontSize = PDF_STYLES.FONT_SIZE_BODY + (7 - level) * 2;
    const oldFontSize = this.pdf.internal.getFontSize();

    this.pdf.setFontSize(fontSize);
    // 使用粗体字体（如果可用）
    this.safeSetFont(this.chineseFontName, 'bold');

    try {
      const lines = this.pdf.splitTextToSize(text, maxWidth);
      lines.forEach(l => {
        this.checkPageBreak(fontSize);
        const cleanLine = this.cleanText(l);
        if (cleanLine && cleanLine.trim().length > 0) {
          this.pdf.text(cleanLine, PDF_STYLES.MARGIN_LEFT, this.currentY);
        }
        this.currentY += PDF_STYLES.LINE_HEIGHT * 1.2;
      });
    } catch (error) {
      console.error('[PDF导出] 标题渲染失败:', error);
      this.pdf.text(text, PDF_STYLES.MARGIN_LEFT, this.currentY);
      this.currentY += PDF_STYLES.LINE_HEIGHT * 1.2;
    }

    // 恢复字体
    this.pdf.setFontSize(oldFontSize);
    this.safeSetFont(this.chineseFontName, 'normal');

    this.currentY += PDF_STYLES.LINE_HEIGHT * 0.5; // 标题后额外间距
  }

  /**
   * 渲染markdown引用
   */
  renderMarkdownQuote(line, maxWidth) {
    const text = line.replace(/^>\s*/, '');
    const quoteWidth = maxWidth - 8;
    const quoteX = PDF_STYLES.MARGIN_LEFT + 6;

    // 绘制左侧竖线
    this.pdf.setDrawColor(150, 150, 150);
    this.pdf.setLineWidth(0.5);

    const startY = this.currentY - 2;

    // 渲染文本
    this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_BODY);
    this.pdf.setTextColor(100, 100, 100);

    try {
      const lines = this.pdf.splitTextToSize(text, quoteWidth);
      lines.forEach(l => {
        this.checkPageBreak(PDF_STYLES.FONT_SIZE_BODY);
        const cleanLine = this.cleanText(l);
        if (cleanLine && cleanLine.trim().length > 0) {
          this.pdf.text(cleanLine, quoteX, this.currentY);
        }
        this.currentY += PDF_STYLES.LINE_HEIGHT;
      });

      // 绘制引用线
      this.pdf.line(
        PDF_STYLES.MARGIN_LEFT + 2,
        startY,
        PDF_STYLES.MARGIN_LEFT + 2,
        this.currentY - 2
      );
    } catch (error) {
      console.error('[PDF导出] 引用渲染失败:', error);
      this.pdf.text(text, quoteX, this.currentY);
      this.currentY += PDF_STYLES.LINE_HEIGHT;
    }

    // 恢复颜色
    this.pdf.setTextColor(...PDF_STYLES.COLOR_TEXT);
  }

  /**
   * 渲染markdown列表
   */
  renderMarkdownList(line, maxWidth) {
    let bullet = '';
    let text = '';

    // 检测列表类型
    const unorderedMatch = line.match(/^([-*+])\s+(.+)$/);
    const orderedMatch = line.match(/^(\d+)\.\s+(.+)$/);

    if (unorderedMatch) {
      bullet = '•'; // 使用圆点作为项目符号
      text = unorderedMatch[2];
    } else if (orderedMatch) {
      bullet = orderedMatch[1] + '.';
      text = orderedMatch[2];
    } else {
      this.renderPlainText(line, maxWidth);
      return;
    }

    const bulletWidth = this.safeGetTextWidth(bullet + '  ');
    const textWidth = maxWidth - bulletWidth;
    const textX = PDF_STYLES.MARGIN_LEFT + bulletWidth;

    // 渲染项目符号
    this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_BODY);
    this.pdf.text(bullet, PDF_STYLES.MARGIN_LEFT + 2, this.currentY);

    // 解析并渲染带格式的文本
    try {
      // 解析行内markdown格式（粗体、斜体等）
      const segments = this.parseInlineMarkdown(text);

      // 使用renderInlineSegments渲染，但需要调整左边距
      const originalMarginLeft = PDF_STYLES.MARGIN_LEFT;
      PDF_STYLES.MARGIN_LEFT = textX; // 临时调整左边距以对齐列表文本

      this.renderInlineSegments(segments, textWidth);

      PDF_STYLES.MARGIN_LEFT = originalMarginLeft; // 恢复原始边距
    } catch (error) {
      console.error('[PDF导出] 列表渲染失败:', error);
      this.pdf.text(text, textX, this.currentY);
      this.currentY += PDF_STYLES.LINE_HEIGHT;
    }
  }

  /**
   * 渲染包含行内格式的markdown文本
   * 支持：**粗体**、*斜体*、`代码`、[链接](url)
   */
  renderMarkdownInlineFormats(line, maxWidth) {
    if (!line || line.trim().length === 0) {
      this.currentY += PDF_STYLES.LINE_HEIGHT;
      return;
    }

    // 解析行内格式
    const segments = this.parseInlineMarkdown(line);

    // 按行渲染segments
    this.renderInlineSegments(segments, maxWidth);
  }

  /**
   * 解析行内markdown格式
   * 返回格式化的文本片段数组
   */
  parseInlineMarkdown(text) {
    const segments = [];
    let currentPos = 0;

    // 正则表达式模式（按优先级）
    const patterns = [
      { type: 'code', regex: /`([^`]+)`/g },              // 行内代码
      { type: 'bold-italic', regex: /\*\*\*(.+?)\*\*\*/g }, // 粗斜体
      { type: 'bold-italic', regex: /___(.+?)___/g },     // 粗斜体
      { type: 'bold', regex: /\*\*([^*]+?)\*\*/g },       // 粗体（改进：不匹配*字符）
      { type: 'bold', regex: /__([^_]+?)__/g },           // 粗体（改进：不匹配_字符）
      { type: 'italic', regex: /\*([^*]+?)\*/g },         // 斜体（改进：不匹配*字符）
      { type: 'italic', regex: /_([^_]+?)_/g },           // 斜体（改进：不匹配_字符）
      { type: 'link', regex: /\[([^\]]+)\]\(([^)]+)\)/g } // 链接
    ];

    // 查找所有匹配
    const matches = [];
    patterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.regex.source, 'g');
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          type: pattern.type,
          start: match.index,
          end: regex.lastIndex,
          text: this.cleanText(match[1]),  // 清理文本，防止特殊字符导致乱码
          url: match[2], // 仅用于链接
          rawText: match[1] // 保留原始文本用于调试
        });
        // 调试：记录找到的格式
        if (pattern.type === 'bold') {
          console.log(`[PDF导出] 发现粗体文本 [${match.index}-${regex.lastIndex}]:`, match[1]);
        }
      }
    });

    // 按位置排序
    matches.sort((a, b) => a.start - b.start);

    // 移除重叠的匹配（保留最外层）
    const filteredMatches = [];
    matches.forEach(match => {
      const overlaps = filteredMatches.some(existing =>
        (match.start >= existing.start && match.start < existing.end) ||
        (match.end > existing.start && match.end <= existing.end)
      );
      if (!overlaps) {
        filteredMatches.push(match);
      } else if (match.type === 'bold') {
        console.warn(`[PDF导出] ⚠ 粗体文本被过滤（重叠）[${match.start}-${match.end}]:`, match.rawText);
      }
    });

    // 构建segments数组
    let lastEnd = 0;
    filteredMatches.forEach(match => {
      // 添加普通文本
      if (match.start > lastEnd) {
        segments.push({
          type: 'normal',
          text: this.cleanText(text.substring(lastEnd, match.start))  // 清理普通文本
        });
      }

      // 添加格式化文本
      segments.push({
        type: match.type,
        text: match.text,  // 已在上面清理过
        url: match.url
      });

      lastEnd = match.end;
    });

    // 添加剩余文本
    if (lastEnd < text.length) {
      segments.push({
        type: 'normal',
        text: this.cleanText(text.substring(lastEnd))  // 清理剩余文本
      });
    }

    // 如果没有匹配，返回整个文本
    if (segments.length === 0) {
      segments.push({
        type: 'normal',
        text: this.cleanText(text)  // 清理整个文本
      });
    }

    // 清理未闭合的Markdown标记（如单独的 ** 或 * ）
    segments.forEach(segment => {
      if (segment.type === 'normal' && segment.text) {
        // 移除未闭合的粗体标记
        segment.text = segment.text.replace(/\*\*(?!\*)/g, '');  // 移除单独的 **
        segment.text = segment.text.replace(/(?<!\*)\*\*/g, '');  // 移除单独的 **
        // 移除未闭合的斜体标记
        segment.text = segment.text.replace(/(?<!\*)\*(?!\*)/g, '');  // 移除单独的 *
        // 移除未闭合的下划线标记
        segment.text = segment.text.replace(/(?<!_)__(?!_)/g, '');  // 移除单独的 __
        segment.text = segment.text.replace(/(?<!_)_(?!_)/g, '');  // 移除单独的 _
      }
    });

    return segments;
  }

  /**
   * 应用中文标点避头尾规则
   * @param {string[]} lines - 换行后的文本行数组
   * @returns {string[]} - 调整后的文本行数组
   */
  applyCJKPunctuationRules(lines) {
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
   * 解析代码行中的格式标记（粗体、标题）
   * 返回 [{text: string, bold: boolean, heading: number}]
   */
  parseCodeLineBold(line) {
    const segments = [];

    // 检查是否是标题行（### 开头）
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length; // 标题级别（1-6）
      const headingText = headingMatch[2];

      // 标题文本仍然可以包含粗体
      const boldRegex = /\*\*([^*]+?)\*\*/g;
      let lastEnd = 0;
      let match;

      while ((match = boldRegex.exec(headingText)) !== null) {
        if (match.index > lastEnd) {
          segments.push({
            text: headingText.substring(lastEnd, match.index),
            bold: false,
            heading: level
          });
        }
        segments.push({
          text: match[1],
          bold: true,
          heading: level
        });
        lastEnd = boldRegex.lastIndex;
      }

      if (lastEnd < headingText.length) {
        segments.push({
          text: headingText.substring(lastEnd),
          bold: false,
          heading: level
        });
      }

      if (segments.length === 0) {
        segments.push({
          text: headingText,
          bold: false,
          heading: level
        });
      }

      return segments;
    }

    // 不是标题，解析普通粗体
    const boldRegex = /\*\*([^*]+?)\*\*/g;
    let lastEnd = 0;
    let match;

    while ((match = boldRegex.exec(line)) !== null) {
      // 添加普通文本
      if (match.index > lastEnd) {
        segments.push({
          text: line.substring(lastEnd, match.index),
          bold: false
        });
      }

      // 添加粗体文本
      segments.push({
        text: match[1],
        bold: true
      });

      lastEnd = boldRegex.lastIndex;
    }

    // 添加剩余文本
    if (lastEnd < line.length) {
      segments.push({
        text: line.substring(lastEnd),
        bold: false
      });
    }

    // 如果没有匹配，返回整行
    if (segments.length === 0) {
      segments.push({
        text: line,
        bold: false
      });
    }

    return segments;
  }

  /**
   * 渲染行内格式的文本片段
   */
  renderInlineSegments(segments, maxWidth) {
    let currentX = PDF_STYLES.MARGIN_LEFT;
    let currentLineText = '';
    let currentLineSegments = [];

    segments.forEach((segment, idx) => {
      const text = this.cleanText(segment.text || '');
      if (!text) return;

      // 设置样式并测量宽度
      this.applySegmentStyle(segment.type);
      const textWidth = this.safeGetTextWidth(text);
      const availableWidth = PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_RIGHT - currentX;

      // 如果单个 segment 本身就超过可用宽度，需要拆分
      if (textWidth > availableWidth && currentLineSegments.length === 0) {
        // 这是新行的第一个 segment，但它太长了
        // 尝试使用 splitTextToSize 拆分
        try {
          const maxSegmentWidth = PDF_STYLES.PAGE_WIDTH - PDF_STYLES.MARGIN_LEFT - PDF_STYLES.MARGIN_RIGHT;
          let splitLines = this.pdf.splitTextToSize(text, maxSegmentWidth);
          // 应用中文标点避头尾规则
          splitLines = this.applyCJKPunctuationRules(splitLines);

          // 渲染除最后一行外的所有行
          for (let i = 0; i < splitLines.length - 1; i++) {
            this.checkPageBreak(PDF_STYLES.FONT_SIZE_BODY);
            currentLineSegments = [{
              ...segment,
              x: PDF_STYLES.MARGIN_LEFT,
              text: splitLines[i]
            }];
            this.renderSegmentLine(currentLineSegments);
            this.currentY += PDF_STYLES.LINE_HEIGHT;
          }

          // 最后一行准备与后续 segment 合并
          const lastLine = splitLines[splitLines.length - 1];
          const lastLineWidth = this.safeGetTextWidth(lastLine);
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
        this.checkPageBreak(PDF_STYLES.FONT_SIZE_BODY);

        // 渲染当前行
        this.renderSegmentLine(currentLineSegments);
        this.currentY += PDF_STYLES.LINE_HEIGHT;

        // 重置行状态
        currentX = PDF_STYLES.MARGIN_LEFT;
        currentLineSegments = [];

        // 重新检查新行上这个 segment 是否超出边界
        if (textWidth > maxWidth) {
          // 即使在新行，segment 仍然太长，需要拆分
          try {
            let splitLines = this.pdf.splitTextToSize(text, maxWidth);
            // 应用中文标点避头尾规则
            splitLines = this.applyCJKPunctuationRules(splitLines);
            for (let i = 0; i < splitLines.length - 1; i++) {
              this.checkPageBreak(PDF_STYLES.FONT_SIZE_BODY);
              const tempSegments = [{
                ...segment,
                x: PDF_STYLES.MARGIN_LEFT,
                text: splitLines[i]
              }];
              this.renderSegmentLine(tempSegments);
              this.currentY += PDF_STYLES.LINE_HEIGHT;
            }
            // 最后一行
            const lastLine = splitLines[splitLines.length - 1];
            const lastLineWidth = this.safeGetTextWidth(lastLine);
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
      this.checkPageBreak(PDF_STYLES.FONT_SIZE_BODY);
      this.renderSegmentLine(currentLineSegments);
      this.currentY += PDF_STYLES.LINE_HEIGHT;
    }

    // 恢复默认样式
    this.pdf.setFont(this.chineseFontName, 'normal');
    this.pdf.setTextColor(...PDF_STYLES.COLOR_TEXT);
  }

  /**
   * 渲染一行segment
   */
  renderSegmentLine(segments) {
    segments.forEach(segment => {
      this.applySegmentStyle(segment.type);

      if (segment.type === 'link') {
        // 渲染链接（添加下划线）
        this.pdf.textWithLink(segment.text, segment.x, this.currentY, {
          url: segment.url || '#'
        });
        // 绘制下划线
        const textWidth = this.safeGetTextWidth(segment.text);
        this.pdf.line(segment.x, this.currentY + 0.5, segment.x + textWidth, this.currentY + 0.5);
      } else if (segment.type === 'code') {
        // 渲染行内代码（添加背景色）
        // 注意：字体和颜色已经在 applySegmentStyle 中设置，这里只添加背景
        const textWidth = this.safeGetTextWidth(segment.text);
        const padding = 1;
        this.pdf.setFillColor(245, 245, 245);
        this.pdf.rect(segment.x - padding, this.currentY - 3, textWidth + padding * 2, 4, 'F');
        // 不要重新设置颜色和字体，使用 applySegmentStyle 中已设置的
        this.pdf.text(segment.text, segment.x, this.currentY);
      } else {
        // 普通文本
        this.pdf.text(segment.text, segment.x, this.currentY);
      }
    });
  }

  /**
   * 应用segment样式
   */
  applySegmentStyle(type) {
    this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_BODY);
    this.pdf.setTextColor(...PDF_STYLES.COLOR_TEXT);

    switch (type) {
      case 'bold':
        console.log('[PDF导出] 应用粗体样式, 字体:', this.chineseFontName, '可用变体:', this.availableFontWeights);
        // 使用粗体字体（如果可用，否则自动回退）
        const boldSuccess = this.safeSetFont(this.chineseFontName, 'bold');
        console.log('[PDF导出] safeSetFont 返回:', boldSuccess);
        if (!boldSuccess) {
          // 如果粗体字体不可用，使用明显的视觉区分
          console.warn('[PDF导出] 粗体字体不可用，使用视觉回退方案: 深蓝色 RGB(20,20,150) + 字体大小', PDF_STYLES.FONT_SIZE_BODY + 1);
          // 使用深蓝色 + 增大字体来明显区分粗体
          this.pdf.setTextColor(20, 20, 150); // 深蓝色，非常明显
          this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_BODY + 1); // 增加1pt，更明显
        } else {
          console.log('[PDF导出] 使用字体粗体变体');
        }
        break;
      case 'italic':
        // 使用 light 字体表示斜体（中文字体通常没有真正的斜体）
        const lightSuccess = this.safeSetFont(this.chineseFontName, 'light');
        if (!lightSuccess) {
          // 如果没有 light，用颜色区分
          this.pdf.setTextColor(70, 130, 180); // 蓝色表示强调
        }
        break;
      case 'bold-italic':
        // 粗斜体：尝试使用 bold，如果没有则用 normal + 颜色
        const boldItalicSuccess = this.safeSetFont(this.chineseFontName, 'bolditalic');
        if (!boldItalicSuccess) {
          // 回退：尝试只用 bold
          const boldOnlySuccess = this.safeSetFont(this.chineseFontName, 'bold');
          if (!boldOnlySuccess) {
            // bold 也不可用，使用深蓝色区分
            this.pdf.setTextColor(30, 60, 120); // 深蓝色（粗体+斜体）
            this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_BODY + 0.5);
          } else {
            // bold 可用，添加颜色表示斜体
            this.pdf.setTextColor(70, 130, 180); // 蓝色表示斜体
          }
        }
        break;
      case 'code':
        this.pdf.setFont('courier', 'normal');
        this.pdf.setFontSize(PDF_STYLES.FONT_SIZE_CODE);
        this.pdf.setTextColor(220, 50, 50);
        break;
      case 'link':
        // 使用 light 字体和蓝色表示链接
        const linkLightSuccess = this.safeSetFont(this.chineseFontName, 'light');
        if (!linkLightSuccess) {
          this.safeSetFont(this.chineseFontName, 'normal');
        }
        this.pdf.setTextColor(0, 102, 204); // 蓝色
        break;
      default:
        this.safeSetFont(this.chineseFontName, 'normal');
    }
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