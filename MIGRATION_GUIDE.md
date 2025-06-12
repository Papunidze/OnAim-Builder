# 🔄 Migration Guide: Adding Drag & Drop to Existing Components

This guide helps you integrate the new drag and drop functionality into your existing OnAim Builder components.

## 📋 Pre-Migration Checklist

- [ ] Backup your current component configurations
- [ ] Ensure `react-grid-layout` is installed (already done)
- [ ] Review current component structure
- [ ] Test with a small subset of components first

## 🚀 Quick Migration (Recommended)

### Step 1: Replace ContentRenderer

**Before:**
```tsx
import { ContentRenderer } from '@/content-renderer';

<ContentRenderer
  components={components}
  viewMode={viewMode}
/>
```

**After:**
```tsx
import { EnhancedContentRenderer } from '@/content-renderer';

<EnhancedContentRenderer
  components={components}
  viewMode={viewMode}
  projectId="your-project-id"
  showDragDropControls={true}
  enableDragDropByDefault={false}
/>
```

### Step 2: Update Server Routes (Optional)

Add to your server's main file:
```javascript
// server/index.js
app.use("/api/layouts", require("./routes/layouts"));
```

### Step 3: Test the Integration

1. Start your development server
2. Navigate to your builder interface
3. Click the "Drag & Drop" toggle
4. Try dragging components around

## 🔧 Advanced Migration

### Custom Integration

If you need more control, you can integrate individual components:

```tsx
import { 
  ContentRenderer, 
  DragDropControls, 
  useDragAndDropLayouts 
} from '@/content-renderer';

function YourBuilderComponent() {
  const [isDragDropEnabled, setIsDragDropEnabled] = useState(false);
  
  const dragDropHook = useDragAndDropLayouts({
    projectId: 'your-project',
    viewMode: currentViewMode,
    autoSave: true,
  });

  return (
    <div className="your-builder">
      {/* Your existing UI */}
      <YourCustomHeader />
      
      {/* Add drag drop controls where you want them */}
      <DragDropControls
        isDragDropEnabled={isDragDropEnabled}
        onToggleDragDrop={setIsDragDropEnabled}
        {...dragDropHook}
        viewMode={currentViewMode}
      />
      
      {/* Replace your content renderer */}
      <ContentRenderer
        components={components}
        viewMode={currentViewMode}
        useDragAndDrop={isDragDropEnabled}
        onLayoutChange={dragDropHook.updateLayouts}
        savedLayouts={dragDropHook.layouts}
      />
      
      {/* Your existing UI */}
      <YourCustomFooter />
    </div>
  );
}
```

## 📱 View Mode Integration

### Adding View Mode Support

```tsx
function ResponsiveBuilder() {
  const [viewMode, setViewMode] = useState('desktop');
  
  return (
    <>
      {/* View mode switcher */}
      <div className="view-mode-controls">
        <button 
          onClick={() => setViewMode('desktop')}
          className={viewMode === 'desktop' ? 'active' : ''}
        >
          🖥️ Desktop
        </button>
        <button 
          onClick={() => setViewMode('mobile')}
          className={viewMode === 'mobile' ? 'active' : ''}
        >
          📱 Mobile
        </button>
      </div>
      
      {/* Enhanced renderer with view mode */}
      <EnhancedContentRenderer
        components={components}
        viewMode={viewMode}
        projectId="responsive-project"
        key={viewMode} // Important: forces re-render
      />
    </>
  );
}
```

## 🎛️ Control Panel Customization

### Hide/Show Controls

```tsx
// Show controls only for admin users
<EnhancedContentRenderer
  components={components}
  viewMode={viewMode}
  showDragDropControls={user.isAdmin}
  enableDragDropByDefault={user.isAdmin}
/>
```

### Custom Control Placement

```tsx
import { DragDropControls } from '@/content-renderer';

// Place controls in your custom toolbar
<YourCustomToolbar>
  <DragDropControls
    isDragDropEnabled={isDragDropEnabled}
    onToggleDragDrop={setIsDragDropEnabled}
    // ... other props
  />
</YourCustomToolbar>
```

## 💾 Data Migration

### Existing Component Data

Your existing `ComponentState` objects should work without modification. The system adds layout information alongside your existing data.

### Layout Storage Structure

New layout data is stored separately:
```json
{
  "layouts": {
    "desktop": [
      {"i": "component-id", "x": 0, "y": 0, "w": 4, "h": 2}
    ],
    "mobile": [
      {"i": "component-id", "x": 0, "y": 0, "w": 2, "h": 2}
    ]
  },
  "viewMode": "desktop",
  "lastModified": "2024-01-01T00:00:00.000Z"
}
```

## 🔧 Troubleshooting Migration Issues

### Components Not Appearing

**Problem:** Components don't show up in grid mode.

**Solution:** Check that your components have valid `id` properties:
```tsx
// Make sure each component has a unique ID
const components = [
  { id: 'unique-id-1', name: 'Component 1', /* ... */ },
  { id: 'unique-id-2', name: 'Component 2', /* ... */ },
];
```

### Drag Not Working

**Problem:** Components aren't draggable.

**Solution:** Ensure the drag handle class is applied:
```css
/* This should be automatic, but check if it's missing */
.drag-handle {
  cursor: grab;
}
```

### Layout Not Saving

**Problem:** Changes aren't persisted.

**Solutions:**
1. Check that `projectId` is provided
2. Verify localStorage permissions
3. Check server endpoint availability
4. Look for console errors

### Performance Issues

**Problem:** Dragging is slow or laggy.

**Solutions:**
1. Reduce the number of components initially
2. Check for console warnings
3. Ensure components are properly memoized
4. Consider using `React.memo` for your custom components

## 📊 Testing Your Migration

### Basic Tests

1. **Toggle Test**: Can you turn drag mode on/off?
2. **Drag Test**: Can you move components around?
3. **Resize Test**: Can you resize components?
4. **Save Test**: Are layouts preserved on reload?
5. **View Mode Test**: Do desktop/mobile have separate layouts?

### Advanced Tests

```tsx
// Test component for validation
function MigrationTest() {
  const [testComponents] = useState([
    { id: 'test-1', name: 'Test Component 1', /* ... */ },
    { id: 'test-2', name: 'Test Component 2', /* ... */ },
  ]);

  return (
    <EnhancedContentRenderer
      components={testComponents}
      viewMode="desktop"
      projectId="migration-test"
      enableDragDropByDefault={true}
    />
  );
}
```

## 🚨 Common Migration Pitfalls

### 1. Missing Component IDs
```tsx
// ❌ Wrong: Missing or duplicate IDs
const badComponents = [
  { name: 'Component 1' }, // Missing ID
  { id: 'same', name: 'Component 2' },
  { id: 'same', name: 'Component 3' }, // Duplicate ID
];

// ✅ Correct: Unique IDs for each component
const goodComponents = [
  { id: 'comp-1', name: 'Component 1' },
  { id: 'comp-2', name: 'Component 2' },
  { id: 'comp-3', name: 'Component 3' },
];
```

### 2. Forgetting View Mode Key
```tsx
// ❌ Wrong: No key prop when view mode changes
<EnhancedContentRenderer
  components={components}
  viewMode={viewMode}
/>

// ✅ Correct: Key forces re-render
<EnhancedContentRenderer
  components={components}
  viewMode={viewMode}
  key={viewMode}
/>
```

### 3. Conflicting CSS
```css
/* ❌ Avoid overriding grid layout CSS */
.react-grid-item {
  /* Don't override these */
}

/* ✅ Style your component content instead */
.your-component-content {
  /* Your custom styles here */
}
```

## 📈 Performance Optimization

### Component Memoization

```tsx
// Optimize your components for drag and drop
const MyComponent = React.memo(({ data }) => {
  return <div>{data.content}</div>;
});

// Use stable keys
const components = useMemo(() => 
  rawComponents.map(comp => ({ ...comp, key: comp.id })),
  [rawComponents]
);
```

### Lazy Loading

```tsx
// For large component lists
const LazyDragDrop = React.lazy(() => 
  import('./components/enhanced-content-renderer')
);

function MyBuilder() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyDragDrop components={components} viewMode="desktop" />
    </Suspense>
  );
}
```

## 🎯 Best Practices

1. **Start Small**: Begin with a few components
2. **Test Incrementally**: Add features one at a time
3. **Monitor Performance**: Watch for lag or memory issues
4. **User Feedback**: Get feedback on the drag experience
5. **Backup First**: Always backup before migrating

## 📞 Getting Help

If you encounter issues during migration:

1. Check the console for error messages
2. Verify all required props are provided
3. Test with the provided example component
4. Check that CSS files are imported correctly
5. Ensure server endpoints are working

## ✅ Migration Checklist

- [ ] Replaced ContentRenderer with EnhancedContentRenderer
- [ ] Added unique IDs to all components
- [ ] Tested drag and drop functionality
- [ ] Verified layout persistence
- [ ] Tested view mode switching
- [ ] Checked performance with real data
- [ ] Added server endpoints (if needed)
- [ ] Updated any custom styling
- [ ] Tested on mobile devices
- [ ] Created backup of previous version

## 🎉 You're Done!

Congratulations! Your builder now has drag and drop capabilities. Users can:

- 🖱️ Drag components to rearrange them
- 📏 Resize components to fit their needs  
- 💾 Save layouts for future use
- 📱 Have separate desktop and mobile layouts
- 🎛️ Toggle between edit and view modes

Enjoy building amazing user interfaces with your new drag and drop system! 