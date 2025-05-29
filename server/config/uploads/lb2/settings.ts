import {
  BorderSettingSet,
  ColorSetting,
  createSettingGroup,
  OpacitySetting,
  SettingGroup,
  StringSetting,
  WidthSetting,
} from "builder-settings-types";

export const settings = createSettingGroup({
  title: "Settings",
  main: true,
  settings: {
    leaderboard: new SettingGroup({
      title: "Leaderboard",
      settings: {
        test: new StringSetting({
          title: "Test",
          default: "test",
        }),
        background: new ColorSetting({
          default: "255,255,255",
          title: "background",
        }),
        width: new WidthSetting({
          default: 860,
          mobile: 370,
          title: "width",
        }),
        opacity: new OpacitySetting({
          default: 100,
        }),
        border: new BorderSettingSet({}),
      },
    }),
  },
});

export default settings;
