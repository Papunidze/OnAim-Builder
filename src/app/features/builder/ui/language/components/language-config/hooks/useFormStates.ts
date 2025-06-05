import { useState, useEffect, useMemo } from "react";
import type {
  LanguageEntry,
  LanguageObject,
} from "../../../types/language.types";

interface UseFormStatesProps {
  translationKeys: string[];
  selectedLanguage: string;
  languages: LanguageEntry[];
  languageObject: LanguageObject | null;
}

interface UseFormStatesReturn {
  newLanguageCode: string;
  newLanguageName: string;
  newTranslations: Record<string, string>;
  setNewLanguageCode: (code: string) => void;
  setNewLanguageName: (name: string) => void;
  setNewTranslations: (translations: Record<string, string>) => void;
  updateNewTranslation: (key: string, value: string) => void;
  resetAddForm: () => void;

  editTranslations: Record<string, string>;
  setEditTranslations: (translations: Record<string, string>) => void;
  updateEditTranslation: (key: string, value: string) => void;

  canSubmitAdd: boolean;
  canSubmitEdit: boolean;
}

export function useFormStates({
  translationKeys,
  selectedLanguage,
  languages,
  languageObject,
}: UseFormStatesProps): UseFormStatesReturn {
  const [newLanguageCode, setNewLanguageCode] = useState("");
  const [newLanguageName, setNewLanguageName] = useState("");
  const [newTranslations, setNewTranslations] = useState<
    Record<string, string>
  >({});

  const [editTranslations, setEditTranslations] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const initialTranslations: Record<string, string> = {};
    translationKeys.forEach((key) => {
      initialTranslations[key] = "";
    });
    setNewTranslations(initialTranslations);
  }, [translationKeys]);
  useEffect(() => {
    if (selectedLanguage && languageObject) {
      try {
        const existingTranslations =
          languageObject.getTranslations(selectedLanguage);

        const completeTranslations: Record<string, string> = {};
        translationKeys.forEach((key) => {
          completeTranslations[key] = existingTranslations[key] || "";
        });

        setEditTranslations(completeTranslations);
      } catch (error) {
        console.error("Error loading translations for editing:", error);
        const emptyTranslations: Record<string, string> = {};
        translationKeys.forEach((key) => {
          emptyTranslations[key] = "";
        });
        setEditTranslations(emptyTranslations);
      }
    } else {
      setEditTranslations({});
    }
  }, [selectedLanguage, languageObject, translationKeys]);

  const updateNewTranslation = (key: string, value: string): void => {
    setNewTranslations((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateEditTranslation = (key: string, value: string): void => {
    setEditTranslations((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetAddForm = (): void => {
    setNewLanguageCode("");
    setNewLanguageName("");
    const initialTranslations: Record<string, string> = {};
    translationKeys.forEach((key) => {
      initialTranslations[key] = "";
    });
    setNewTranslations(initialTranslations);
  };

  const canSubmitAdd = useMemo(() => {
    return (
      newLanguageCode.trim() !== "" &&
      newLanguageName.trim() !== "" &&
      !languages.some((lang) => lang.code === newLanguageCode.toLowerCase())
    );
  }, [newLanguageCode, newLanguageName, languages]);

  const canSubmitEdit = useMemo(() => {
    return selectedLanguage !== "";
  }, [selectedLanguage]);

  return {
    newLanguageCode,
    newLanguageName,
    newTranslations,
    setNewLanguageCode,
    setNewLanguageName,
    setNewTranslations,
    updateNewTranslation,
    resetAddForm,

    editTranslations,
    setEditTranslations,
    updateEditTranslation,

    canSubmitAdd,
    canSubmitEdit,
  };
}
