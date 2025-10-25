// app/store/slices/coinSlice.ts
import { BinanceCoinInfo, CoinInfo, TargetPrice } from '@/types';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CoinState {
    coins: Record<string, CoinInfo>;
    loading: boolean;
    error: string | null;
}

const initialState: CoinState = {
    coins: {},
    loading: false,
    error: null,
};

// Async thunk to fetch coin information from Binance
export const fetchCoinInfo = createAsyncThunk(
    'coins/fetchCoinInfo',
    async (symbols: string[]) => {
        const response = await fetch('https://api.binance.com/api/v3/exchangeInfo');
        const data = await response.json();

        const coinInfoMap: Record<string, CoinInfo> = {};

        data.symbols.forEach((symbolInfo: BinanceCoinInfo) => {
            const symbol = symbolInfo.symbol.toLowerCase();
            if (symbols.includes(symbol)) {
                coinInfoMap[symbol] = {
                    symbol,
                    name: `${symbolInfo.baseAsset}/${symbolInfo.quoteAsset}`,
                    targets: [],
                };
            }
        });

        return coinInfoMap;
    }
);

const coinSlice = createSlice({
    name: 'coins',
    initialState,
    reducers: {
        addCoin: (state, action: PayloadAction<{ symbol: string; name: string }>) => {
            const { symbol, name } = action.payload;
            if (!state.coins[symbol]) {
                state.coins[symbol] = {
                    symbol,
                    name,
                    targets: [],
                };
            }
        },

        addTarget: (state, action: PayloadAction<{
            symbol: string;
            target: Omit<TargetPrice, 'id' | 'createdAt'>;
        }>) => {
            const { symbol, target } = action.payload;
            const coin = state.coins[symbol];

            if (coin) {
                const newTarget: TargetPrice = {
                    ...target,
                    id: Date.now().toString(),
                    createdAt: Date.now(),
                };
                coin.targets.push(newTarget);
            }
        },

        updateTarget: (state, action: PayloadAction<{
            symbol: string;
            targetId: string;
            updates: Partial<TargetPrice>;
        }>) => {
            const { symbol, targetId, updates } = action.payload;
            const coin = state.coins[symbol];

            if (coin) {
                const target = coin.targets.find(t => t.id === targetId);
                if (target) {
                    Object.assign(target, updates);
                }
            }
        },

        removeTarget: (state, action: PayloadAction<{
            symbol: string;
            targetId: string;
        }>) => {
            const { symbol, targetId } = action.payload;
            const coin = state.coins[symbol];

            if (coin) {
                coin.targets = coin.targets.filter(t => t.id !== targetId);
            }
        },

        toggleTarget: (state, action: PayloadAction<{
            symbol: string;
            targetId: string;
        }>) => {
            const { symbol, targetId } = action.payload;
            const coin = state.coins[symbol];

            if (coin) {
                const target = coin.targets.find(t => t.id === targetId);
                if (target) {
                    target.active = !target.active;
                }
            }
        },

        setCoinName: (state, action: PayloadAction<{
            symbol: string;
            name: string;
        }>) => {
            const { symbol, name } = action.payload;
            if (state.coins[symbol]) {
                state.coins[symbol].name = name;
            } else {
                state.coins[symbol] = {
                    symbol,
                    name,
                    targets: [],
                };
            }
        },

        removeCoin: (state, action: PayloadAction<string>) => {
            delete state.coins[action.payload];
        },

        clearCoins: (state) => {
            state.coins = {};
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCoinInfo.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCoinInfo.fulfilled, (state, action) => {
                state.loading = false;
                state.coins = { ...state.coins, ...action.payload };
            })
            .addCase(fetchCoinInfo.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch coin info';
            });
    },
});

export const {
    addCoin,
    addTarget,
    updateTarget,
    removeTarget,
    toggleTarget,
    setCoinName,
    removeCoin,
    clearCoins,
} = coinSlice.actions;

export const selectCoins = (state: { coins: CoinState }) => state.coins.coins;
export const selectCoin = (symbol: string) => (state: { coins: CoinState }) =>
    state.coins.coins[symbol];
export const selectCoinLoading = (state: { coins: CoinState }) =>
    state.coins.loading;
export const selectCoinError = (state: { coins: CoinState }) =>
    state.coins.error;

export default coinSlice.reducer;