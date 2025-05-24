import { ColorSetting, SettingGroup } from "builder-settings-types";

export const oa_settings = new SettingGroup({
  title: "Settings",
  settings: {
    color: ColorSetting({
      defaultValue: "#000000",
      title: "Color",
    }),
  },
});
