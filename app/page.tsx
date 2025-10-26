// Update the main page to include All Coins tab
// app/page.tsx
"use client";
import AllCoinsList from "@/components/AllCoinsList";
import ConnectionStatus from "@/components/ConnectionStatus";
import NotificationSettings from "@/components/NotificationSettings";
import PriceList from "@/components/PriceList";
import PriceMonitor from "@/components/PriceMonitor";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import {
  selectSettings,
  selectUnreadCount,
} from "./store/slices/notificationSlice";
import { selectConnectionStatus } from "./store/slices/priceSlice";

type TabType =
  | "monitor"
  | "prices"
  | "all-coins"
  | "notifications"
  | "settings";

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
    { id: "all-coins", label: "All Coins" },
    { id: "notifications", label: "Notifications", badge: unreadCount },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header and Navigation remain the same */}
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
        {activeTab === "prices" && <PriceList />}
        {activeTab === "all-coins" && <AllCoinsList />}
        {activeTab === "notifications" && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Notifications</h2>
              {/* Add clear buttons if needed */}
            </div>
            {/* <NotificationsList /> */}
          </div>
        )}
        {activeTab === "settings" && <NotificationSettings />}
      </main>
    </div>
  );
}
