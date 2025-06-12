# 🎯 Drag & Drop Builder System

A comprehensive drag and drop system integrated with `react-grid-layout` for the OnAim Builder application. This system provides intuitive component arrangement with persistent layouts, responsive design support, and seamless integration with the existing builder architecture.

## ✨ Features

- **🖱️ Drag & Drop Interface**: Intuitive component positioning with visual feedback
- **📱 Responsive Design**: Separate layouts for desktop and mobile views
- **💾 Auto-Save**: Automatic layout persistence with localStorage and server sync
- **🎛️ Control Panel**: Easy toggle between drag mode and normal view
- **🔄 Layout Management**: Save, load, and reset layout configurations
- **⚡ Performance Optimized**: Efficient rendering with React memoization
- **🎨 Beautiful UI**: Modern interface with smooth animations

## 🚀 Quick Start

### Basic Usage

```tsx
import { EnhancedContentRenderer } from '@/content-renderer';

function MyBuilder() {
  return (
    <EnhancedContentRenderer
      components={components}
      viewMode="desktop"
      projectId="my-project"
      showDragDropControls={true}
      enableDragDropByDefault={false}
      autoSaveLayouts={true}
    />
  );
}
```

### Manual Control

```tsx
import { ContentRenderer, DragDropControls, useDragAndDropLayouts } from '@/content-renderer';

function CustomBuilder() {
  const [isDragDropEnabled, setIsDragDropEnabled] = useState(false);
  
  const {
    layouts,
    updateLayouts,
    resetLayouts,
    saveLayouts,
    loadLayouts,
    isLoading,
    hasUnsavedChanges,
  } = useDragAndDropLayouts({
    projectId: 'custom-project',
    viewMode: 'desktop',
    autoSave: true,
  });

  return (
    <div>
      <DragDropControls
        isDragDropEnabled={isDragDropEnabled}
        onToggleDragDrop={setIsDragDropEnabled}
        onResetLayout={resetLayouts}
        onSaveLayout={saveLayouts}
        onLoadLayout={loadLayouts}
        hasUnsavedChanges={hasUnsavedChanges}
        isLoading={isLoading}
        layouts={layouts}
        viewMode="desktop"
      />
      
      <ContentRenderer
        components={components}
        viewMode="desktop"
        useDragAndDrop={isDragDropEnabled}
        onLayoutChange={updateLayouts}
        savedLayouts={layouts}
      />
    </div>
  );
}
```

## 🏗️ Architecture

### Components

```
src/app/features/builder/ui/content-renderer/
├── components/
│   ├── draggable-grid-layout.tsx      # Main grid layout component
│   ├── drag-drop-controls.tsx         # Control panel
│   ├── enhanced-content-renderer.tsx  # All-in-one wrapper
│   └── content-renderer.tsx           # Updated base renderer
├── hooks/
│   └── useDragAndDropLayouts.ts       # Layout management hook
├── layouts/
│   ├── desktop-layout.tsx             # Desktop grid support
│   └── mobile-layout.tsx              # Mobile grid support
└── examples/
    └── DragDropExample.tsx             # Demo component
```

### Server Integration

```
server/
├── routes/
│   └── layouts.js                     # API endpoints
└── data/
    └── layouts/                       # Stored layout files
        ├── project1.json
        └── project2.json
```

## 🔧 Configuration

### Grid Settings

The system uses different grid configurations for desktop and mobile:

**Desktop Grid:**
- Breakpoints: `{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }`
- Columns: `{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }`
- Row Height: `100px`

**Mobile Grid:**
- Breakpoints: `{ lg: 768, md: 576, sm: 480, xs: 320, xxs: 0 }`
- Columns: `{ lg: 2, md: 2, sm: 1, xs: 1, xxs: 1 }`
- Row Height: `120px`

### Layout Storage

Layouts are stored in multiple locations for reliability:

1. **localStorage**: Immediate local persistence
2. **Server API**: Centralized storage via `/api/layouts`
3. **Auto-save**: Configurable delay (default: 1000ms)

## 📱 Responsive Behavior

### Desktop Mode
- 12-column grid system
- Components can span multiple columns
- Horizontal and vertical arrangement
- Resize handles on bottom-right

### Mobile Mode
- Simplified 2-column maximum
- Stacked layout priority
- Touch-friendly interactions
- Optimized for smaller screens

## 🎛️ Control Panel Features

### Main Toggle
- **🔒 Drag & Drop OFF**: Normal view mode
- **🔓 Drag & Drop ON**: Grid editing mode

### Expanded Controls
- **Layout Info**: Current view mode and item count
- **💾 Save Layout**: Manual save to server
- **📁 Load Layout**: Restore from server
- **🔄 Reset Layout**: Clear all positioning
- **Help Tips**: Usage instructions

### Status Indicators
- **● Unsaved changes**: Red dot when changes pending
- **⟳ Saving...**: Loading indicator during save
- **✓ Saved!**: Success confirmation
- **✗ Error**: Error state indication

## 🌐 API Endpoints

### Get Layouts
```http
GET /api/layouts/:projectId
```

### Save Layouts
```http
POST /api/layouts
Content-Type: application/json

{
  "projectId": "string",
  "layouts": "Layouts object",
  "viewMode": "desktop|mobile",
  "metadata": "object (optional)"
}
```

### Delete Layouts
```http
DELETE /api/layouts/:projectId
```

### List Projects
```http
GET /api/layouts
```

## 💡 Usage Examples

### Example 1: Basic Builder
```tsx
import { EnhancedContentRenderer } from '@/content-renderer';

<EnhancedContentRenderer
  components={myComponents}
  viewMode="desktop"
  projectId="website-builder"
/>
```

### Example 2: Custom Integration
```tsx
import { useDragAndDropLayouts, DraggableGridLayout } from '@/content-renderer';

const { layouts, updateLayouts } = useDragAndDropLayouts({
  projectId: 'custom',
  viewMode: 'desktop'
});

<DraggableGridLayout
  instances={componentInstances}
  viewMode="desktop"
  onRetry={handleRetry}
  onLayoutChange={updateLayouts}
  savedLayouts={layouts}
/>
```

### Example 3: View Mode Switching
```tsx
const [viewMode, setViewMode] = useState('desktop');

<EnhancedContentRenderer
  components={components}
  viewMode={viewMode}
  projectId="responsive-site"
  key={viewMode} // Force re-render on mode change
/>
```

## 🎨 Styling & Customization

### CSS Custom Properties
```css
:root {
  --grid-gap: 10px;
  --grid-bg: #f8f9fa;
  --item-border-radius: 8px;
  --drag-handle-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Component Classes
- `.gridContainer`: Main grid wrapper
- `.gridItem`: Individual component wrapper
- `.dragHandle`: Draggable header area
- `.componentWrapper`: Component content area

## 🔍 Troubleshooting

### Common Issues

**Components not draggable:**
- Ensure `useDragAndDrop` is `true`
- Check that `draggableHandle` selector matches

**Layouts not saving:**
- Verify `projectId` is provided
- Check server endpoint connectivity
- Ensure localStorage permissions

**Grid not responsive:**
- Confirm breakpoint configuration
- Check viewport meta tag
- Verify CSS imports

### Debug Mode
```tsx
// Enable debug logging
localStorage.setItem('debug-drag-drop', 'true');
```

## 🚧 Development

### Running the Example
```bash
cd src/app/features/builder/ui/content-renderer/examples
# Import and use DragDropExample component
```

### Testing Layouts
```bash
# Start server with layout endpoints
npm run server

# Test API endpoints
curl http://localhost:3000/api/layouts
```

### Development Tips
1. Use React DevTools to inspect layout state
2. Check browser console for drag events
3. Monitor network tab for save/load operations
4. Test on different screen sizes

## 📈 Performance

### Optimizations
- **React.memo**: All components memoized
- **useCallback**: Event handlers optimized
- **useMemo**: Grid configurations cached
- **Debounced saves**: Prevents excessive API calls

### Monitoring
```tsx
// Performance monitoring
const layoutChangeHandler = useCallback((layouts) => {
  console.time('layout-update');
  updateLayouts(layouts);
  console.timeEnd('layout-update');
}, [updateLayouts]);
```

## 🤝 Contributing

1. Follow the existing component structure
2. Add proper TypeScript types
3. Include CSS modules for styling
4. Write unit tests for new features
5. Update documentation

## 📄 License

Part of the OnAim Builder project. See main project license for details.

---

**🎯 Ready to drag and drop? Start building beautiful layouts today!** 