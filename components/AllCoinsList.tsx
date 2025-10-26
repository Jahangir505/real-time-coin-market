// components/AllCoinsList.tsx
"use client";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import {
  fetchAllCoinPrices,
  fetchAllCoins,
  selectAllCoins,
  selectCoinError,
  selectCoinLoading,
  selectCoinStats,
  selectFilteredCoins,
  selectPricesLoading,
  setFilterQuoteAsset,
  setFilterStatus,
  setSearchTerm,
} from "@/app/store/slices/coinSlice";
import {
  addSymbol,
  removeSymbol,
  selectSettings,
} from "@/app/store/slices/notificationSlice";
import { CoinInfo } from "@/types";
import { useEffect, useMemo, useState } from "react";

type SortField =
  | "symbol"
  | "baseAsset"
  | "status"
  | "price"
  | "priceChangePercent"
  | "volume";
type SortDirection = "asc" | "desc";

export default function AllCoinsList() {
  const dispatch = useAppDispatch();
  const allCoins = useAppSelector(selectAllCoins);
  const filteredCoins = useAppSelector(selectFilteredCoins);
  const loading = useAppSelector(selectCoinLoading);
  const pricesLoading = useAppSelector(selectPricesLoading);
  const error = useAppSelector(selectCoinError);
  const stats = useAppSelector(selectCoinStats);
  const settings = useAppSelector(selectSettings);

  const [sortField, setSortField] = useState<SortField>("symbol");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const itemsPerPage = 50;

  // Fetch all coins on component mount
  useEffect(() => {
    if (stats.total === 0) {
      dispatch(fetchAllCoins());
    }
  }, [dispatch, stats.total]);

  // Fetch prices when coins are loaded
  useEffect(() => {
    if (stats.total > 0 && stats.withPrices === 0) {
      dispatch(fetchAllCoinPrices());
    }
  }, [dispatch, stats.total, stats.withPrices]);

  // Auto-refresh prices
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (autoRefresh && stats.total > 0) {
      interval = setInterval(() => {
        dispatch(fetchAllCoinPrices());
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, dispatch, stats.total]);

  // Sort and paginate coins
  const displayedCoins = useMemo(() => {
    const sorted = [...filteredCoins].sort((a, b) => {
      const coinA = allCoins[a];
      const coinB = allCoins[b];

      let aValue: any = coinA[sortField];
      let bValue: any = coinB[sortField];

      if (sortField === "symbol") {
        aValue = coinA.symbol;
        bValue = coinB.symbol;
      } else if (sortField === "baseAsset") {
        aValue = coinA.baseAsset;
        bValue = coinB.baseAsset;
      } else if (
        sortField === "price" ||
        sortField === "priceChangePercent" ||
        sortField === "volume"
      ) {
        // Handle undefined values for price data
        aValue =
          coinA[sortField] ?? (sortDirection === "asc" ? Infinity : -Infinity);
        bValue =
          coinB[sortField] ?? (sortDirection === "asc" ? Infinity : -Infinity);
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    const startIndex = (currentPage - 1) * itemsPerPage;
    return sorted.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCoins, allCoins, sortField, sortDirection, currentPage]);

  const totalPages = Math.ceil(filteredCoins.length / itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return "↕️";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const handleSearch = (term: string) => {
    dispatch(setSearchTerm(term));
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    dispatch(fetchAllCoinPrices());
  };

  const handleRefreshAll = () => {
    dispatch(fetchAllCoins()).then(() => {
      dispatch(fetchAllCoinPrices());
    });
  };

  const formatPrice = (price: number | undefined) => {
    if (price === undefined) return "Loading...";
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatVolume = (volume: number | undefined) => {
    if (volume === undefined) return "-";
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(2)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(2)}K`;
    return volume.toFixed(2);
  };

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center text-red-400">
          <p className="text-lg mb-2">Error loading coins</p>
          <p className="text-sm mb-4">{error}</p>
          <button
            onClick={handleRefreshAll}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold">All Cryptocurrencies</h2>
          <p className="text-gray-400 text-sm">
            {stats.filtered} of {stats.total} coins • {stats.withPrices} with
            prices
            {stats.lastFetched && (
              <span>
                {" "}
                • Last updated:{" "}
                {new Date(stats.lastFetched).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded bg-gray-700 border-gray-600 text-blue-600"
            />
            <span className="text-sm">Auto-refresh (30s)</span>
          </label>
          <button
            onClick={handleRefresh}
            disabled={pricesLoading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded transition-colors"
          >
            {pricesLoading ? "Refreshing..." : "Refresh Prices"}
          </button>
          <button
            onClick={handleRefreshAll}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded transition-colors"
          >
            {loading ? "Loading..." : "Refresh All"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Search</label>
          <input
            type="text"
            placeholder="Search by symbol or name..."
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <select
            onChange={(e) => dispatch(setFilterStatus(e.target.value as any))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          >
            <option value="all">All Status</option>
            <option value="trading">Trading</option>
            <option value="halted">Halted</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Quote Asset</label>
          <select
            onChange={(e) => dispatch(setFilterQuoteAsset(e.target.value))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          >
            <option value="all">All Assets</option>
            <option value="USDT">USDT</option>
            <option value="BUSD">BUSD</option>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
          </select>
        </div>
      </div>

      {/* Coins Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 w-8">#</th>
              <th
                className="text-left py-3 px-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
                onClick={() => handleSort("symbol")}
              >
                <div className="flex items-center gap-2">
                  Symbol
                  <span className="text-xs">{getSortIcon("symbol")}</span>
                </div>
              </th>
              <th
                className="text-left py-3 px-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
                onClick={() => handleSort("baseAsset")}
              >
                <div className="flex items-center gap-2">
                  Base Asset
                  <span className="text-xs">{getSortIcon("baseAsset")}</span>
                </div>
              </th>
              <th className="text-left py-3 px-4">Quote Asset</th>
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
                onClick={() => handleSort("priceChangePercent")}
              >
                <div className="flex items-center justify-end gap-2">
                  24h Change
                  <span className="text-xs">
                    {getSortIcon("priceChangePercent")}
                  </span>
                </div>
              </th>
              <th
                className="text-right py-3 px-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
                onClick={() => handleSort("volume")}
              >
                <div className="flex items-center justify-end gap-2">
                  Volume
                  <span className="text-xs">{getSortIcon("volume")}</span>
                </div>
              </th>
              <th
                className="text-left py-3 px-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center gap-2">
                  Status
                  <span className="text-xs">{getSortIcon("status")}</span>
                </div>
              </th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && displayedCoins.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                </td>
              </tr>
            ) : displayedCoins.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-400">
                  No coins found matching your criteria
                </td>
              </tr>
            ) : (
              displayedCoins.map((symbol, index) => {
                const coin = allCoins[symbol];
                const isMonitored = settings.enabledSymbols.includes(symbol);
                const globalIndex =
                  (currentPage - 1) * itemsPerPage + index + 1;

                return (
                  <CoinRow
                    key={symbol}
                    coin={coin}
                    index={globalIndex}
                    isMonitored={isMonitored}
                    onToggleMonitor={() => {
                      if (isMonitored) {
                        dispatch(removeSymbol(symbol));
                      } else {
                        dispatch(addSymbol(symbol));
                      }
                    }}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface CoinRowProps {
  coin: CoinInfo;
  index: number;
  isMonitored: boolean;
  onToggleMonitor: () => void;
}

function CoinRow({ coin, index, isMonitored, onToggleMonitor }: CoinRowProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "TRADING":
        return "text-green-400";
      case "HALTED":
      case "BREAK":
        return "text-red-400";
      default:
        return "text-yellow-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "TRADING":
        return "Trading";
      case "HALTED":
        return "Halted";
      case "BREAK":
        return "Break";
      default:
        return status;
    }
  };

  const getChangeColor = (change: number | undefined) => {
    if (change === undefined) return "text-gray-400";
    return change >= 0 ? "text-green-400" : "text-red-400";
  };

  const getChangeIcon = (change: number | undefined) => {
    if (change === undefined) return "";
    return change >= 0 ? "↗" : "↘";
  };

  const formatPrice = (price: number | undefined) => {
    if (price === undefined) return "Loading...";
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatVolume = (volume: number | undefined) => {
    if (volume === undefined) return "-";
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(2)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(2)}K`;
    return volume.toFixed(2);
  };

  return (
    <tr className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
      <td className="py-4 px-4 text-gray-400">{index}</td>

      <td className="py-4 px-4">
        <div className="font-semibold">{coin.symbol.toUpperCase()}</div>
        <div className="text-sm text-gray-400">{coin.name}</div>
      </td>

      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs">
            {coin.baseAsset.slice(0, 2)}
          </div>
          <span>{coin.baseAsset}</span>
        </div>
      </td>

      <td className="py-4 px-4">
        <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-sm">
          {coin.quoteAsset}
        </span>
      </td>

      <td className="text-right py-4 px-4">
        <div className="font-semibold">{formatPrice(coin.price)}</div>
        {coin.lastUpdated && (
          <div className="text-xs text-gray-400">
            {new Date(coin.lastUpdated).toLocaleTimeString()}
          </div>
        )}
      </td>

      <td className="text-right py-4 px-4">
        <div
          className={`font-semibold ${getChangeColor(coin.priceChangePercent)}`}
        >
          {getChangeIcon(coin.priceChangePercent)}{" "}
          {coin.priceChangePercent !== undefined
            ? `${coin.priceChangePercent.toFixed(2)}%`
            : "-"}
        </div>
        {coin.priceChange !== undefined && (
          <div className={`text-xs ${getChangeColor(coin.priceChangePercent)}`}>
            ${Math.abs(coin.priceChange).toFixed(4)}
          </div>
        )}
      </td>

      <td className="text-right py-4 px-4">
        <div className="font-semibold">{formatVolume(coin.volume)}</div>
        <div className="text-xs text-gray-400">{coin.quoteAsset}</div>
      </td>

      <td className="py-4 px-4">
        <span
          className={`px-2 py-1 rounded text-sm ${getStatusColor(coin.status)}`}
        >
          {getStatusText(coin.status)}
        </span>
      </td>

      <td className="text-right py-4 px-4">
        <button
          onClick={onToggleMonitor}
          className={`px-4 py-2 rounded text-sm transition-colors ${
            isMonitored
              ? "bg-red-600 hover:bg-red-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isMonitored ? "Remove" : "Add"}
        </button>
      </td>
    </tr>
  );
}
