# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lyra Exporter** is a React-based web application for managing and exporting AI chat conversations from multiple platforms (Claude, ChatGPT, Gemini, NotebookLM, Google AI Studio, SillyTavern). It runs as a PWA with optional Tauri desktop support.

**Tech Stack**: React 19.1 + TailwindCSS 3.4 + Create React App (no TypeScript, uses JavaScript)

**Key Features**:
- Multi-platform chat import (Claude, ChatGPT, Gemini, NotebookLM, Google AI Studio, SillyTavern)
- Three export formats: Markdown, PDF (with Chinese font support), and Screenshot/Image
- LaTeX/Math rendering via KaTeX
- Tag system (completed ✅, important ⭐, deleted 🗑️) with cross-file statistics
- Branch detection and visualization for conversation trees
- Global search across all imported conversations

## Development Commands

```bash
# Start development server on port 3789 (network accessible)
npm start

# Start on localhost only
npm run start:local

# Start with network access (explicit)
npm run start:network

# Production build
npm run build

# Deploy to GitHub Pages
npm run deploy

# Tauri desktop app (optional)
npm run tauri:dev    # Development
npm run tauri:build  # Production build
```

**Port**: Development server runs on port **3789** by default.

## Dependencies

**Core Framework**:
- `react` ^19.1.0 - UI framework
- `react-dom` ^19.1.0 - React DOM renderer
- `react-scripts` 5.0.1 - Create React App build tools

**Styling**:
- `tailwindcss` ^3.4.17 - Utility-first CSS framework
- `@tailwindcss/postcss` ^4.1.7 - Tailwind v4 PostCSS plugin (dev)
- `postcss` ^8.5.3 - CSS transformations
- `autoprefixer` ^10.4.21 - Vendor prefix automation

**Export & File Handling**:
- `file-saver` ^2.0.5 - File download utility
- `jszip` ^3.10.1 - ZIP file creation for batch exports
- `jspdf` ^3.0.3 - PDF generation
- `html2canvas` ^1.4.1 - DOM to canvas/image conversion

**Markdown & Content Rendering**:
- `react-markdown` ^8.0.7 - Markdown rendering component
- `remark-gfm` ^3.0.1 - GitHub Flavored Markdown support
- `remark-math` ^6.0.0 - Math notation parsing for Markdown
- `rehype-katex` ^7.0.1 - KaTeX rendering for math in HTML
- `katex` ^0.16.23 - Math typesetting library
- `react-syntax-highlighter` ^15.5.0 - Code syntax highlighting

**UI Components**:
- `lucide-react` ^0.511.0 - Icon library

**Build & Development**:
- `cross-env` ^7.0.3 - Cross-platform environment variables
- `gh-pages` ^6.3.0 - GitHub Pages deployment
- `@tauri-apps/cli` ^2.5.0 - Tauri CLI for desktop builds (optional)
- `@tauri-apps/api` ^2.5.0 - Tauri API for desktop features
- `concurrently` ^9.1.2 - Run multiple commands
- `wait-on` ^8.0.3 - Wait for resources before proceeding

## Architecture Overview

### State Management Pattern

The application uses **centralized state management** in `App.js` (1,324 lines) with React hooks. No Redux or external state library is used. State is persisted to `localStorage` for:
- Tag system (completed ✅, important ⭐, deleted 🗑️)
- Starred conversations
- User settings (theme, language, export preferences)

### Key Data Flow Pipelines

**1. File Import Pipeline**
```
File Upload → fileParser.js → detectFileFormat()
           ↓
    Platform-specific parser (extractClaudeData, extractChatGPTData, etc.)
           ↓
    detectBranches() → Analyze conversation tree structure
           ↓
    dataProcessor.js → Normalize to internal format
           ↓
    App.js state → UI rendering
```

**2. Export Pipeline**

The app supports three export formats:

```
ExportPanel.js (user configuration: Markdown/PDF/Screenshot)
           ↓
    ┌──────┴──────────────────────────┐
    │                                 │
    ▼                                 ▼
Markdown Export                   Image Export
exportManager.js                  screenshotExportManager.js
    ↓                                 ↓
formatHelpers.js              html2canvas → PNG/JPG
    ↓                                 ↓
batchExportManager.js         JSZip (multi-image)
    ↓                                 │
file-saver                            │
    │                                 │
    └─────────────┬───────────────────┘
                  ▼
            PDF Export
        pdfExportManager.js
                  ↓
        pdfFontHelper.js (ARUDJingxihei fonts)
                  ↓
            jsPDF → PDF
                  ↓
            file-saver
```

**3. Cross-Window Communication**

The app integrates with the **Lyra Exporter Fetch** Tampermonkey script via `postMessageHandler.js`:
- Receives chat data from claude.ai, chatgpt.com, gemini.google.com, etc.
- Validates allowed origins in `API_CONFIG.ALLOWED_ORIGINS`
- Handles both single conversation and full account exports

### Directory Architecture

```
src/
├── App.js              # Main component - centralized state management
├── index.js            # Bootstrap + i18n initialization
│
├── components/         # UI components (15 files)
│   ├── WelcomePage.js               # Landing page
│   ├── UnifiedCard.js               # Conversation card grid view
│   ├── ConversationTimeline.js      # Timeline view for messages (76,922 lines)
│   ├── MessageDetail.js             # Message detail modal with tabs
│   ├── ExportPanel.js               # Export configuration UI (supports 3 formats)
│   ├── EditableChatBubble.js        # Editable message bubble component
│   ├── ChatBubbleScreenshot.js      # Read-only bubble for screenshot export
│   ├── ScreenshotPreviewPanel.js    # Screenshot export preview
│   ├── NodeLocatorPanel.js          # Message navigation panel
│   ├── SettingsManager.js           # User settings and preferences
│   ├── PlatformIcon.js              # Platform-specific icons (46,312 lines)
│   ├── FullExportCardFilter.js      # Filter UI for conversation list
│   ├── EnhancedSearchBox.js         # Search with filters
│   ├── FloatingActionButton.js      # FAB for quick actions
│   └── LanguageSwitcher.js          # i18n language selector
│
├── utils/              # Business logic (pure functions + managers)
│   ├── fileParser.js           # Platform-specific chat parsers (1,742 lines)
│   ├── exportManager.js        # Markdown export logic (26,545 lines)
│   ├── batchExportManager.js   # ZIP batch export (14,634 lines)
│   ├── searchManager.js        # Local search
│   ├── globalSearchManager.js  # Cross-conversation search (15,576 lines)
│   ├── themeManager.js         # Light/dark theme
│   ├── copyManager.js          # Unified copy functionality (9,003 lines)
│   ├── renameManager.js        # Conversation renaming (2,332 lines)
│   ├── formatHelpers.js        # Content formatting utilities (6,875 lines)
│   ├── data/                   # Data management modules
│   │   ├── markManager.js      # Tag system (completed/important/deleted)
│   │   ├── starManager.js      # Favorites system
│   │   ├── sortManager.js      # Sorting logic
│   │   ├── statsCalculator.js  # Statistics
│   │   ├── uuidManager.js      # UUID generation for storage keys
│   │   ├── postMessageHandler.js # Cross-window messaging
│   │   ├── dataProcessor.js    # Data normalization
│   │   └── index.js            # Data module exports
│   └── export/                 # Export format handlers
│       ├── pdfExportManager.js        # PDF export with jsPDF (62,296 lines)
│       ├── pdfFontHelper.js           # ARUDJingxihei font loader (8,463 lines)
│       └── screenshotExportManager.js # Screenshot/image export (9,131 lines)
│
├── styles/             # CSS modules (13 files)
│   ├── variables.css   # CSS custom properties
│   └── ...
│
└── langs/              # i18n language packs (5 languages)
    ├── en.json
    ├── zh.json         # Simplified Chinese
    ├── zh_.json        # Traditional Chinese
    ├── ja.json
    └── ko.json
```

### Manager Pattern

The codebase uses a **Manager pattern** for feature organization. Each manager is a module with focused responsibility:

- **markManager.js**: Tag system with three types (completed ✅, important ⭐, deleted 🗑️)
- **starManager.js**: Star/favorite conversations
- **sortManager.js**: Sorting algorithms (by time, title, custom)
- **exportManager.js**: Markdown generation with configurable options
- **batchExportManager.js**: Handles multi-file ZIP exports
- **searchManager.js** / **globalSearchManager.js**: Search functionality
- **copyManager.js**: Unified copy functionality with configurable options (thinking, artifacts, metadata)
- **renameManager.js**: Conversation title editing
- **pdfExportManager.js**: PDF export with Markdown/LaTeX rendering and Chinese font support
- **screenshotExportManager.js**: Image export using html2canvas with height-based splitting

All managers follow a functional programming style with pure functions and explicit state passing.

### Internationalization System

Custom lightweight i18n system (no i18next dependency):
- Language detection from browser preferences
- Dynamic language pack loading from `src/langs/`
- Hook-based API: `useI18n()` provides `t(key)` function
- Supports 5 languages: en, zh, zh_ (Traditional), ja, ko
- Initialization in `index.js`

### Platform Support

The file parser (`src/utils/fileParser.js`) supports:
- **Claude**: Single conversation + full account export (with projects, Artifacts, thinking)
- **ChatGPT**: Single + full account export
- **Gemini**: Including multi-branch format
- **NotebookLM**: NotebookLM export format
- **Google AI Studio**: AI Studio format
- **SillyTavern**: JSONL with branch support

Format detection is automatic via `detectFileFormat()`.

### Export Format System

**Three export formats** are supported, each optimized for different use cases:

#### 1. Markdown Export (exportManager.js)
- **Format**: Plain text Markdown files (.md)
- **Features**:
  - GitHub-flavored Markdown with code syntax highlighting markers
  - Configurable inclusion of: timestamps, thinking processes, Artifacts, tool calls, citations
  - Tag markers preserved ([✅ COMPLETED], [⭐ IMPORTANT])
  - Branch information embedded as comments
  - Batch export to ZIP for multiple conversations
- **Use case**: Text processing, version control, documentation, archival
- **Dependencies**: file-saver, jszip

#### 2. PDF Export (pdfExportManager.js)
- **Format**: PDF documents with embedded fonts (.pdf)
- **Features**:
  - **Chinese font support**: ARUDJingxihei family (Regular, Bold, Light) embedded
  - **Markdown rendering**: Headings, bold, italic, lists, blockquotes, code blocks
  - **LaTeX/Math support**: KaTeX-rendered formulas displayed as text representations
  - **Smart formatting**: Auto-wrapping, syntax highlighting for code, message threading
  - **Page layout**: A4 size, headers/footers, page numbers, table of contents (optional)
  - Font validation (TTF magic number, file size, Unicode cmap table)
- **Use case**: Sharing, printing, archival with formatting preserved
- **Dependencies**: jspdf, katex
- **Font location**: `public/fonts/ARUDJingxihei-{Regular,Bold,Light}.ttf` (required, ~3-6 MB each)

#### 3. Screenshot/Image Export (screenshotExportManager.js)
- **Format**: PNG or JPG images (.png/.jpg)
- **Features**:
  - **Visual fidelity**: Captures exact UI appearance including colors, avatars, icons
  - **Height-based splitting**: Automatically splits long conversations into multiple images
  - **Configurable**: Image width, height limit per file, scale/DPI, theme (light/dark)
  - **Batch export**: Multiple images packaged in ZIP
  - Platform-specific styling preserved
- **Use case**: Social sharing, visual documentation, presentations
- **Dependencies**: html2canvas, jszip, file-saver
- **Components**: ChatBubbleScreenshot.js (read-only bubble renderer)

### LaTeX and Math Rendering

The application supports **mathematical formulas** in messages using KaTeX:

- **Display**: Inline math `$...$` and block math `$$...$$`
- **Rendering pipeline**:
  - Markdown: `react-markdown` + `remark-math` + `rehype-katex`
  - PDF: KaTeX parsed and rendered as formatted text with font styling
- **Supported formats**: LaTeX standard syntax, equations, matrices, symbols
- **Dependencies**: `katex`, `remark-math`, `rehype-katex`

Example:
```markdown
Einstein's famous equation: $E = mc^2$

Quadratic formula:
$$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$$
```

### Font System (PDF Export)

PDF export uses the **ARUDJingxihei (阿如汉字黑体)** open-source font family:

**Font Files** (located in `public/fonts/`):
- `ARUDJingxihei-Regular.ttf` - Body text, normal weight (~9.8 MB)
- `ARUDJingxihei-Bold.ttf` - Headings, bold emphasis (~9.9 MB)
- `ARUDJingxihei-Light.ttf` - Italic fallback, light text (~9.6 MB)

**Font Loading** (`pdfFontHelper.js`):
1. Fetch font files from `public/fonts/` directory
2. Validate TTF format (magic number `0x00010000`)
3. Check file size (must be > 500 KB)
4. Verify Content-Type (should contain 'font' or 'octet-stream')
5. Check for Unicode cmap table presence
6. Embed into jsPDF document with `addFileToVFS()` and `addFont()`

**Fallback**: If fonts fail to load or validate, system falls back to `helvetica` (Chinese may display as boxes ☐).

**Character Coverage**: Supports Simplified Chinese, Traditional Chinese, Japanese Kanji, Korean Hanja, and Latin characters.

### Branch Detection Algorithm

Conversations can have multiple branches (user edits a previous message and continues from there). Branch detection logic in `detectBranches()`:
1. Build parent-child relationships from message UUIDs
2. Identify branch points (messages with multiple children)
3. Construct all possible paths from root to leaves
4. Store branch metadata for UI visualization

### Tag System (Marks)

Tags are stored in `localStorage` with UUID-based keys:
- Format: `lyra_marks_${fileUUID}_${messageUUID}`
- Three tag types: `completed`, `important`, `deleted`
- Cross-file statistics calculated on demand
- Tag preservation during Markdown export (adds markers like `[✅ COMPLETED]`)

### Security Considerations

1. **postMessage validation**: Only accept messages from whitelisted origins in `API_CONFIG.ALLOWED_ORIGINS`
2. **File size limits**: `FILE_LIMITS.MAX_FILE_SIZE` (100MB)
3. **JSON-only validation**: Reject non-JSON files
4. **XSS prevention**: All user content sanitized before rendering
5. **localStorage isolation**: UUID prefixes prevent key collisions

## Code Patterns

### Component Structure

Most components follow this pattern:
```javascript
function Component({ prop1, prop2 }) {
  const { t } = useI18n();  // i18n hook
  const [state, setState] = useState(initialState);

  // Event handlers
  const handleAction = useCallback(() => {
    // Logic here
  }, [dependencies]);

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Manager Module Pattern

```javascript
// Manager modules export object with methods
export const SomeManager = {
  doSomething(data, options) {
    // Pure function logic
    return result;
  },

  anotherMethod(data) {
    // Implementation
  }
};
```

### State Updates in App.js

App.js manages global state and passes handlers down to components:
```javascript
// In App.js
const [conversations, setConversations] = useState([]);
const [currentView, setCurrentView] = useState('welcome');

// Passed to child components
<Component
  onAction={handleAction}
  data={conversations}
/>
```

## Important Implementation Notes

### Adding Platform Support

To add a new AI platform:
1. Add parser function in `src/utils/fileParser.js` (e.g., `extractNewPlatformData()`)
2. Update `detectFileFormat()` to recognize the format
3. Ensure output matches internal conversation schema
4. Update `ALLOWED_ORIGINS` if using companion script integration

### Export Configuration

Export options are in `ExportPanel.js`:
- **Format selection**: Markdown, PDF, or Screenshot
- **Include/exclude**: timestamps, thinking processes, Artifacts, tool calls, citations, Canvas items
- **Scope**: current conversation, operated (tagged), starred, or all
- **Screenshot-specific**: width, height limit, scale, image format (PNG/JPG), theme
- **PDF-specific**: font loading, page layout, table of contents, syntax highlighting

### localStorage Keys

Prefix all localStorage keys with `lyra_` to avoid conflicts:
- `lyra_marks_${fileUUID}_${messageUUID}` - Tag data
- `lyra_stars_${fileUUID}` - Star status
- `lyra_settings` - User settings
- `lyra_theme` - Theme preference
- `lyra_language` - Language preference
- `export-config` - Export preferences (format, options)
- `copy_options` - Copy functionality settings (thinking format, include options)

### Styling with TailwindCSS

The project uses TailwindCSS with custom CSS modules:
- Tailwind for utilities (flex, padding, colors)
- Custom CSS in `src/styles/` for complex components
- CSS variables in `variables.css` for theming
- Dark mode via CSS classes (`.dark` on `<html>`)

## Common Development Scenarios

### Adding a New Filter

1. Add UI in `src/components/FullExportCardFilter.js`
2. Add filter logic in App.js's `filteredConversations` useMemo
3. Update filter state in App.js
4. Pass filter handler to FullExportCardFilter component

### Adding Export Options

1. Update `ExportPanel.js` UI to add new checkbox/option
2. Modify the appropriate export manager:
   - `exportManager.js` for Markdown changes
   - `pdfExportManager.js` for PDF changes
   - `screenshotExportManager.js` for screenshot changes
3. Update `formatHelpers.js` if content formatting logic is shared across formats
4. Test with different conversation types and platforms
5. Update i18n language files (`src/langs/*.json`) with new option labels

### Modifying Message Display

1. Update `MessageDetail.js` for detail view changes
2. Update `ConversationTimeline.js` for timeline view changes (note: 76,922 lines, very large file)
3. Update `EditableChatBubble.js` for interactive bubble changes
4. Update `ChatBubbleScreenshot.js` for screenshot rendering (should match EditableChatBubble structure)
5. Ensure markdown rendering in `react-markdown` handles new format
6. Update syntax highlighter config if needed
7. Test with all supported platforms to ensure styling consistency

### Adding New Copy Features

The `copyManager.js` provides unified copy functionality. To add new copy options:

1. Update `CopyConfigManager.getConfig()` with new default option
2. Add formatting logic in `MessageFormatter.format()` method
3. Update UI in components that use copy functionality (MessageDetail, ConversationTimeline)
4. Update localStorage schema for persisting user preferences
5. Add i18n translations for new option labels

### Working with Fonts

When modifying the PDF export font system:

1. **Fonts must be placed** in `public/fonts/` directory
2. **Font files** must be TTF format with `.ttf` extension
3. **Validation requirements**:
   - TTF magic number check (first 4 bytes: `0x00010000`)
   - Minimum file size: 500 KB (normal CJK fonts are 3-10 MB)
   - Must contain Unicode cmap table
4. **Font registration** in `pdfFontHelper.js`:
   ```javascript
   doc.addFileToVFS('fontname.ttf', fontDataBase64);
   doc.addFont('fontname.ttf', 'FontFamily', 'normal');
   ```
5. **Testing**: Verify with Chinese, Japanese, Korean, and special characters
6. **Fallback**: Always implement graceful degradation to system fonts

## Testing Strategy

No automated tests currently exist. Manual testing focuses on:
1. **File parsing**: Test with real exports from each platform (Claude, ChatGPT, Gemini, etc.)
2. **Export accuracy**:
   - Verify Markdown output matches source content
   - PDF rendering with Chinese characters, LaTeX formulas, code blocks
   - Screenshot visual fidelity and height-based splitting
3. **Font loading**: Test PDF export with and without font files present
4. **Tag persistence**: Verify tags survive page refresh
5. **Search accuracy**: Test with various search terms, including CJK characters
6. **Branch detection**: Test with conversations containing branches
7. **Cross-browser**: Test on Chrome, Firefox, Safari
8. **Math rendering**: Verify KaTeX formulas display correctly in UI and exports
9. **Copy functionality**: Test all copy options (with/without thinking, artifacts, metadata)
10. **i18n**: Verify all 5 languages load and display correctly

## Deployment

**GitHub Pages**:
```bash
npm run deploy
```
Builds and deploys to `gh-pages` branch at https://yalums.github.io/lyra-exporter

**Tauri Desktop** (optional):
```bash
npm run tauri:build
```
Creates native desktop app with system file access.

## Privacy & Data Handling

- **No backend**: All processing happens client-side
- **No analytics**: No tracking or telemetry
- **No network requests**: Except companion script integration via postMessage
- **Local storage only**: Tags and settings stored in browser localStorage
- All data remains on user's device
