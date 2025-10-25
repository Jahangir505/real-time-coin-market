// components/PriceList.tsx
"use client";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { selectCoins } from "@/app/store/slices/coinSlice";
import {
  addSymbol,
  removeSymbol,
  selectSettings,
} from "@/app/store/slices/notificationSlice";
import { selectAllPrices } from "@/app/store/slices/priceSlice";
import { CoinInfo, PriceData } from "@/types";
import { useMemo, useState } from "react";

type SortField = "symbol" | "price" | "changePercent" | "volume";
type SortDirection = "asc" | "desc";

export default function PriceList() {
  const prices = useAppSelector(selectAllPrices);
  const coins = useAppSelector(selectCoins);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("symbol");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "gainers" | "losers"
  >("all");

  // Combine price data with coin info
  const priceList = useMemo(() => {
    return Object.values(prices)
      .map((priceData) => ({
        ...priceData,
        coinInfo: coins[priceData.symbol],
        volume: 0, // You can add volume data if needed
      }))
      .filter((item) => {
        // Search filter
        const matchesSearch =
          item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.coinInfo?.name.toLowerCase().includes(searchTerm.toLowerCase());

        // Gainers/losers filter
        if (selectedFilter === "gainers") {
          return matchesSearch && (item.changePercent || 0) > 0;
        } else if (selectedFilter === "losers") {
          return matchesSearch && (item.changePercent || 0) < 0;
        }

        return matchesSearch;
      })
      .sort((a, b) => {
        let aValue: any = a[sortField];
        let bValue: any = b[sortField];

        // Handle symbol sorting
        if (sortField === "symbol") {
          aValue = a.symbol;
          bValue = b.symbol;
        }

        // Handle change percent sorting (use 0 if undefined)
        if (sortField === "changePercent") {
          aValue = a.changePercent || 0;
          bValue = b.changePercent || 0;
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [prices, coins, searchTerm, sortField, sortDirection, selectedFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return "↕️";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Market Prices</h2>
        <div className="text-sm text-gray-400">{priceList.length} coins</div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by symbol or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedFilter("all")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedFilter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedFilter("gainers")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedFilter === "gainers"
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Gainers
          </button>
          <button
            onClick={() => setSelectedFilter("losers")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedFilter === "losers"
                ? "bg-red-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Losers
          </button>
        </div>
      </div>

      {/* Price Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th
                className="text-left py-3 px-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
                onClick={() => handleSort("symbol")}
              >
                <div className="flex items-center gap-2">
                  Coin
                  <span className="text-xs">{getSortIcon("symbol")}</span>
                </div>
              </th>
              <th
                className="text-right py-3 px-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
                onClick={() => handleSort("price")}
              >
                <div className="flex items-center justify-end gap-2">
                  Price
                  <span className="text-xs">{getSortIcon("price")}</span>
                </div>
              </th>
              <th
                className="text-right py-3 px-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
                onClick={() => handleSort("changePercent")}
              >
                <div className="flex items-center justify-end gap-2">
                  24h Change
                  <span className="text-xs">
                    {getSortIcon("changePercent")}
                  </span>
                </div>
              </th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {priceList.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-400">
                  {searchTerm
                    ? "No coins match your search"
                    : "No price data available"}
                </td>
              </tr>
            ) : (
              priceList.map((item) => (
                <PriceRow key={item.symbol} item={item} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Statistics */}
      {priceList.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-400">Total Coins</div>
              <div className="text-lg font-semibold">{priceList.length}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Top Gainer</div>
              <div className="text-lg font-semibold text-green-400">
                {(() => {
                  const gainer = priceList
                    .filter((item) => (item.changePercent || 0) > 0)
                    .sort(
                      (a, b) => (b.changePercent || 0) - (a.changePercent || 0)
                    )[0];
                  return gainer
                    ? `${gainer.symbol.toUpperCase()} +${(
                        gainer.changePercent || 0
                      ).toFixed(2)}%`
                    : "N/A";
                })()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Top Loser</div>
              <div className="text-lg font-semibold text-red-400">
                {(() => {
                  const loser = priceList
                    .filter((item) => (item.changePercent || 0) < 0)
                    .sort(
                      (a, b) => (a.changePercent || 0) - (b.changePercent || 0)
                    )[0];
                  return loser
                    ? `${loser.symbol.toUpperCase()} ${(
                        loser.changePercent || 0
                      ).toFixed(2)}%`
                    : "N/A";
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface PriceRowProps {
  item: PriceData & { coinInfo?: CoinInfo; volume: number };
}

function PriceRow({ item }: PriceRowProps) {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectSettings);
  const isMonitored = settings.enabledSymbols.includes(item.symbol);

  const handleToggleMonitor = () => {
    if (isMonitored) {
      dispatch(removeSymbol(item.symbol));
    } else {
      dispatch(addSymbol(item.symbol));
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    return price.toFixed(6);
  };

  const changePercent = item.changePercent || 0;
  const isPositive = changePercent > 0;

  return (
    <tr className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
      {/* Coin */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold">
              {item.symbol.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-semibold">{item.symbol.toUpperCase()}</div>
            <div className="text-sm text-gray-400">
              {item.coinInfo?.name || "Unknown"}
            </div>
          </div>
        </div>
      </td>

      {/* Price */}
      <td className="text-right py-4 px-4">
        <div className="font-semibold">${formatPrice(item.price)}</div>
        <div className="text-sm text-gray-400">
          ${item.price.toLocaleString()}
        </div>
      </td>

      {/* 24h Change */}
      <td className="text-right py-4 px-4">
        <div
          className={`font-semibold ${
            isPositive ? "text-green-400" : "text-red-400"
          }`}
        >
          {isPositive ? "+" : ""}
          {changePercent.toFixed(2)}%
        </div>
        <div className="text-sm text-gray-400">
          {isPositive ? "↗" : "↘"} 24h
        </div>
      </td>

      {/* Actions */}
      <td className="text-right py-4 px-4">
        <div className="flex justify-end gap-2">
          <button
            onClick={handleToggleMonitor}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              isMonitored
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isMonitored ? "Remove" : "Add"}
          </button>
          <button
            onClick={() => {
              // Navigate to coin detail or open quick target modal
              // You can implement this based on your needs
            }}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
          >
            Targets
          </button>
        </div>
      </td>
    </tr>
  );
}
