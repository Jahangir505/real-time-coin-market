// components/ConnectionStatus.tsx
"use client";
import { useAppSelector } from "@/app/store/hooks";
import {
  selectConnectionStatus,
  selectLastUpdated,
} from "@/app/store/slices/priceSlice";

export default function ConnectionStatus() {
  const isConnected = useAppSelector(selectConnectionStatus);
  const lastUpdated = useAppSelector(selectLastUpdated);

  return (
    <div className="flex items-center space-x-4">
      <div
        className={`flex items-center ${
          isConnected ? "text-green-400" : "text-red-400"
        }`}
      >
        <div
          className={`w-3 h-3 rounded-full mr-2 ${
            isConnected ? "bg-green-400" : "bg-red-400"
          }`}
        ></div>
        {isConnected ? "Connected" : "Disconnected"}
      </div>
      {lastUpdated && (
        <div className="text-sm text-gray-400">
          Last update: {new Date(lastUpdated).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
