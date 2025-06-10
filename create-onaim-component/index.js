const fs = require("fs");
const path = require("path");
const readline = require("readline");

const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bright: "\x1b[1m",
};

const log = (color, message) => console.log(color + message + colors.reset);

class InteractiveSelector {
  constructor(options, title) {
    this.options = options;
    this.title = title;
    this.selectedIndex = 0;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async selectOption() {
    return new Promise((resolve) => {
      console.log();
      log(colors.cyan, this.title);
      console.log();

      this.displayOptions();

      const onKeyPress = (str, key) => {
        if (key && key.ctrl && key.name === "c") {
          process.exit();
        }

        if (key && key.name === "up") {
          this.selectedIndex = Math.max(0, this.selectedIndex - 1);
          this.displayOptions();
        } else if (key && key.name === "down") {
          this.selectedIndex = Math.min(
            this.options.length - 1,
            this.selectedIndex + 1
          );
          this.displayOptions();
        } else if (key && key.name === "return") {
          this.rl.input.removeListener("keypress", onKeyPress);
          this.rl.close();
          resolve(this.options[this.selectedIndex]);
        }
      };

      process.stdin.setRawMode(true);
      this.rl.input.on("keypress", onKeyPress);
    });
  }

  displayOptions() {
    process.stdout.write("\r\x1b[K");
    for (let i = 0; i < this.options.length; i++) {
      process.stdout.write("\x1b[1A\r\x1b[K");
    }

    this.options.forEach((option, index) => {
      const isSelected = index === this.selectedIndex;
      const prefix = isSelected ? colors.green + "❯ " : "  ";
      const color = isSelected ? colors.bright + colors.cyan : colors.dim;
      const reset = colors.reset;

      console.log(`${prefix}${color}${option.label}${reset}`);
    });
  }
}

async function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function init() {
  console.clear();
  console.log();
  log(colors.cyan + colors.bright, "🚀 OnAim Component Generator");
  log(colors.dim, "   Create beautiful components in seconds");
  console.log();

  try {
    const userInput = await askQuestion(
      colors.cyan + "📝 Component name: " + colors.reset
    );

    if (!userInput || !userInput.trim()) {
      log(colors.red, "❌ Component name is required");
      process.exit(1);
    }

    const componentName = userInput
      .trim()
      .split(/[\s\-_]+/) // Split on spaces, hyphens, underscores
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("");

    log(colors.green, `✅ Auto-converted to: ${componentName}`);

    const templateSelector = new InteractiveSelector(
      [
        {
          value: "simple",
          label: "Simple Component          ⭐ Display content, basic styling",
        },
        {
          value: "api",
          label:
            "API Data Component        ⭐⭐ Fetch and display data from API",
        },
        {
          value: "interactive",
          label: "Interactive Component     ⭐⭐⭐ Forms, user interactions",
        },
      ],
      "🎨 Select template:"
    );

    const selectedTemplate = await templateSelector.selectOption();
    const template = selectedTemplate.value;

    const langSelector = new InteractiveSelector(
      [
        {
          value: true,
          label: "TypeScript (.tsx)         🔷 Type safety, better IDE support",
        },
        {
          value: false,
          label: "JavaScript (.jsx)         🟨 Simpler, no types required",
        },
      ],
      "💻 Select language:"
    );

    const selectedLang = await langSelector.selectOption();
    const isTypeScript = selectedLang.value;

    const styleSelector = new InteractiveSelector(
      [
        {
          value: true,
          label: "SCSS (.scss)              🎨 Variables, nesting, mixins",
        },
        {
          value: false,
          label: "CSS (.css)                📄 Simple, basic styling",
        },
      ],
      "✨ Select styling:"
    );

    const selectedStyle = await styleSelector.selectOption();
    const isScss = selectedStyle.value;

    let apiUrl = "";
    if (template === "api") {
      console.log();
      apiUrl = await askQuestion(
        colors.cyan +
          "🌐 API URL " +
          colors.dim +
          "(press Enter for demo data): " +
          colors.reset
      );
      if (!apiUrl || !apiUrl.trim()) {
        apiUrl = "https://jsonplaceholder.typicode.com/posts";
        log(colors.yellow, "🎯 Using demo API for testing");
      }
    }

    console.log();
    const wantsDescription = await askQuestion(
      colors.cyan +
        "📝 Add description? " +
        colors.dim +
        "(y/N): " +
        colors.reset
    );

    let description = "";
    if (
      wantsDescription.toLowerCase() === "y" ||
      wantsDescription.toLowerCase() === "yes"
    ) {
      description = await askQuestion(
        colors.cyan + "💬 Component description: " + colors.reset
      );
    }

    await createComponent(
      componentName,
      template,
      isTypeScript,
      isScss,
      apiUrl,
      description
    );
  } catch (error) {
    console.log();
    log(colors.red, "❌ Error: " + error.message);
    process.exit(1);
  }
}

async function createComponent(
  componentName,
  template,
  isTypeScript,
  isScss,
  apiUrl,
  description
) {
  const targetDir = path.join(
    process.cwd(),
    "server",
    "config",
    "uploads",
    componentName.toLowerCase()
  );

  console.log();
  log(colors.green + colors.bright, "✨ Creating component...");

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const files = generateFiles(
    componentName,
    template,
    isTypeScript,
    isScss,
    apiUrl,
    description
  );

  Object.entries(files).forEach(([filename, content]) => {
    fs.writeFileSync(path.join(targetDir, filename), content);
    log(colors.green, `   ✓ ${filename}`);
  });

  console.log();
  log(colors.green + colors.bright, "🎉 Component created successfully!");
  console.log();
  log(colors.cyan, "📁 Location: " + colors.dim + targetDir);
  console.log();
  log(colors.yellow + colors.bright, "🎯 Next steps:");
  console.log("   1. Customize your component code");
  console.log("   2. Test: " + colors.cyan + "npm run build" + colors.reset);
  console.log("   3. Use in OnAim Builder!");
  console.log();
}

function generateFiles(
  componentName,
  template,
  isTypeScript,
  isScss,
  apiUrl,
  description
) {
  const fileExt = isTypeScript ? "tsx" : "jsx";
  const styleExt = isScss ? "scss" : "css";

  const files = {
    [`index.${fileExt}`]: generateMainComponent(
      componentName,
      template,
      apiUrl,
      description,
      isTypeScript
    ),
    [`styles.${styleExt}`]: generateStyles(componentName, isScss),
    "settings.ts": generateSettings(componentName, template),
    "language.ts": generateLanguage(),
  };

  if (template === "api") {
    files["action.ts"] = generateActionFile(
      componentName,
      apiUrl,
      isTypeScript
    );
  }

  return files;
}

function generateMainComponent(
  componentName,
  template,
  apiUrl,
  description,
  isTypeScript
) {
  if (template === "api") {
    return generateAPIComponent(
      componentName,
      apiUrl,
      description,
      isTypeScript
    );
  } else if (template === "interactive") {
    return generateInteractiveComponent(
      componentName,
      description,
      isTypeScript
    );
  } else {
    return generateSimpleComponent(componentName, description, isTypeScript);
  }
}

function generateSimpleComponent(componentName, description, isTypeScript) {
  const imports = isTypeScript
    ? `import React, { memo } from 'react';\nimport './styles.scss';\nimport type { Settings } from './settings';\nimport type { LngProps } from './language';\n\ninterface ${componentName}Props {\n  settings: Settings;\n  language: LngProps;\n}`
    : `import React, { memo } from 'react';\nimport './styles.scss';`;

  const propsType = isTypeScript
    ? `{ settings, language }: ${componentName}Props`
    : "{ settings, language }";

  return `${imports}

const ${componentName} = (${propsType}) => {
  const containerStyle = {
    backgroundColor: \`rgb(\${settings.background || '255,255,255'})\`,
    color: \`rgb(\${settings.textColor || '0,0,0'})\`,
    padding: settings.padding || '20px',
    borderRadius: settings.borderRadius || '8px'
  };

  return (
    <div className="${componentName.toLowerCase()}-container" style={containerStyle}>
      <h2 className="title">{settings.title || language.title || '${componentName}'}</h2>
      <p className="description">{settings.description || language.description || '${description}'}</p>
      
      <div className="content">
        <p>{language.welcome || 'Welcome to'} {settings.title || language.title || '${componentName}'}!</p>
        
        <div className="features">
          <div className="feature">✨ {language.beautiful || 'Beautiful design'}</div>
          <div className="feature">⚡ {language.fast || 'Fast performance'}</div>
          <div className="feature">🎨 {language.customizable || 'Customizable'}</div>
        </div>
      </div>
    </div>
  );
};

${componentName}.displayName = '${componentName}';

export default memo(${componentName});`;
}

function generateAPIComponent(
  componentName,
  apiUrl,
  description,
  isTypeScript
) {
  const imports = isTypeScript
    ? `import React, { memo, useState, useEffect, useRef, useMemo } from 'react';\nimport './styles.scss';\nimport { fetchApiData, processApiData } from './action';\nimport type { Settings } from './settings';\nimport type { LngProps } from './language';\n\ninterface ${componentName}Props {\n  settings: Settings;\n  language: LngProps;\n}`
    : `import React, { memo, useState, useEffect, useRef, useMemo } from 'react';\nimport './styles.scss';\nimport { fetchApiData, processApiData } from './action';`;

  const propsType = isTypeScript
    ? `{ settings, language }: ${componentName}Props`
    : "{ settings, language }";

  const typeAnnotations = isTypeScript
    ? `
// 🔷 TypeScript interfaces
interface DataItem {
  id?: string | number;
  title?: string;
  name?: string;
  body?: string;
  description?: string;
  [key: string]: any;
}

interface CacheData {
  data: DataItem[] | null;
  timestamp: number;
  loading: boolean;
  error: string | null;
}`
    : "";

  return `${imports}${typeAnnotations}

// 🗄️ Global cache (prevents API spam, shared across all instances)
const globalDataCache${isTypeScript ? ": CacheData" : ""} = {
  data: null,
  timestamp: 0,
  loading: false,
  error: null
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// 📡 API function using action file
const fetchData = async ()${isTypeScript ? ": Promise<DataItem[]>" : ""} => {
  const rawData = await fetchApiData();
  return processApiData(rawData);
};

const ${componentName} = (${propsType}) => {
  const [localError, setLocalError] = useState${isTypeScript ? "<string | null>" : ""}(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    const now = Date.now();
    const isDataFresh = globalDataCache.data && (now - globalDataCache.timestamp) < CACHE_DURATION;
    
    // Always set initial load to false after first run
    setIsInitialLoad(false);

    if (isDataFresh || globalDataCache.loading) {
      setLocalError(globalDataCache.error);
      return;
    }

    if (!globalDataCache.data || (now - globalDataCache.timestamp) >= CACHE_DURATION) {
      globalDataCache.loading = true;
      setLocalError(null);

      fetchData()
        .then((data) => {
          if (isMountedRef.current) {
            globalDataCache.data = data;
            globalDataCache.timestamp = now;
            globalDataCache.error = null;
            globalDataCache.loading = false;
            setLocalError(null);
            setDataVersion(prev => prev + 1); // Trigger re-render
          }
        })
        .catch((error) => {
          if (isMountedRef.current) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            globalDataCache.error = errorMessage;
            globalDataCache.loading = false;
            setLocalError(errorMessage);
            setDataVersion(prev => prev + 1); // Trigger re-render
          }
        });
    }
  }, []); // ✅ Empty dependency array prevents infinite loops

  const containerStyle = {
    backgroundColor: \`rgb(\${settings.background || '255,255,255'})\`,
    color: \`rgb(\${settings.textColor || '0,0,0'})\`,
    padding: settings.padding || '20px',
    borderRadius: settings.borderRadius || '8px'
  };

  // Use dataVersion to ensure proper re-renders
  const currentData = useMemo(() => globalDataCache.data, [dataVersion]);

  // Loading state - only show if loading AND no cached data
  if (isInitialLoad || (globalDataCache.loading && !currentData)) {
    return (
      <div className="${componentName.toLowerCase()}-container" style={containerStyle}>
        <div className="loading">{language.loading || 'Loading...'}</div>
      </div>
    );
  }

  // Error state
  if (localError || globalDataCache.error) {
    return (
      <div className="${componentName.toLowerCase()}-container" style={containerStyle}>
        <div className="error">
          {language.error || 'Error'}: {localError || globalDataCache.error}
        </div>
      </div>
    );
  }

  // Data state
  const data = currentData || [];

  return (
    <div className="${componentName.toLowerCase()}-container" style={containerStyle}>
      <h2 className="title">{settings.title || language.title || '${componentName}'}</h2>
      <p className="description">{settings.description || language.description || '${description}'}</p>
      
      <div className="data-display">
        {Array.isArray(data) ? (
          data.length === 0 ? (
            <div className="no-data">{language.noDataAlt || 'No data available'}</div>
          ) : (
            data.slice(0, settings.maxItems || 10).map((item, index) => (
              <div key={index} className="data-item">
                <h4>{item.title || item.name || \`Item \${index + 1}\`}</h4>
                <p>{item.body || item.description || JSON.stringify(item)}</p>
              </div>
            ))
          )
        ) : (
          <div className="data-item">
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

${componentName}.displayName = '${componentName}';

export default memo(${componentName});`;
}

function generateInteractiveComponent(
  componentName,
  description,
  isTypeScript
) {
  const imports = isTypeScript
    ? `import React, { memo, useState, useCallback } from 'react';\nimport './styles.scss';\nimport type { Settings } from './settings';\nimport type { LngProps } from './language';\n\ninterface ${componentName}Props {\n  settings: Settings;\n  language: LngProps;\n}`
    : `import React, { memo, useState, useCallback } from 'react';\nimport './styles.scss';`;

  const propsType = isTypeScript
    ? `{ settings, language }: ${componentName}Props`
    : "{ settings, language }";

  return `${imports}

const ${componentName} = (${propsType}) => {
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage(language.success || 'Success!');
      setFormData({});
    } catch (error) {
      setMessage(language.error || 'Error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  const containerStyle = {
    backgroundColor: \`rgb(\${settings.background || '255,255,255'})\`,
    color: \`rgb(\${settings.textColor || '0,0,0'})\`,
    padding: settings.padding || '20px',
    borderRadius: settings.borderRadius || '8px'
  };

  return (
    <div className="${componentName.toLowerCase()}-container" style={containerStyle}>
      <h2 className="title">{settings.title || language.title || '${componentName}'}</h2>
      <p className="description">{settings.description || language.description || '${description}'}</p>
      
      <form onSubmit={handleSubmit} className="interactive-form">
        <div className="form-group">
          <label htmlFor="name">{language.name || 'Name'}:</label>
          <input
            type="text"
            id="name"
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">{language.email || 'Email'}:</label>
          <input
            type="email"
            id="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="message">{language.message || 'Message'}:</label>
          <textarea
            id="message"
            value={formData.message || ''}
            onChange={(e) => handleInputChange('message', e.target.value)}
            rows={4}
            required
          />
        </div>

        <button type="submit" disabled={isSubmitting} className="submit-btn">
          {isSubmitting ? (language.sending || 'Sending...') : (language.send || 'Send')}
        </button>

        {message && (
          <div className={message.includes('Error') ? 'error-message' : 'success-message'}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

${componentName}.displayName = '${componentName}';

export default memo(${componentName});`;
}

function generateStyles(componentName, isScss) {
  const containerClass = `.${componentName.toLowerCase()}-container`;

  if (isScss) {
    return `${containerClass} {
  font-family: 'Satoshi', sans-serif;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .title {
    margin: 0 0 16px 0;
    font-weight: 600;
    font-size: 1.5rem;
  }

  .description {
    margin: 0 0 20px 0;
    opacity: 0.8;
    line-height: 1.5;
  }

  .content {
    .language-info {
      font-size: 0.9rem;
      opacity: 0.7;
      margin-bottom: 20px;
    }

    .features {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 20px;

      @media (min-width: 768px) {
        flex-direction: row;
        justify-content: space-between;
      }

      .feature {
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: 500;
        text-align: center;
      }
    }
  }

  .data-display {
    .data-item {
      padding: 16px;
      margin: 12px 0;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      border-left: 3px solid rgba(255, 255, 255, 0.2);

      h4 {
        margin: 0 0 8px 0;
        font-weight: 600;
      }

      p {
        margin: 0;
        opacity: 0.8;
        line-height: 1.4;
      }

      pre {
        background: rgba(0, 0, 0, 0.1);
        padding: 12px;
        border-radius: 4px;
        overflow-x: auto;
        font-size: 0.85rem;
      }
    }

    .no-data {
      text-align: center;
      padding: 40px 20px;
      opacity: 0.6;
      font-style: italic;
    }
  }

  .interactive-form {
    .form-group {
      margin-bottom: 20px;

      label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
      }

      input,
      textarea {
        width: 100%;
        padding: 12px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.1);
        color: inherit;
        font-size: 1rem;
        transition: border-color 0.3s ease;

        &:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.5);
        }
      }
    }

    .submit-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.3);
      color: inherit;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .success-message {
      margin-top: 16px;
      padding: 12px;
      background: rgba(0, 255, 0, 0.1);
      border: 1px solid rgba(0, 255, 0, 0.3);
      border-radius: 6px;
      color: #00ff88;
    }

    .error-message {
      margin-top: 16px;
      padding: 12px;
      background: rgba(255, 0, 0, 0.1);
      border: 1px solid rgba(255, 0, 0, 0.3);
      border-radius: 6px;
      color: #ff6b6b;
    }
  }

  .loading,
  .error {
    text-align: center;
    padding: 40px 20px;
    font-size: 1.1rem;
  }

  .error {
    color: #ff6b6b;
  }
}`;
  } else {
    return `${containerClass} {
  font-family: 'Satoshi', sans-serif;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

${containerClass}:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

${containerClass} .title {
  margin: 0 0 16px 0;
  font-weight: 600;
  font-size: 1.5rem;
}

${containerClass} .description {
  margin: 0 0 20px 0;
  opacity: 0.8;
  line-height: 1.5;
}

${containerClass} .loading,
${containerClass} .error {
  text-align: center;
  padding: 40px 20px;
  font-size: 1.1rem;
}

${containerClass} .error {
  color: #ff6b6b;
}`;
  }
}

function generateSettings(componentName, template) {
  const baseSettings = `color: new ColorSetting({
      default: "0, 0, 0",
      title: "Text Color",
    }),

    background: new ColorSetting({
      default: "255, 255, 255", 
      title: "Background Color",
    }),

    textColor: new ColorSetting({
      default: "0, 0, 0",
      title: "Text Color",
    }),

    borderRadius: new StringSetting({
      default: "8px",
      title: "Border Radius",
    }),

    padding: new StringSetting({
      default: "20px",
      title: "Padding",
    }),

    width: new WidthSetting({
      default: 400,
      title: "Width (px)",
    }),

    title: new StringSetting({
      default: "${componentName}",
      title: "Component Title",
    }),

    description: new StringSetting({
      default: "A beautiful ${componentName.toLowerCase()} component",
      title: "Description",
    }),`;

  const apiSettings = `
    maxItems: new NumberSetting({
      default: 10,
      title: "Maximum Items",
    }),

    refreshInterval: new NumberSetting({
      default: 5,
      title: "Refresh Interval (minutes)",
    }),`;

  const interactiveSettings = `
    submitButtonText: new StringSetting({
      default: "Submit",
      title: "Submit Button Text",
    }),

    enableValidation: new BooleanSetting({
      default: true,
      title: "Enable Form Validation",
    }),`;

  let allSettings = baseSettings;

  if (template === "api") {
    allSettings += apiSettings;
  }

  if (template === "interactive") {
    allSettings += interactiveSettings;
  }

  return `import {
  SettingGroup,
  NumberSetting,
  ColorSetting,
  StringSetting,
  WidthSetting,
  BooleanSetting,
  type SettingsToProps,
} from "builder-settings-types";

export const settings = new SettingGroup({
  title: "${componentName} Settings",
  main: true,
  settings: {
    ${allSettings}
  },
});

export type Settings = SettingsToProps<typeof settings>;
export default settings;`;
}

function generateLanguage() {
  return `import SetLanguage from "language-management-lib";

const lngObject = {
  en: {
    title: "Component",
    description: "A beautiful component",
    welcome: "Welcome to",
    beautiful: "Beautiful design",
    fast: "Fast performance", 
    customizable: "Customizable",
    loading: "Loading...",
    error: "Error", 
    unknownError: "An unknown error occurred.",
    errorFetchingData: "Failed to retrieve data.",
    noDataAlt: "No data found",
    success: "Success!",
    name: "Name",
    email: "Email",
    message: "Message",
    send: "Send",
    sending: "Sending..."
  },
  ka: {
    title: "კომპონენტი",
    description: "ლამაზი კომპონენტი",
    welcome: "კეთილი იყოს თქვენი მობრძანება",
    beautiful: "ლამაზი დიზაინი",
    fast: "სწრაფი მუშაობა",
    customizable: "მორგებადი",
    loading: "იტვირთება...",
    error: "შეცდომა",
    unknownError: "გაუთვალისწინებელი შეცდომა მოხდა.",
    errorFetchingData: "მონაცემების მიღება ვერ მოხერხდა.",
    noDataAlt: "მონაცემები არ მოიძებნა",
    success: "წარმატება!",
    name: "სახელი",
    email: "ელ. ფოსტა",
    message: "შეტყობინება", 
    send: "გაგზავნა",
    sending: "იგზავნება..."
  }
};

export type LngProps = typeof lngObject.en;
export const lng = new SetLanguage(lngObject, "en");`;
}

function generateActionFile(componentName, apiUrl, isTypeScript) {
  const interfaceTypes = isTypeScript
    ? `
// 🔷 TypeScript interfaces
interface ApiResponse {
  data: any;
}

interface ${componentName}Item {
  id?: string | number;
  title?: string;
  name?: string;
  body?: string;
  description?: string;
  [key: string]: any;
}
`
    : "";

  return `// 🌐 API Configuration
const API_URL = "${apiUrl}";
${interfaceTypes}
const fetchWithTimeout = async (
  url${isTypeScript ? ": string" : ""},
  options${isTypeScript ? ": RequestInit" : ""} = {},
  timeout = 10000
)${isTypeScript ? ": Promise<Response>" : ""} => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error${isTypeScript ? " as Error" : ""}).name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
};

export const fetchApiData = async ()${isTypeScript ? ": Promise<any>" : ""} => {

  try {
    const response = await fetchWithTimeout(API_URL, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        \`HTTP error! status: \${response.status} - \${response.statusText}\`
      );
    }

    const data${isTypeScript ? ": any" : ""} = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching API data:", error);
    throw error instanceof Error ? error : new Error("Unknown error occurred");
  }
};

export const processApiData = (rawData${isTypeScript ? ": any" : ""})${isTypeScript ? ": " + componentName + "Item[]" : ""} => {
  // Process and format the API data as needed
  if (Array.isArray(rawData)) {
    return rawData;
  }
  
  // If the response has a data property
  if (rawData && rawData.data && Array.isArray(rawData.data)) {
    return rawData.data;
  }
  
  // If it's a single object, wrap it in an array
  if (rawData && typeof rawData === 'object') {
    return [rawData];
  }
  
  return [];
};`;
}

init().catch((e) => {
  console.error(e);
  process.exit(1);
});
