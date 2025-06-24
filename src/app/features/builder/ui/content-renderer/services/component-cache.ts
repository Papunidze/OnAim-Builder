const componentKeyCache = new Map<string, string>();
const componentInstanceCache = new Map<
  string,
  React.ComponentType<Record<string, unknown>>
>();

export function clearComponentInstanceCache(componentId?: string): void {
  if (componentId) {
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
    componentKeyCache.clear();
    componentInstanceCache.clear();
  }
}

export function getComponentCaches(): {
  componentKeyCache: Map<string, string>;
  componentInstanceCache: Map<
    string,
    React.ComponentType<Record<string, unknown>>
  >;
} {
  return {
    componentKeyCache,
    componentInstanceCache,
  };
}
