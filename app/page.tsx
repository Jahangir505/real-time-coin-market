// app/page.tsx
"use client";

import ConnectionStatus from "@/components/ConnectionStatus";
import NotificationSettings from "@/components/NotificationSettings";
import PriceMonitor from "@/components/PriceMonitor";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import {
  markAsRead,
  selectNotifications,
  selectSettings,
  selectUnreadCount,
} from "./store/slices/notificationSlice";
import { selectConnectionStatus } from "./store/slices/priceSlice";

type TabType = "monitor" | "prices" | "notifications" | "settings";

export default function Home() {
  const dispatch = useAppDispatch();
  const isConnected = useAppSelector(selectConnectionStatus);
  const unreadCount = useAppSelector(selectUnreadCount);
  const settings = useAppSelector(selectSettings);
  const [activeTab, setActiveTab] = useState<TabType>("monitor");

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const tabs: { id: TabType; label: string; badge?: number }[] = [
    { id: "monitor", label: "Monitor" },
    { id: "prices", label: "Prices" },
    { id: "notifications", label: "Notifications", badge: unreadCount },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Binance Price Alerts</h1>
            <ConnectionStatus />
          </div>
        </div>
      </header>

      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-3 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-gray-300"
                }`}
              >
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {activeTab === "monitor" && <PriceMonitor />}
        {/* {activeTab === "prices" && <PriceList />} */}
        {activeTab === "notifications" && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Notifications</h2>
            <NotificationsList />
          </div>
        )}
        {activeTab === "settings" && <NotificationSettings />}
      </main>
    </div>
  );
}

function NotificationsList() {
  const notifications = useAppSelector(selectNotifications);
  const dispatch = useAppDispatch();

  if (notifications.length === 0) {
    return <p className="text-gray-400">No notifications yet</p>;
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg border ${
            notification.changePercent > 0
              ? "bg-green-900/20 border-green-700"
              : "bg-red-900/20 border-red-700"
          } ${!notification.read ? "ring-2 ring-blue-500" : ""}`}
        >
          <div className="flex justify-between items-center">
            <span className="font-semibold">
              {notification.symbol.toUpperCase()}
            </span>
            <span
              className={
                notification.changePercent > 0
                  ? "text-green-400"
                  : "text-red-400"
              }
            >
              {notification.changePercent > 0 ? "📈" : "📉"}{" "}
              {notification.changePercent.toFixed(2)}%
            </span>
          </div>
          <div className="text-sm text-gray-400 mt-1">
            {new Date(notification.timestamp).toLocaleString()}
          </div>
          {!notification.read && (
            <button
              onClick={() => dispatch(markAsRead(notification.id))}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300"
            >
              Mark as read
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
