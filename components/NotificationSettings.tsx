// components/NotificationSettings.tsx
"use client";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import {
  addSymbol,
  clearNotifications,
  markAllAsRead,
  removeSymbol,
  selectSettings,
  updateSettings,
} from "@/app/store/slices/notificationSlice";
import { useState } from "react";

export default function NotificationSettings() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectSettings);
  const [newSymbol, setNewSymbol] = useState("");

  const handleAddSymbol = () => {
    if (newSymbol.trim()) {
      dispatch(addSymbol(newSymbol.trim()));
      setNewSymbol("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddSymbol();
    }
  };

  const testNotification = () => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Test Notification", {
        body: "This is a test notification from Binance Price Alerts",
        icon: "/crypto-icon.png",
      });
    } else if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("Test Notification", {
            body: "This is a test notification from Binance Price Alerts",
            icon: "/crypto-icon.png",
          });
        }
      });
    } else {
      alert("Please enable browser notifications in your browser settings");
    }
  };

  return (
    <div className="space-y-6">
      {/* Threshold Settings */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Alert Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Price Change Threshold: {settings.threshold}%
            </label>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={settings.threshold}
              onChange={(e) =>
                dispatch(
                  updateSettings({
                    threshold: parseFloat(e.target.value),
                  })
                )
              }
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0.1%</span>
              <span>5%</span>
              <span>10%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Symbol Management */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Monitor Symbols</h3>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder="Add symbol (e.g., BTCUSDT)"
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
            />
            <button
              onClick={handleAddSymbol}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {settings.enabledSymbols.map((symbol) => (
              <div
                key={symbol}
                className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded"
              >
                <span className="font-medium">{symbol.toUpperCase()}</span>
                <button
                  onClick={() => dispatch(removeSymbol(symbol))}
                  className="text-red-400 hover:text-red-300 text-lg"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notification Methods */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Notification Methods</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notificationMethods.browser}
              onChange={(e) =>
                dispatch(
                  updateSettings({
                    notificationMethods: {
                      ...settings.notificationMethods,
                      browser: e.target.checked,
                    },
                  })
                )
              }
              className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2">Browser Notifications</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) =>
                dispatch(
                  updateSettings({
                    soundEnabled: e.target.checked,
                  })
                )
              }
              className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2">Sound Alerts</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={testNotification}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
          >
            Test Notification
          </button>
          <button
            onClick={() => dispatch(markAllAsRead())}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            Mark All as Read
          </button>
          <button
            onClick={() => dispatch(clearNotifications())}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
          >
            Clear Notifications
          </button>
        </div>
      </div>
    </div>
  );
}
