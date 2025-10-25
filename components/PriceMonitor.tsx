// components/PriceMonitor.tsx
"use client";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import {
  addNotification,
  selectSettings,
} from "@/app/store/slices/notificationSlice";
import {
  selectAllPrices,
  setConnectionStatus,
  updatePrice,
} from "@/app/store/slices/priceSlice";
import { BinanceWebSocketService } from "@/lib/websocket";
import { WebSocketMessage } from "@/types";
import { useEffect, useRef } from "react";

export default function PriceMonitor() {
  const dispatch = useAppDispatch();
  const prices = useAppSelector(selectAllPrices);
  const settings = useAppSelector(selectSettings);
  const wsServiceRef = useRef<BinanceWebSocketService | null>(null);

  useEffect(() => {
    // Initialize WebSocket service
    wsServiceRef.current = new BinanceWebSocketService(
      (data: WebSocketMessage) => {
        if (data.data && data.data.s && data.data.c) {
          const symbol = data.data.s.toLowerCase();
          const price = parseFloat(data.data.c);
          const previousPrice = prices[symbol]?.price;

          dispatch(updatePrice({ symbol, price }));

          // Check for significant price changes
          if (previousPrice && settings.enabledSymbols.includes(symbol)) {
            const changePercent =
              ((price - previousPrice) / previousPrice) * 100;

            if (Math.abs(changePercent) >= settings.threshold) {
              dispatch(
                addNotification({
                  symbol,
                  previousPrice,
                  currentPrice: price,
                  changePercent,
                  timestamp: new Date().toISOString(),
                })
              );
            }
          }
        }
      },
      (status: boolean) => {
        dispatch(setConnectionStatus(status));
      }
    );

    // Connect with initial symbols
    wsServiceRef.current.connect(settings.enabledSymbols);

    // Cleanup on unmount
    return () => {
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
      }
    };
  }, [dispatch, settings.enabledSymbols]);

  // Update WebSocket when symbols change
  useEffect(() => {
    if (wsServiceRef.current) {
      wsServiceRef.current.updateSymbols(settings.enabledSymbols);
    }
  }, [settings.enabledSymbols]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {settings.enabledSymbols.map((symbol) => {
          const priceData = prices[symbol];
          return (
            <PriceCard key={symbol} symbol={symbol} priceData={priceData} />
          );
        })}
      </div>
    </div>
  );
}

interface PriceCardProps {
  symbol: string;
  priceData?: {
    price: number;
    changePercent?: number;
    timestamp: number;
  };
}

function PriceCard({ symbol, priceData }: PriceCardProps) {
  const changePercent = priceData?.changePercent || 0;
  const isPositive = changePercent > 0;

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold text-lg">{symbol.toUpperCase()}</span>
        <span className="text-sm text-gray-400">Live</span>
      </div>
      <div className="text-2xl font-bold">
        {priceData ? `$${priceData.price.toFixed(4)}` : "Loading..."}
      </div>
      {priceData && (
        <div
          className={`text-sm mt-1 ${
            isPositive ? "text-green-400" : "text-red-400"
          }`}
        >
          {isPositive ? "↗" : "↘"} {Math.abs(changePercent).toFixed(2)}%
        </div>
      )}
    </div>
  );
}
