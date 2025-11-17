# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lyra Exporter** is a React-based web application for managing and exporting AI chat conversations from multiple platforms (Claude, ChatGPT, Gemini, NotebookLM, Google AI Studio, SillyTavern). It runs as a PWA with optional Tauri desktop support.

**Tech Stack**: React 19.1 + TailwindCSS 3.4 + Create React App (no TypeScript, uses JavaScript)

## Development Commands

```bash
# Start development server on port 3789 (network accessible)
npm start

# Start on localhost only
npm run start:local

# Production build
npm run build

# Deploy to GitHub Pages
npm run deploy

# Tauri desktop app (optional)
npm run tauri:dev    # Development
npm run tauri:build  # Production build
```

**Port**: Development server runs on port **3789** by default.

## Architecture Overview

### State Management Pattern

The application uses **centralized state management** in `App.js` (1,295 lines) with React hooks. No Redux or external state library is used. State is persisted to `localStorage` for:
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
```
ExportPanel.js (user configuration)
           ↓
    exportManager.js → MarkdownGenerator
           ↓
    formatHelpers.js → Content formatting
           ↓
    batchExportManager.js → ZIP for multiple files
           ↓
    file-saver → Download
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
├── components/         # UI components (12 files)
│   ├── WelcomePage.js          # Landing page
│   ├── UnifiedCard.js          # Conversation card grid view
│   ├── ConversationTimeline.js # Timeline view for messages
│   ├── MessageDetail.js        # Message detail modal with tabs
│   ├── ExportPanel.js          # Export configuration UI
│   └── ...
│
├── utils/              # Business logic (pure functions + managers)
│   ├── fileParser.js           # Platform-specific chat parsers (1,742 lines)
│   ├── exportManager.js        # Markdown export logic
│   ├── batchExportManager.js   # ZIP batch export
│   ├── searchManager.js        # Local search
│   ├── globalSearchManager.js  # Cross-conversation search
│   ├── themeManager.js         # Light/dark theme
│   └── data/                   # Data management modules
│       ├── markManager.js      # Tag system (completed/important/deleted)
│       ├── starManager.js      # Favorites system
│       ├── sortManager.js      # Sorting logic
│       ├── statsCalculator.js  # Statistics
│       └── uuidManager.js      # UUID generation for storage keys
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
- Include/exclude: timestamps, thinking processes, Artifacts, tool calls, citations
- Scope: current conversation, operated (tagged), or all
- Format: Markdown (future: PDF, image)

### localStorage Keys

Prefix all localStorage keys with `lyra_` to avoid conflicts:
- `lyra_marks_${fileUUID}_${messageUUID}` - Tag data
- `lyra_stars_${fileUUID}` - Star status
- `lyra_settings` - User settings
- `lyra_theme` - Theme preference
- `lyra_language` - Language preference

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
2. Modify `exportManager.js` to handle new option
3. Update `formatHelpers.js` if content formatting changes
4. Test with different conversation types

### Modifying Message Display

1. Update `MessageDetail.js` for detail view changes
2. Update `ConversationTimeline.js` for timeline view changes
3. Ensure markdown rendering in `react-markdown` handles new format
4. Update syntax highlighter config if needed

## Testing Strategy

No automated tests currently exist. Manual testing focuses on:
1. **File parsing**: Test with real exports from each platform
2. **Export accuracy**: Verify Markdown output matches source
3. **Tag persistence**: Verify tags survive page refresh
4. **Search accuracy**: Test with various search terms
5. **Branch detection**: Test with conversations containing branches
6. **Cross-browser**: Test on Chrome, Firefox, Safari

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
