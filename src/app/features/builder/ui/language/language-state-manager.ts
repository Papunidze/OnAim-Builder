// Language state management service
import { useState, useEffect } from "react";

interface LanguageState {
  [componentName: string]: string;
}

class LanguageStateManager {
  private listeners: Set<() => void> = new Set();
  private languageStates: LanguageState = {};

  setLanguage(componentName: string, language: string): void {
    this.languageStates[componentName] = language;
    this.notifyListeners();
  }

  getLanguage(componentName: string): string | undefined {
    return this.languageStates[componentName];
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  getAllStates(): LanguageState {
    return { ...this.languageStates };
  }
}

export const languageStateManager = new LanguageStateManager();

export function useLanguageState(
  componentName: string
): [string | undefined, (language: string) => void] {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = languageStateManager.subscribe(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, []);

  const setLanguage = (language: string): void => {
    languageStateManager.setLanguage(componentName, language);
  };

  return [languageStateManager.getLanguage(componentName), setLanguage];
}
