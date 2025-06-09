# OnAim-Builder

A powerful visual component builder for creating responsive React applications with multi-language support, real-time editing, and comprehensive project management capabilities.

## 🌟 Features

### 🎨 Visual Component Builder

- **Dual View Development**: Simultaneous desktop and mobile view editing with independent component management
- **Drag & Drop Interface**: Intuitive component placement and arrangement
- **Real-time Preview**: Instant visual feedback as you build your application
- **Component Library**: Extensive collection of pre-built components including headers, footers, content sections, and more

### 🌐 Advanced Multi-Language Management

- **13+ Language Support**: English, Georgian, Russian, Armenian, Azerbaijani, Turkish, Spanish, French, German, Italian, Portuguese, Arabic, and Chinese
- **Real-time Translation Editing**: Edit translations directly in the interface with instant preview
- **Smart Language Switching**: Seamless transition between languages with preserved layout
- **Fallback System**: Automatic fallback to default language for missing translations
- **Export/Import Translations**: Manage translations externally and import them back

### 💾 Import/Export System

- **JSON Export**: Save your projects as JSON for backup and sharing
- **Enhanced Source Export**: Generate complete Vite projects with:
  - Full React + TypeScript setup
  - Component structure
  - Styling and assets
  - Multi-language support
  - Ready-to-deploy code
- **Project Restoration**: Import and continue working on exported projects

### ⚙️ Component Management

- **Property Editor**: Comprehensive property adjustment panel for fine-tuning components
- **Content Rendering**: Real-time content updates with live preview
- **Component Copying**: Transfer components between desktop and mobile views
- **History Management**: Full undo/redo functionality with complete action history

### 🔍 Preview Modes

- **Modal Preview**: Quick in-app preview for rapid iteration
- **External Preview**: Full-window preview for comprehensive testing
- **Responsive Testing**: Test your designs across different screen sizes

## 🏗️ Architecture

### Frontend (React + TypeScript + Vite)

```
src/
├── app/
│   ├── features/
│   │   └── builder/                 # Main builder interface
│   │       ├── ui/
│   │       │   ├── language/        # Multi-language management
│   │       │   ├── save/            # Import/export functionality
│   │       │   ├── preview/         # Preview system
│   │       │   ├── property-adjustments/ # Component properties
│   │       │   ├── content-renderer/ # Component rendering
│   │       │   ├── components/      # Component selection
│   │       │   ├── copy/            # Component copying
│   │       │   └── history-control/ # Undo/redo system
│   │       └── index.tsx
│   └── shared/
│       └── services/
│           └── builder/             # Core builder services
│               ├── builder.service.ts
│               └── useBuilder.service.ts
```

### Backend (Node.js + Express)

```
server/
├── controllers/
│   └── file-controllers/           # File management APIs
│       ├── file-download.controller.js
│       ├── file-upload.controller.js
│       └── project-export.controller.js
├── config/
│   └── uploads/                    # Component storage
│       ├── components/             # Available components
│       └── examples/               # Example projects
└── services/                       # Backend services
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/OnAim-Builder.git
   cd OnAim-Builder
   ```

2. **Install frontend dependencies**

   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

### Development

1. **Start the backend server**

   ```bash
   cd server
   npm start
   ```

   The backend will be available at `http://localhost:3000`

2. **Start the frontend development server**
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`

### Building for Production

1. **Build the frontend**

   ```bash
   npm run build
   ```

2. **Preview the production build**
   ```bash
   npm run preview
   ```

## 📖 Usage Guide

### Creating Your First Project

1. **Select Components**: Browse the component library and select components for your project
2. **Choose View**: Work on desktop or mobile view (or both simultaneously)
3. **Customize Properties**: Use the property adjustment panel to modify component appearance and behavior
4. **Add Content**: Edit text, images, and other content directly in the interface
5. **Set Up Languages**: Configure multiple languages and add translations
6. **Preview**: Test your project using modal or external preview modes
7. **Export**: Save your project as JSON or export as a complete Vite project

### Language Management

1. **Add Languages**: Select from 13+ supported languages in the language management panel
2. **Edit Translations**: Click on any text element to edit translations for all active languages
3. **Switch Languages**: Use the language selector to preview your project in different languages
4. **Export Translations**: Download translation files for external editing
5. **Import Translations**: Upload updated translation files

### Component Copying

1. **Select Component**: Choose a component in one view (desktop/mobile)
2. **Copy**: Use the copy functionality to transfer the component
3. **Paste**: Add the component to the other view with preserved properties and content

## 🔧 API Reference

### Builder Service

The core builder service provides methods for project management:

```typescript
// Get current project state
const project = builderService.getProject();

// Add component to project
builderService.addComponent(componentData, view);

// Update component properties
builderService.updateComponent(componentId, properties);

// Export project
const exportData = builderService.exportProject();

// Import project
builderService.importProject(projectData);
```

### Language Service

Manage multi-language functionality:

```typescript
// Add new language
languageService.addLanguage(languageCode);

// Update translation
languageService.updateTranslation(key, languageCode, value);

// Get translations for language
const translations = languageService.getTranslations(languageCode);
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🗺️ Roadmap

- [ ] **Advanced Animations**: CSS animations and transitions builder
- [ ] **Theme System**: Pre-built themes and custom theme creation
- [ ] **Component Marketplace**: Share and download custom components
- [ ] **Collaboration Features**: Real-time collaborative editing
- [ ] **Advanced Responsive Design**: Breakpoint management and custom device previews
- [ ] **Integration APIs**: Connect with popular CMSs and databases
- [ ] **Performance Analytics**: Built-in performance monitoring and optimization suggestions

## 📞 Support

- **Documentation**: [Link to detailed docs]

---

Built with ❤️ by the OnAim team
},
})

```

```
