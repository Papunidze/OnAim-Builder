import type { JSX } from "react";
import styles from "../save.module.css";

export interface DropdownOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  onClick: () => void;
}

interface SaveDropdownProps {
  isOpen: boolean;
  options: DropdownOption[];
}

export const SaveDropdown = ({
  isOpen,
  options,
}: SaveDropdownProps): JSX.Element | null => {
  if (!isOpen) return null;

  return (
    <div className={styles.dropdownMenu}>
      {options.map((option) => (
        <button
          key={option.id}
          className={styles.dropdownItem}
          onClick={option.onClick}
        >
          <span className={styles.dropdownIcon}>{option.icon}</span>
          <div className={styles.dropdownContent}>
            <span className={styles.dropdownLabel}>{option.label}</span>
            <span className={styles.dropdownDescription}>
              {option.description}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};
