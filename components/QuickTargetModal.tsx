// components/QuickTargetModal.tsx
"use client";
import { useAppDispatch } from "@/app/store/hooks";
import { addTarget } from "@/app/store/slices/coinSlice";
import { useState } from "react";

interface QuickTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  currentPrice: number;
  coinName: string;
}

export default function QuickTargetModal({
  isOpen,
  onClose,
  symbol,
  currentPrice,
  coinName,
}: QuickTargetModalProps) {
  const dispatch = useAppDispatch();
  const [targetType, setTargetType] = useState<"above" | "below">("above");
  const [targetPrice, setTargetPrice] = useState("");
  const [usePercentage, setUsePercentage] = useState(false);
  const [percentage, setPercentage] = useState("5");

  if (!isOpen) return null;

  const calculateTargetPrice = () => {
    if (usePercentage && percentage) {
      const change = (parseFloat(percentage) / 100) * currentPrice;
      return targetType === "above"
        ? currentPrice + change
        : currentPrice - change;
    }
    return parseFloat(targetPrice) || 0;
  };

  const handleAddTarget = () => {
    const finalTargetPrice = calculateTargetPrice();
    if (finalTargetPrice > 0) {
      dispatch(
        addTarget({
          symbol,
          target: {
            price: finalTargetPrice,
            type: targetType,
            active: true,
          },
        })
      );
      onClose();
    }
  };

  const suggestedTargets = [
    { label: "+2%", value: 2, type: "above" as const },
    { label: "+5%", value: 5, type: "above" as const },
    { label: "+10%", value: 10, type: "above" as const },
    { label: "-2%", value: 2, type: "below" as const },
    { label: "-5%", value: 5, type: "below" as const },
    { label: "-10%", value: 10, type: "below" as const },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          Set Target for {symbol.toUpperCase()}
        </h2>

        <div className="mb-4">
          <div className="text-sm text-gray-400">Current Price</div>
          <div className="text-lg font-semibold">
            ${currentPrice.toFixed(4)}
          </div>
          <div className="text-sm text-gray-400">{coinName}</div>
        </div>

        {/* Target Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Alert When Price Is:
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setTargetType("above")}
              className={`flex-1 py-2 rounded transition-colors ${
                targetType === "above"
                  ? "bg-green-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Above Target
            </button>
            <button
              onClick={() => setTargetType("below")}
              className={`flex-1 py-2 rounded transition-colors ${
                targetType === "below"
                  ? "bg-red-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Below Target
            </button>
          </div>
        </div>

        {/* Input Method */}
        <div className="mb-4">
          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={usePercentage}
              onChange={(e) => setUsePercentage(e.target.checked)}
              className="rounded bg-gray-700 border-gray-600 text-blue-600"
            />
            <span>Set target by percentage</span>
          </label>

          {usePercentage ? (
            <div className="flex gap-2">
              <input
                type="number"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="Percentage"
                step="0.1"
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
              <span className="px-3 py-2 bg-gray-600 rounded">%</span>
            </div>
          ) : (
            <input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="Target price"
              step="0.0001"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          )}
        </div>

        {/* Calculated Price */}
        {usePercentage && percentage && (
          <div className="mb-4 p-3 bg-gray-700 rounded">
            <div className="text-sm text-gray-400">Target Price:</div>
            <div className="font-semibold">
              ${calculateTargetPrice().toFixed(4)}
            </div>
          </div>
        )}

        {/* Quick Suggestions */}
        <div className="mb-6">
          <div className="text-sm font-medium mb-2">Quick Targets:</div>
          <div className="grid grid-cols-3 gap-2">
            {suggestedTargets.map((suggestion) => (
              <button
                key={`${suggestion.type}-${suggestion.value}`}
                onClick={() => {
                  setTargetType(suggestion.type);
                  setUsePercentage(true);
                  setPercentage(suggestion.value.toString());
                }}
                className={`p-2 rounded text-sm transition-colors ${
                  suggestion.type === "above"
                    ? "bg-green-600/20 hover:bg-green-600/30 text-green-400"
                    : "bg-red-600/20 hover:bg-red-600/30 text-red-400"
                }`}
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddTarget}
            disabled={!targetPrice && !usePercentage}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors"
          >
            Set Target
          </button>
        </div>
      </div>
    </div>
  );
}
