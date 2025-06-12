// Component instance cache management utilities

const componentKeyCache = new Map<string, string>();
const componentInstanceCache = new Map<
  string,
  React.ComponentType<Record<string, unknown>>
>();

// Clear component instance caches when language changes
export function clearComponentInstanceCache(componentId?: string): void {
  if (componentId) {
    // Clear specific component cache entries
    componentKeyCache.forEach((_, key) => {
      if (key.includes(componentId)) {
        componentKeyCache.delete(key);
      }
    });
    componentInstanceCache.forEach((_, key) => {
      if (key.includes(componentId)) {
        componentInstanceCache.delete(key);
      }
    });
  } else {
    // Clear all caches
    componentKeyCache.clear();
    componentInstanceCache.clear();
  }
}

// Get cache references for component instance usage
export function getComponentCaches(): {
  componentKeyCache: Map<string, string>;
  componentInstanceCache: Map<string, React.ComponentType<Record<string, unknown>>>;
} {
  return {
    componentKeyCache,
    componentInstanceCache,
  };
} 