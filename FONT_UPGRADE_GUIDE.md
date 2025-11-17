# PDF 字体升级指南 - 支持粗体和斜体

## 当前问题

`SarasaMonoSC-Regular.ttf` 只有一个变体，无法支持粗体/斜体渲染。

## 解决方案：使用 Noto Sans SC 字体家族

### 1️⃣ 下载字体文件

#### 方案 A: 从 Google Fonts 下载（推荐）

访问: https://fonts.google.com/noto/specimen/Noto+Sans+SC

点击 "Download family" 下载整个字体家族。

#### 方案 B: 从 GitHub 下载

```bash
# 访问发布页
https://github.com/googlefonts/noto-cjk/releases

# 下载 Noto Sans SC
# 文件名类似: NotoSansSC.zip
```

#### 方案 C: 使用 CDN（不推荐，网络依赖）

### 2️⃣ 选择需要的字体文件

从下载的字体包中，选择这些文件：

```
NotoSansSC-Regular.ttf    (必需 - 正常字体)
NotoSansSC-Bold.ttf       (必需 - 粗体)
NotoSansSC-Medium.ttf     (可选 - 中粗，可替代粗体)
NotoSansSC-Light.ttf      (可选 - 细体)
```

**最小配置**: 只需 Regular + Bold（约 12-16 MB）

### 3️⃣ 放置字体文件

```bash
# 在项目中创建字体目录
public/
└── fonts/
    ├── NotoSansSC-Regular.ttf
    ├── NotoSansSC-Bold.ttf
    └── (可选) NotoSansSC-Medium.ttf
```

### 4️⃣ 修改字体加载代码

修改 `src/utils/export/pdfFontHelper.js`:

```javascript
/**
 * 为PDF添加中文字体支持（多字重版本）
 */
export async function addChineseFontSupport(pdf) {
  console.log('[PDF字体] 开始加载 Noto Sans SC 字体家族...');

  // 定义字体配置
  const fontConfigs = [
    {
      path: '/fonts/NotoSansSC-Regular.ttf',
      name: 'NotoSansSC',
      style: 'normal',
      weight: 400
    },
    {
      path: '/fonts/NotoSansSC-Bold.ttf',
      name: 'NotoSansSC',
      style: 'bold',
      weight: 700
    },
    // 可选：中粗体
    // {
    //   path: '/fonts/NotoSansSC-Medium.ttf',
    //   name: 'NotoSansSC',
    //   style: 'medium',
    //   weight: 500
    // },
  ];

  let loadedCount = 0;
  let fontName = 'helvetica';

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
        console.log(`[PDF字体] ✓ 加载成功: ${config.name}-${config.style}`);
      }
    } catch (error) {
      console.warn(`[PDF字体] ✗ 加载失败: ${config.path}`, error);
    }
  }

  if (loadedCount === 0) {
    console.warn('[PDF字体] 未能加载任何字体，使用默认 helvetica');
    pdf.setFont('helvetica');
    return { success: false, fontName: 'helvetica' };
  }

  console.log(`[PDF字体] 成功加载 ${loadedCount} 个字体变体`);
  return { success: true, fontName };
}
```

### 5️⃣ 修改字体加载函数

更新 `loadFontFromProject` 函数以支持样式参数：

```javascript
async function loadFontFromProject(pdf, fontPath, fontName, fontStyle = 'normal') {
  try {
    console.log(`[PDF字体] 正在加载: ${fontPath} (${fontStyle})`);

    // ... 现有的加载逻辑 ...

    // 添加字体时指定样式
    pdf.addFileToVFS(fileName, base64);
    pdf.addFont(fileName, fontName, fontStyle); // 关键：指定 style

    console.log(`[PDF字体] 字体加载成功: ${fontName}-${fontStyle}`);
    return true;
  } catch (error) {
    console.error('[PDF字体] 字体加载失败:', error);
    return false;
  }
}
```

### 6️⃣ 更新 pdfExportManager.js

现在可以安全地使用字体变体：

```javascript
// 粗体标题
this.pdf.setFont('NotoSansSC', 'bold');  // ✅ 现在有 bold 变体了
this.pdf.text(headingText, x, y);

// 正常文本
this.pdf.setFont('NotoSansSC', 'normal');
this.pdf.text(bodyText, x, y);

// 如果加载了 Medium
this.pdf.setFont('NotoSansSC', 'medium');
```

## 📊 对比分析

### 文件大小

| 方案 | 文件数 | 总大小 | 说明 |
|------|--------|--------|------|
| 当前 (Sarasa) | 1 | 23 MB | 等宽字体，文件大 |
| Noto Sans (最小) | 2 | 12-16 MB | Regular + Bold |
| Noto Sans (完整) | 7 | 42-56 MB | 所有字重 |

**推荐**: 只使用 Regular + Bold（12-16 MB）

### 渲染效果

| 特性 | Sarasa Mono | Noto Sans SC |
|------|-------------|--------------|
| 中文支持 | ✅ | ✅ |
| 粗体变体 | ❌ | ✅ |
| 等宽字体 | ✅ | ❌ |
| 代码友好 | ✅ | ❌ |
| 正文友好 | ⚠️ | ✅ |

### 混合方案（最佳）

```javascript
// 正文使用 Noto Sans SC (有粗体)
this.pdf.setFont('NotoSansSC', 'normal');

// 代码块使用 Courier (等宽)
this.pdf.setFont('courier', 'normal');
```

## 🚀 实施步骤

### 步骤 1: 下载字体
```bash
# 下载 Noto Sans SC
wget https://github.com/googlefonts/noto-cjk/releases/download/Sans2.004/03_NotoSansCJKsc.zip

# 解压
unzip 03_NotoSansCJKsc.zip

# 复制到项目
cp NotoSansSC-Regular.otf public/fonts/NotoSansSC-Regular.ttf
cp NotoSansSC-Bold.otf public/fonts/NotoSansSC-Bold.ttf
```

**注意**: 如果下载的是 OTF 格式，建议转换为 TTF：
- 在线工具: https://convertio.co/otf-ttf/
- 或使用 FontForge

### 步骤 2: 修改代码

我可以为您自动修改代码，需要吗？

### 步骤 3: 测试

```bash
npm start

# 导出一个包含以下内容的对话测试：
# - **粗体文本**
# - *斜体文本*
# - ## 标题
# - 普通文本
```

## ⚠️ 注意事项

### 1. 斜体问题

Noto Sans SC **没有斜体变体**（中文字体通常没有）。

**解决方案**:
```javascript
// 斜体降级到 normal，但使用颜色区分
case 'italic':
  this.pdf.setFont('NotoSansSC', 'normal');
  this.pdf.setTextColor(70, 130, 180); // 蓝色表示强调
  break;
```

### 2. 等宽字体

代码块应该继续使用 `courier`:
```javascript
// 代码块
this.pdf.setFont('courier', 'normal');

// 正文
this.pdf.setFont('NotoSansSC', 'normal');
```

### 3. 回退机制

```javascript
try {
  this.pdf.setFont('NotoSansSC', 'bold');
} catch (error) {
  // 如果 bold 不存在，回退到 normal
  console.warn('Bold 字体不可用，使用 normal');
  this.pdf.setFont('NotoSansSC', 'normal');
}
```

## 🎨 推荐配置

### 配置 1: 最小化（推荐）✅

```
只使用 2 个字体文件：
- NotoSansSC-Regular.ttf (6-8 MB)
- NotoSansSC-Bold.ttf (6-8 MB)

支持:
✅ 正常文本
✅ 粗体标题
✅ 粗体强调
❌ 斜体（用颜色代替）
```

### 配置 2: 完整

```
使用 4 个字体文件：
- Regular
- Bold
- Medium (替代斜体)
- Light (可选)

文件大小: ~24-32 MB
```

## 📝 总结

1. **下载** Noto Sans SC Regular + Bold
2. **放置** 到 `public/fonts/`
3. **修改** `pdfFontHelper.js` 加载两个字体
4. **更新** `pdfExportManager.js` 使用粗体
5. **测试** PDF 导出效果

现在可以支持：
- ✅ **粗体标题**
- ✅ **粗体强调文本**
- ✅ 正常文本
- ⚠️ 斜体用颜色代替

需要我帮您实施这些修改吗？
