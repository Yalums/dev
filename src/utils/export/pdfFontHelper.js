// utils/export/pdfFontHelper.js
// PDF中文字体支持 - 使用 ARUDJingxihei (阿如汉字黑体) 字体家族
//
// 当前实现：
// - 使用 public/fonts/ARUDJingxihei-Regular.ttf (正常字重)
// - 使用 public/fonts/ARUDJingxihei-Bold.ttf (粗体字重)
// - 使用 public/fonts/ARUDJingxihei-Light.ttf (细体字重)
// - 支持多字重变体，可正确渲染粗体标题和强调文本
// - 包含完整的验证流程（Content-Type、TTF魔数、cmap表）

/**
 * 验证字体是否包含必要的 Unicode cmap
 * @param {ArrayBuffer} arrayBuffer - 字体文件内容
 * @returns {boolean} - 是否包含 cmap
 */
function hasUnicodeCmap(arrayBuffer) {
  try {
    const dataView = new DataView(arrayBuffer);
    
    // TTF 文件以特定的魔数开头
    const version = dataView.getUint32(0, false);
    // 0x00010000 或 'true' 或 'typ1' 或 'OTTO'
    if (version !== 0x00010000 && version !== 0x74727565) {
      console.warn('[PDF字体] 可能不是标准TTF格式');
    }
    
    // 简单检查: 查找 'cmap' 表
    const buffer = new Uint8Array(arrayBuffer);
    const cmapSignature = [0x63, 0x6d, 0x61, 0x70]; // 'cmap'
    
    for (let i = 0; i < Math.min(buffer.length - 4, 1000); i++) {
      if (buffer[i] === cmapSignature[0] &&
          buffer[i+1] === cmapSignature[1] &&
          buffer[i+2] === cmapSignature[2] &&
          buffer[i+3] === cmapSignature[3]) {
        console.log('[PDF字体] 找到 cmap 表');
        return true;
      }
    }
    
    console.warn('[PDF字体] 未找到 cmap 表特征');
    return false;
  } catch (error) {
    console.error('[PDF字体] cmap 检查失败:', error);
    return false;
  }
}

/**
 * 从项目资源加载字体文件并添加到PDF
 * @param {jsPDF} pdf - jsPDF实例
 * @param {string} fontPath - 字体文件路径 (相对于public目录)
 * @param {string} fontName - 字体名称
 * @param {string} fontStyle - 字体样式 (normal, bold, light 等)
 * @returns {Promise<boolean>} - 是否成功加载字体
 */
async function loadFontFromProject(pdf, fontPath, fontName = 'CustomFont', fontStyle = 'normal') {
  try {
    console.log(`[PDF字体] 正在加载字体: ${fontPath}`);
    
    // 设置超时时间（5秒）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      // 从 public 目录加载字体文件
      // 添加时间戳参数破坏缓存
      const cacheBuster = `?v=${Date.now()}`;
      const response = await fetch(fontPath + cacheBuster, { 
        signal: controller.signal,
        cache: 'no-store', // 禁用缓存
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`加载字体失败: ${response.status}`);
      }

      // 检查 Content-Type，确保是字体文件而不是HTML错误页面
      const contentType = response.headers.get('content-type');
      console.log(`[PDF字体] Content-Type: ${contentType}`);

      if (contentType && contentType.includes('text/html')) {
        console.error(`[PDF字体] 返回了HTML页面而不是字体文件！`);
        return false;
      }

      const arrayBuffer = await response.arrayBuffer();
      const fileSizeKB = (arrayBuffer.byteLength / 1024).toFixed(2);
      const fileSizeMB = (arrayBuffer.byteLength / 1024 / 1024).toFixed(2);

      console.log(`[PDF字体] 字体文件大小: ${fileSizeMB} MB (${fileSizeKB} KB)`);

      // 验证TTF魔数（文件头）
      const dataView = new DataView(arrayBuffer);
      const magic = dataView.getUint32(0, false);
      // TTF文件应该以 0x00010000 或 0x74727565 ('true') 开头
      if (magic !== 0x00010000 && magic !== 0x74727565) {
        console.error(`[PDF字体] 文件不是有效的TTF字体！魔数: 0x${magic.toString(16)}`);
        console.error(`[PDF字体] 这可能是一个HTML错误页面或其他非字体文件`);
        return false;
      }

      // 检查文件是否太小
      if (arrayBuffer.byteLength < 500 * 1024) {
        console.error(`[PDF字体] 字体文件异常小 (仅 ${fileSizeKB} KB)！`);
        console.error(`[PDF字体] 正常的中文字体应该至少 3MB`);
        return false;
      }
      
      // 验证字体是否包含 cmap 表
      const hasCmap = hasUnicodeCmap(arrayBuffer);
      if (!hasCmap) {
        console.warn(`[PDF字体] 警告: 字体可能缺少 Unicode cmap 表`);
        console.warn(`[PDF字体] 建议更换为 Noto Sans SC 或 Source Han Sans CN`);
      }
      
      const bytes = new Uint8Array(arrayBuffer);
      
      // 转换为base64
      let binary = '';
      const len = bytes.byteLength;
      // 批量处理以提高性能
      const chunkSize = 8192;
      for (let i = 0; i < len; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
        binary += String.fromCharCode.apply(null, chunk);
      }
      const base64 = btoa(binary);
      
      // 添加字体到jsPDF
      const fileName = fontPath.split('/').pop();
      
      try {
        pdf.addFileToVFS(fileName, base64);
        // 添加字体时指定样式
        pdf.addFont(fileName, fontName, fontStyle);

        console.log(`[PDF字体] 字体加载成功: ${fontName}-${fontStyle}`);
        return true;
      } catch (addFontError) {
        console.error(`[PDF字体] addFont 失败:`, addFontError.message);
        console.error(`[PDF字体] 这通常意味着字体不兼容 jsPDF`);
        console.error(`[PDF字体] 错误详情:`, addFontError);
        return false;
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.warn(`[PDF字体] 字体加载超时: ${fontPath}`);
      } else {
        console.warn(`[PDF字体] 获取字体文件失败: ${fetchError.message}`);
      }
      return false;
    }
  } catch (error) {
    console.error('[PDF字体] 字体加载失败:', error);
    return false;
  }
}

/**
 * 为PDF添加中文字体支持（多字重版本）
 * 尝试加载项目中的中文字体，支持 Regular、Light、Bold 三个字重
 *
 * @param {jsPDF} pdf - jsPDF实例
 * @returns {Promise<{success: boolean, fontName: string, availableWeights: string[]}>} - 加载结果和字体名称
 */
export async function addChineseFontSupport(pdf) {
  console.log('[PDF字体] 开始加载 ARUDJingxihei 字体家族...');

  // 定义字体配置 - 使用阿如汉字黑体
  const fontConfigs = [
    {
      path: '/fonts/ARUDJingxihei-Regular.ttf',
      name: 'ARUDJingxihei',
      style: 'normal',
      weight: 400,
      description: 'Regular (正常)'
    },
    {
      path: '/fonts/ARUDJingxihei-Bold.ttf',
      name: 'ARUDJingxihei',
      style: 'bold',
      weight: 700,
      description: 'Bold (粗体)'
    },
    {
      path: '/fonts/ARUDJingxihei-Light.ttf',
      name: 'ARUDJingxihei',
      style: 'light',
      weight: 300,
      description: 'Light (细体)'
    },
  ];

  let loadedCount = 0;
  let fontName = 'helvetica';
  const availableWeights = [];

  for (const config of fontConfigs) {
    try {
      const success = await loadFontFromProject(
        pdf,
        config.path,
        config.name,
        config.style  // 传入样式参数
      );
      if (success) {
        loadedCount++;
        fontName = config.name;
        availableWeights.push(config.style);
        console.log(`[PDF字体] ✓ 加载成功: ${config.name}-${config.style} (${config.description})`);
      }
    } catch (error) {
      console.warn(`[PDF字体] ✗ 跳过: ${config.path} - ${error.message}`);
    }
  }

  if (loadedCount === 0) {
    console.warn('[PDF字体] ✗ 未能加载任何 ARUDJingxihei 字体');
    console.warn('[PDF字体] 将使用 helvetica 默认字体 (中文可能显示为方块)');
    pdf.setFont('helvetica');
    return { success: false, fontName: 'helvetica', availableWeights: [] };
  }

  console.log(`[PDF字体] ✓ 成功加载 ${loadedCount} 个字体变体: ${availableWeights.join(', ')}`);

  // 设置默认字体为 normal
  try {
    pdf.setFont(fontName, 'normal');
  } catch (error) {
    console.warn('[PDF字体] ⚠ 设置默认字体失败，使用第一个可用字重');
    pdf.setFont(fontName, availableWeights[0] || 'normal');
  }

  return { success: true, fontName, availableWeights };
}
