# Deployment Guide

Complete deployment guide for the Component Rendering System, including production setup, optimization, and monitoring.

## 📚 Table of Contents

- [Production Setup](#production-setup)
- [Build Optimization](#build-optimization)
- [Environment Configuration](#environment-configuration)
- [Performance Monitoring](#performance-monitoring)
- [Error Tracking](#error-tracking)
- [CDN and Caching](#cdn-and-caching)
- [Security Hardening](#security-hardening)
- [Scaling Considerations](#scaling-considerations)

## 🚀 Production Setup

### Prerequisites

```bash
# Required versions
Node.js >= 18.0.0
npm >= 8.0.0
TypeScript >= 5.0.0
React >= 18.0.0
```

### Installation

```bash
# Clone repository
git clone <repository-url>
cd component-rendering-system

# Install dependencies
npm ci --production

# Build for production
npm run build

# Verify build
npm run test:production
```

### Environment Setup

```bash
# .env.production
NODE_ENV=production
REACT_APP_API_URL=https://api.yourapp.com
REACT_APP_CDN_URL=https://cdn.yourapp.com
REACT_APP_VERSION=${VERSION}

# Performance settings
REACT_APP_CACHE_TTL=600000
REACT_APP_MAX_COMPONENT_SIZE=100
REACT_APP_ENABLE_PROFILING=false

# Security settings
REACT_APP_CSP_ENABLED=true
REACT_APP_ALLOWED_ORIGINS=https://yourapp.com,https://admin.yourapp.com
```

## 🔧 Build Optimization

### Webpack Configuration

```javascript
// webpack.config.prod.js
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  mode: 'production',
  entry: './src/index.tsx',
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js',
    publicPath: process.env.REACT_APP_CDN_URL || '/',
    clean: true
  },

  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.debug']
          },
          mangle: {
            safari10: true
          }
        }
      })
    ],
    
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },
        
        common: {
          name: 'common',
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true
        },
        
        'component-renderer': {
          test: /[\\/]src[\\/].*renderer.*[\\/]/,
          name: 'component-renderer',
          chunks: 'all',
          priority: 8
        }
      }
    },
    
    runtimeChunk: 'single'
  },

  plugins: [
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8
    }),
    
    new CompressionPlugin({
      algorithm: 'brotliCompress',
      test: /\.(js|css|html|svg)$/,
      compressionOptions: { level: 11 },
      threshold: 8192,
      minRatio: 0.8,
      filename: '[path][base].br'
    }),

    // Analyze bundle size (optional)
    process.env.ANALYZE_BUNDLE && new BundleAnalyzerPlugin()
  ].filter(Boolean),

  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.prod.json'
            }
          }
        ],
        exclude: /node_modules/
      },
      
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[hash:base64:8]'
              }
            }
          },
          'postcss-loader'
        ]
      }
    ]
  }
};
```

### Package.json Scripts

```json
{
  "scripts": {
    "build": "webpack --config webpack.config.prod.js",
    "build:analyze": "ANALYZE_BUNDLE=true npm run build",
    "build:docker": "docker build -t component-renderer .",
    "test:production": "NODE_ENV=production npm test",
    "postbuild": "npm run optimize:images && npm run generate:manifest",
    "optimize:images": "imagemin src/assets/* --out-dir=dist/assets",
    "generate:manifest": "node scripts/generate-manifest.js"
  }
}
```

### TypeScript Production Config

```json
// tsconfig.prod.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "sourceMap": false,
    "removeComments": true,
    "declaration": false,
    "declarationMap": false,
    "noEmitOnError": true
  },
  "exclude": [
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx",
    "src/**/__tests__/**",
    "src/**/__mocks__/**"
  ]
}
```

## 🌐 Environment Configuration

### Docker Setup

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY src/ ./src/
COPY public/ ./public/

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Security headers
COPY security-headers.conf /etc/nginx/conf.d/security-headers.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Brotli compression (if module available)
    brotli on;
    brotli_comp_level 6;
    brotli_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        include /etc/nginx/conf.d/security-headers.conf;

        # Static assets caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header Vary "Accept-Encoding";
        }

        # HTML files - no cache
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }

        # API proxy
        location /api/ {
            proxy_pass $REACT_APP_API_URL;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

### Security Headers

```nginx
# security-headers.conf
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

# Content Security Policy
add_header Content-Security-Policy "
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.yourapp.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://api.yourapp.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
" always;
```

## 📊 Performance Monitoring

### Application Performance Monitoring

```tsx
// src/utils/performance-monitor.ts
class ProductionPerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();
  private static enabled = process.env.NODE_ENV === 'production';

  static startTimer(label: string): string {
    if (!this.enabled) return '';
    
    const id = `${label}-${Date.now()}-${Math.random()}`;
    performance.mark(`${id}-start`);
    return id;
  }

  static endTimer(id: string): number {
    if (!this.enabled || !id) return 0;

    try {
      performance.mark(`${id}-end`);
      performance.measure(id, `${id}-start`, `${id}-end`);
      
      const measure = performance.getEntriesByName(id)[0];
      const duration = measure.duration;
      
      // Store metrics
      const label = id.split('-')[0];
      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }
      this.metrics.get(label)!.push(duration);
      
      // Send to analytics if duration is significant
      if (duration > 100) {
        this.sendMetric(label, duration);
      }
      
      // Cleanup
      performance.clearMarks(`${id}-start`);
      performance.clearMarks(`${id}-end`);
      performance.clearMeasures(id);
      
      return duration;
    } catch (error) {
      console.warn('Performance monitoring error:', error);
      return 0;
    }
  }

  static sendMetric(label: string, duration: number) {
    // Send to your analytics service
    if (window.gtag) {
      window.gtag('event', 'performance_metric', {
        event_category: 'Performance',
        event_label: label,
        value: Math.round(duration)
      });
    }
    
    // Send to custom analytics
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: label,
        duration,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }).catch(() => {
      // Fail silently in production
    });
  }

  static getMetrics() {
    return Object.fromEntries(
      Array.from(this.metrics.entries()).map(([label, values]) => [
        label,
        {
          count: values.length,
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values)
        }
      ])
    );
  }
}

export { ProductionPerformanceMonitor };
```

### Core Web Vitals Tracking

```tsx
// src/utils/vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Google Analytics 4
  if (window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true
    });
  }

  // Custom analytics endpoint
  fetch('/api/vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      url: window.location.href,
      timestamp: Date.now()
    })
  }).catch(() => {
    // Fail silently
  });
}

export function initializeVitalsTracking() {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}
```

## 🚨 Error Tracking

### Production Error Handling

```tsx
// src/utils/error-tracking.ts
interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  lineNumber?: number;
  columnNumber?: number;
  userAgent: string;
  timestamp: number;
  userId?: string;
  componentStack?: string;
}

class ErrorTracker {
  private static endpoint = process.env.REACT_APP_ERROR_ENDPOINT || '/api/errors';
  private static maxErrors = 10;
  private static errorCount = 0;

  static initialize() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      });
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      });
    });
  }

  static logError(error: Partial<ErrorReport>) {
    // Rate limiting
    if (this.errorCount >= this.maxErrors) {
      return;
    }
    this.errorCount++;

    const errorReport: ErrorReport = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      url: error.url || window.location.href,
      lineNumber: error.lineNumber,
      columnNumber: error.columnNumber,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      componentStack: error.componentStack
    };

    // Send to error tracking service
    this.sendError(errorReport);
  }

  private static async sendError(error: ErrorReport) {
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error)
      });
    } catch (fetchError) {
      // Store in localStorage as fallback
      this.storeErrorLocally(error);
    }
  }

  private static storeErrorLocally(error: ErrorReport) {
    try {
      const stored = localStorage.getItem('pendingErrors') || '[]';
      const errors = JSON.parse(stored);
      errors.push(error);
      
      // Keep only last 5 errors
      if (errors.length > 5) {
        errors.splice(0, errors.length - 5);
      }
      
      localStorage.setItem('pendingErrors', JSON.stringify(errors));
    } catch (storageError) {
      // Ignore storage errors
    }
  }

  static flushPendingErrors() {
    try {
      const stored = localStorage.getItem('pendingErrors');
      if (stored) {
        const errors = JSON.parse(stored);
        errors.forEach((error: ErrorReport) => this.sendError(error));
        localStorage.removeItem('pendingErrors');
      }
    } catch (error) {
      // Ignore flush errors
    }
  }
}

export { ErrorTracker };
```

### React Error Boundary

```tsx
// src/components/ProductionErrorBoundary.tsx
import React from 'react';
import { ErrorTracker } from '../utils/error-tracking';

interface ProductionErrorBoundaryState {
  hasError: boolean;
  errorId: string | null;
}

export class ProductionErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ProductionErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorId: null };
  }

  static getDerivedStateFromError(error: Error): ProductionErrorBoundaryState {
    return {
      hasError: true,
      errorId: `error-${Date.now()}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    ErrorTracker.logError({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <p>We've been notified about this error.</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 🌐 CDN and Caching

### CDN Configuration

```javascript
// scripts/deploy-to-cdn.js
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const cloudfront = new AWS.CloudFront({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

async function uploadToS3(filePath, key) {
  const fileContent = fs.readFileSync(filePath);
  const contentType = mime.lookup(filePath) || 'application/octet-stream';
  
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: fileContent,
    ContentType: contentType,
    CacheControl: getCacheControl(filePath),
    ContentEncoding: getContentEncoding(filePath)
  };

  return s3.upload(params).promise();
}

function getCacheControl(filePath) {
  const ext = path.extname(filePath);
  
  if (['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2'].includes(ext)) {
    return 'public, max-age=31536000, immutable'; // 1 year
  }
  
  if (ext === '.html') {
    return 'public, max-age=0, must-revalidate'; // No cache
  }
  
  return 'public, max-age=86400'; // 1 day
}

function getContentEncoding(filePath) {
  if (filePath.endsWith('.br')) {
    return 'br';
  }
  if (filePath.endsWith('.gz')) {
    return 'gzip';
  }
  return undefined;
}

async function invalidateCloudFront() {
  const params = {
    DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
    InvalidationBatch: {
      CallerReference: `invalidation-${Date.now()}`,
      Paths: {
        Quantity: 1,
        Items: ['/*']
      }
    }
  };

  return cloudfront.createInvalidation(params).promise();
}

// Deploy script
async function deploy() {
  const distDir = path.join(__dirname, '..', 'dist');
  const files = getAllFiles(distDir);
  
  console.log(`Uploading ${files.length} files to S3...`);
  
  for (const file of files) {
    const key = path.relative(distDir, file);
    await uploadToS3(file, key);
    console.log(`Uploaded: ${key}`);
  }
  
  console.log('Invalidating CloudFront cache...');
  await invalidateCloudFront();
  
  console.log('Deployment complete!');
}

function getAllFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  
  return files;
}

if (require.main === module) {
  deploy().catch(console.error);
}
```

### Service Worker for Caching

```javascript
// public/sw.js
const CACHE_NAME = 'component-renderer-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/static/js/main.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME && key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Handle static assets
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, '/index.html'));
    return;
  }

  // Default strategy
  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  const cache = await caches.open(DYNAMIC_CACHE);
  cache.put(request, response.clone());
  
  return response;
}

async function networkFirst(request, fallback = null) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    if (fallback) {
      return caches.match(fallback);
    }
    
    throw error;
  }
}
```

## 🔒 Security Hardening

### Content Security Policy

```javascript
// scripts/generate-csp.js
function generateCSP() {
  const policy = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for React dev tools, remove in strict mode
      process.env.REACT_APP_CDN_URL,
      'https://www.googletagmanager.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for styled-components
      'https://fonts.googleapis.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      process.env.REACT_APP_CDN_URL
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    'connect-src': [
      "'self'",
      process.env.REACT_APP_API_URL,
      'https://www.google-analytics.com'
    ],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
  };

  return Object.entries(policy)
    .map(([directive, sources]) => 
      `${directive} ${sources.join(' ')}`
    )
    .join('; ');
}

module.exports = { generateCSP };
```

### Input Sanitization

```tsx
// src/utils/sanitizer.ts
import DOMPurify from 'dompurify';

export class InputSanitizer {
  private static readonly HTML_CONFIG = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false
  };

  static sanitizeHTML(input: string): string {
    return DOMPurify.sanitize(input, this.HTML_CONFIG);
  }

  static sanitizeText(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .trim();
  }

  static sanitizeProps(props: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(props)) {
      if (this.isValidPropName(key)) {
        sanitized[key] = this.sanitizeValue(value);
      }
    }
    
    return sanitized;
  }

  private static isValidPropName(name: string): boolean {
    return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name) && 
           !name.startsWith('on') && // No event handlers
           !['dangerouslySetInnerHTML', 'innerHTML'].includes(name);
  }

  private static sanitizeValue(value: unknown): unknown {
    if (typeof value === 'string') {
      return this.sanitizeText(value);
    }
    
    if (Array.isArray(value)) {
      return value.map(v => this.sanitizeValue(v));
    }
    
    if (typeof value === 'object' && value !== null) {
      return this.sanitizeProps(value as Record<string, unknown>);
    }
    
    return value;
  }
}
```

## 📈 Scaling Considerations

### Horizontal Scaling

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: component-renderer
spec:
  replicas: 3
  selector:
    matchLabels:
      app: component-renderer
  template:
    metadata:
      labels:
        app: component-renderer
    spec:
      containers:
      - name: component-renderer
        image: component-renderer:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        env:
        - name: NODE_ENV
          value: "production"
        - name: REACT_APP_API_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: api-url
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 15
          periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: component-renderer-service
spec:
  selector:
    app: component-renderer
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: LoadBalancer
```

### Auto-scaling Configuration

```yaml
# kubernetes/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: component-renderer-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: component-renderer
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Load Testing

```javascript
// scripts/load-test.js
const autocannon = require('autocannon');

async function runLoadTest() {
  const result = await autocannon({
    url: process.env.TEST_URL || 'http://localhost:3000',
    connections: 100,
    pipelining: 1,
    duration: 30,
    requests: [
      {
        method: 'GET',
        path: '/'
      },
      {
        method: 'GET',
        path: '/api/components'
      }
    ]
  });

  console.log('Load test results:');
  console.log(`Requests/sec: ${result.requests.average}`);
  console.log(`Latency: ${result.latency.average}ms`);
  console.log(`Throughput: ${result.throughput.average} bytes/sec`);
  
  // Check if performance meets requirements
  if (result.requests.average < 1000) {
    throw new Error('Performance below threshold');
  }
}

if (require.main === module) {
  runLoadTest().catch(console.error);
}
```

---

This deployment guide provides comprehensive instructions for setting up the Component Rendering System in production environments with proper optimization, monitoring, and security measures. 