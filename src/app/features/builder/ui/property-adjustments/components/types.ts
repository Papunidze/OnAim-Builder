export interface PropertyValue {
  [key: string]: unknown;
}

export interface ComponentState {
  error: string;
  isRendering: boolean;
}

export interface PropertyRendererProps {
  className?: string;
}

export interface ComponentData {
  id?: string;
  name: string;
  compiledData?: {
    files?: {
      file: string;
      content: string;
    }[];
  };
  props?: PropertyValue;
}
