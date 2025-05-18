import { Image } from "@app-shared/components";
import type { JSX } from "react";
import "./header.css";

const Header = (): JSX.Element => (
  <header className="builder-header">
    <div className="builder-header__content">
      <div className="builder-header__left">
        <div className="builder-header__logo">
          <Image imageKey="logo:primary" alt="Logo" />
        </div>
        <div className="builder-header__divider" />
        <div className="builder-header__view-switch">
          <button
            type="button"
            className="builder-header__view-button builder-header__view-button--desktop is-active"
            aria-label="Desktop view"
          >
            <Image imageKey="icon:desktop" />
          </button>
          <button
            type="button"
            className="builder-header__view-button builder-header__view-button--mobile"
            aria-label="Mobile view"
          >
            <Image imageKey="icon:mobile" />
          </button>
        </div>
      </div>

      <div className="builder-header__actions">
        <div className="builder-header__history">
          <button className="builder-header__icon-button" aria-label="Undo">
            <Image imageKey="icon:undo" />
            <label className="builder-header__icon-button-label">Undo</label>
          </button>
          <button
            className="builder-header__icon-button"
            disabled
            aria-label="Redo"
          >
            <Image imageKey="icon:redo" />
            <span className="builder-header__icon-button-label">Redo</span>
          </button>
        </div>

        <div className="builder-header__divider" />

        <button className="builder-header__icon-button" aria-label="Custom">
          <Image imageKey="icon:reset" />
          <label className="builder-header__icon-button-label">Reset</label>
        </button>

        <div className="builder-header__divider" />

        <button className="builder-header__preview-label" aria-label="Preview">
          Preview
        </button>

        <button className="builder-header__save-button">Save</button>
      </div>
    </div>
  </header>
);

export default Header;
