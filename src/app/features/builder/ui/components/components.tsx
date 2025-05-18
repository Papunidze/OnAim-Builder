import { Image } from "@app-shared/components";
import { type JSX } from "react";

const items = ["leaderboard", "ruls", "withdrow"];

import "./components.css";
const Components = (): JSX.Element => {
  return (
    <div className="builder-property-components">
      <div className="builder-property-components__content">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            className={`builder-property-components__item builder-property-components__item--${item}`}
          >
            <label className="builder-property-components__item-label">
              {item}
            </label>
            <Image imageKey="icon:chevron" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default Components;
