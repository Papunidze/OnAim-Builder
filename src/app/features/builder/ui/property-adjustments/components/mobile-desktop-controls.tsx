import React from "react";
import type { SettingsObject } from "../services/settings-compiler";
import { useMobileDesktopManager } from "../hooks/useMobileDesktopManager";

interface MobileDesktopControlsProps {
  settingsObject: SettingsObject | null;
  onUpdate?: () => void;
  className?: string;
}

export const MobileDesktopControls: React.FC<MobileDesktopControlsProps> = ({
  settingsObject,
  onUpdate,
  className = "",
}) => {
  const {
    getMobileDefaults,
    resetMobileToDefaults,
    switchToMobile,
    switchToDesktop,
    getMobileCapableProperties,
  } = useMobileDesktopManager(settingsObject);

  const handleGetMobileDefaults = (): void => {
    const result = getMobileDefaults();
    if (result.success) {
      console.warn("Mobile defaults:", result.data);
      alert("Mobile defaults retrieved! Check console for details.");
    } else {
      console.error("Error:", result.error);
      alert(`Error: ${result.error}`);
    }
  };

  const handleResetMobileToDefaults = (): void => {
    const result = resetMobileToDefaults();
    if (result.success) {
      console.warn("Reset values:", result.resetValues);
      alert("Mobile values reset to defaults! Check console for details.");
      onUpdate?.();
    } else {
      console.error("Error:", result.error);
      alert(`Error: ${result.error}`);
    }
  };

  const handleSwitchToMobile = (): void => {
    const result = switchToMobile();
    if (result.success) {
      console.warn("Switched to mobile mode:", result.data);
      alert("Switched to mobile mode! Check console for details.");
      onUpdate?.();
    } else {
      console.error("Error:", result.error);
      alert(`Error: ${result.error}`);
    }
  };

  const handleSwitchToDesktop = (): void => {
    const result = switchToDesktop();
    if (result.success) {
      console.warn("Switched to desktop mode:", result.data);
      alert("Switched to desktop mode! Check console for details.");
      onUpdate?.();
    } else {
      console.error("Error:", result.error);
      alert(`Error: ${result.error}`);
    }
  };

  const handleGetMobileCapableProperties = (): void => {
    const properties = getMobileCapableProperties();
    console.warn("Mobile-capable properties:", properties);
    alert(`Found ${properties.length} mobile-capable properties! Check console for list.`);
  };

  if (!settingsObject) {
    return (
      <div className={`p-4 border border-gray-200 rounded-lg bg-gray-50 ${className}`}>
        <p className="text-gray-500 text-sm">No settings object available</p>
      </div>
    );
  }

  return (
    <div className={`p-4 border border-gray-200 rounded-lg bg-white ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Mobile-Desktop Manager
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          onClick={handleGetMobileDefaults}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
        >
          Get Mobile Defaults
        </button>
        
        <button
          onClick={handleResetMobileToDefaults}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
        >
          Reset Mobile to Defaults
        </button>
        
        <button
          onClick={handleSwitchToMobile}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
        >
          Switch to Mobile
        </button>
        
        <button
          onClick={handleSwitchToDesktop}
          className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors text-sm"
        >
          Switch to Desktop
        </button>
        
        <button
          onClick={handleGetMobileCapableProperties}
          className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors text-sm"
        >
          Get Mobile Properties
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-600">
        <p>
          <strong>Mobile Defaults:</strong> Shows properties with mobile variants defined
        </p>
        <p>
          <strong>Reset Mobile:</strong> Resets mobile values to their original defaults (e.g., width: 370 → 20)
        </p>
        <p>
          <strong>Switch Mode:</strong> Toggles between mobile and desktop view modes
        </p>
      </div>
    </div>
  );
};

export default MobileDesktopControls; 