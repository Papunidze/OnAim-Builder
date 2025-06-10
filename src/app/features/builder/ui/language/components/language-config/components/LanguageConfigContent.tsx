import type { JSX } from "react";
import { useState } from "react";
import { useBuilder } from "@app-shared/services/builder/useBuilder.service";
import { LanguageConfigTabs } from "./LanguageConfigTabs";
import { AddLanguageForm } from "./AddLanguageForm";
import { EditLanguageForm } from "./EditLanguageForm";
import { useLanguageConfigData } from "../hooks/useLanguageConfigData";
import { useLanguageManagement } from "../hooks/useLanguageManagement";
import { useLanguageActions } from "../hooks/useLanguageActions";
import { useFormStates } from "../hooks/useFormStates";
import styles from "../language-config.module.css";

interface LanguageConfigContentProps {
  onClose?: () => void;
}

export function LanguageConfigContent({
  onClose,
}: LanguageConfigContentProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<"add" | "edit">("add");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { getSelectedComponent } = useBuilder();
  const selectedComponent = getSelectedComponent();

  const { languageObject, translationKeys } = useLanguageConfigData({
    selectedComponent,
  });

  const { languages, refreshLanguages } = useLanguageManagement({
    languageObject,
  });

  const {
    handleAddLanguage: addLanguageAction,
    handleUpdateLanguage: updateLanguageAction,
  } = useLanguageActions({
    languageObject,
    selectedComponent,
    refreshLanguages,
  });

  const {
    newLanguageCode,
    newLanguageName,
    newTranslations,
    setNewLanguageCode,
    setNewLanguageName,
    updateNewTranslation,
    resetAddForm,
    canSubmitAdd,

    editTranslations,
    updateEditTranslation,
    canSubmitEdit,
  } = useFormStates({
    translationKeys,
    selectedLanguage,
    languages,
    languageObject,
    selectedComponent,
  });

  const handleLanguageSelect = (languageCode: string): void => {
    setSelectedLanguage(languageCode);
  };
  const handleAddLanguage = async (): Promise<void> => {
    if (!canSubmitAdd) return;

    setIsSubmitting(true);
    try {
      await addLanguageAction(newLanguageCode.toLowerCase(), newTranslations);
      resetAddForm();
      setActiveTab("edit");
    } catch (error) {
      console.error("Failed to add language:", error);
    } finally {
      setIsSubmitting(false);
    }
    onClose?.();
  };

  const handleUpdateLanguage = async (): Promise<void> => {
    if (!canSubmitEdit) return;

    setIsSubmitting(true);
    try {
      await updateLanguageAction(selectedLanguage, editTranslations);
    } catch (error) {
      console.error("Failed to update language:", error);
    } finally {
      setIsSubmitting(false);
    }
    onClose?.();
  };

  if (!languageObject) {
    return (
      <div className={styles.content}>
        <div className={styles.loadingState}>
          <p>Loading language configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.content}>
      <LanguageConfigTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className={styles.tabContent}>
        {activeTab === "add" ? (
          <AddLanguageForm
            languageCode={newLanguageCode}
            languageName={newLanguageName}
            translations={newTranslations}
            translationKeys={translationKeys}
            onLanguageCodeChange={setNewLanguageCode}
            onLanguageNameChange={setNewLanguageName}
            onTranslationChange={updateNewTranslation}
            onSubmit={handleAddLanguage}
            isSubmitting={isSubmitting}
          />
        ) : (
          <EditLanguageForm
            languages={languages}
            selectedLanguage={selectedLanguage}
            editTranslations={editTranslations}
            onLanguageSelect={handleLanguageSelect}
            onTranslationChange={updateEditTranslation}
            onSubmit={handleUpdateLanguage}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
