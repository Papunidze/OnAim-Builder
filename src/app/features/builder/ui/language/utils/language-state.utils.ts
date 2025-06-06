import type { ComponentState } from "@app-shared/services/builder";
import { compileLanguageObject } from "../compiler/language-compiler";

export interface LanguageStateData {
  currentLanguage: string;
  languageData: Record<string, Record<string, string>>;
  content: string;
}

export class LanguageStateUtils {
  /**
   * Extract language state from a component
   */
  static extractLanguageFromComponent(component: ComponentState): LanguageStateData | null {
    if (!component.compiledData?.files) {
      return null;
    }

    const languageFile = component.compiledData.files.find(file => 
      file.file.includes('language') || file.type === 'language' || file.file.endsWith('.language.ts')
    );

    if (!languageFile) {
      return null;
    }

    try {
      const languageObject = compileLanguageObject(languageFile.content, component.name);
      if (!languageObject) {
        return null;
      }

      return {
        currentLanguage: languageObject.getCurrentLanguage(),
        languageData: languageObject.getLanguageData(),
        content: languageFile.content,
      };
    } catch (error) {
      console.warn(`Failed to extract language state from component ${component.name}:`, error);
      return null;
    }
  }

  /**
   * Create or update language file in component
   */
  static updateComponentLanguage(
    component: ComponentState, 
    languageData: LanguageStateData
  ): void {
    if (!component.compiledData) {
      component.compiledData = { files: [] };
    }

    const languageFileIndex = component.compiledData.files.findIndex(file => 
      file.file.includes('language') || file.type === 'language' || file.file.endsWith('.language.ts')
    );

    const languageFile = {
      file: 'language.ts',
      type: 'language',
      content: languageData.content,
      prefix: component.name,
    };

    if (languageFileIndex >= 0) {
      component.compiledData.files[languageFileIndex] = languageFile;
    } else {
      component.compiledData.files.push(languageFile);
    }
  }

  /**
   * Merge language data from multiple components
   */
  static mergeLanguageStates(languageStates: LanguageStateData[]): {
    globalState: Record<string, Record<string, string>>;
    lastActiveLanguage: string;
  } {
    const globalState: Record<string, Record<string, string>> = {};
    let lastActiveLanguage = "en";

    languageStates.forEach((state) => {
      Object.keys(state.languageData).forEach((lang) => {
        if (!globalState[lang]) {
          globalState[lang] = {};
        }
        Object.assign(globalState[lang], state.languageData[lang]);
      });
      lastActiveLanguage = state.currentLanguage;
    });

    return {
      globalState,
      lastActiveLanguage,
    };
  }

  /**
   * Generate updated language content with new data
   */
  static generateLanguageContent(
    languageData: Record<string, Record<string, string>>,
    currentLanguage: string
  ): string {
    const dataString = JSON.stringify(languageData, null, 2);
    
    return `import { SetLanguage } from "language-management-lib";

const languageData = ${dataString};

export const lng = new SetLanguage(languageData, "${currentLanguage}");
export default lng;`;
  }

  /**
   * Validate language data structure
   */
  static validateLanguageData(data: unknown): data is LanguageStateData {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const langData = data as Record<string, unknown>;
    
    return (
      typeof langData.currentLanguage === 'string' &&
      typeof langData.languageData === 'object' &&
      langData.languageData !== null &&
      typeof langData.content === 'string'
    );
  }
} 