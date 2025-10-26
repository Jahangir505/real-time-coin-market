// app/store/slices/coinSlice.ts
import { BinanceExchangeInfo, BinanceSymbol, BinanceTicker, CoinInfo, TargetPrice } from '@/types';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CoinState {
    allCoins: Record<string, CoinInfo>;
    filteredCoins: string[];
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
    searchTerm: string;
    filterStatus: 'all' | 'trading' | 'halted';
    filterQuoteAsset: string;
    pricesLoading: boolean;
}

const initialState: CoinState = {
    allCoins: {},
    filteredCoins: [],
    loading: false,
    error: null,
    lastFetched: null,
    searchTerm: '',
    filterStatus: 'all',
    filterQuoteAsset: 'all',
    pricesLoading: false,
};

// Async thunk to fetch all coins from Binance
export const fetchAllCoins = createAsyncThunk(
    'coins/fetchAllCoins',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('https://api.binance.com/api/v3/exchangeInfo');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: BinanceExchangeInfo = await response.json();

            const coinInfoMap: Record<string, CoinInfo> = {};

            data.symbols.forEach((symbolInfo: BinanceSymbol) => {
                // Only include USDT pairs for simplicity
                if (symbolInfo.quoteAsset === 'USDT' && symbolInfo.status === 'TRADING') {
                    coinInfoMap[symbolInfo.symbol.toLowerCase()] = {
                        symbol: symbolInfo.symbol.toLowerCase(),
                        name: `${symbolInfo.baseAsset}/${symbolInfo.quoteAsset}`,
                        baseAsset: symbolInfo.baseAsset,
                        quoteAsset: symbolInfo.quoteAsset,
                        status: symbolInfo.status,
                        baseAssetPrecision: symbolInfo.baseAssetPrecision,
                        quotePrecision: symbolInfo.quotePrecision,
                        filters: symbolInfo.filters,
                        permissions: symbolInfo.permissions,
                        targets: [],
                    };
                }
            });

            return coinInfoMap;
        } catch (error) {
            console.error('Error fetching coins:', error);
            return rejectWithValue('Failed to fetch coins from Binance');
        }
    }
);

// Async thunk to fetch 24hr ticker data for all coins
export const fetchAllCoinPrices = createAsyncThunk(
    'coins/fetchAllCoinPrices',
    async (_, { rejectWithValue, getState }) => {
        try {
            const state = getState() as { coins: CoinState };
            const symbols = Object.keys(state.coins.allCoins);

            if (symbols.length === 0) {
                return {};
            }

            // Binance API has a limit, so we'll fetch all at once (they support up to 1000 symbols)
            const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const tickers: BinanceTicker[] = await response.json();

            // Create a map of price updates
            const priceUpdates: Record<string, Partial<CoinInfo>> = {};

            tickers.forEach((ticker: BinanceTicker) => {
                const symbol = ticker.symbol.toLowerCase();
                if (state.coins.allCoins[symbol]) {
                    priceUpdates[symbol] = {
                        price: parseFloat(ticker.lastPrice),
                        priceChangePercent: parseFloat(ticker.priceChangePercent),
                        priceChange: parseFloat(ticker.priceChange),
                        volume: parseFloat(ticker.volume),
                        lastUpdated: Date.now(),
                    };
                }
            });

            return priceUpdates;
        } catch (error) {
            console.error('Error fetching coin prices:', error);
            return rejectWithValue('Failed to fetch coin prices');
        }
    }
);

// Async thunk to fetch prices for specific symbols
export const fetchCoinPrices = createAsyncThunk(
    'coins/fetchCoinPrices',
    async (symbols: string[], { rejectWithValue }) => {
        try {
            if (symbols.length === 0) return {};

            const symbolParams = symbols.map(sym => `"${sym.toUpperCase()}"`).join(',');
            const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbolParams}]`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const tickers: BinanceTicker[] = await response.json();
            const priceUpdates: Record<string, Partial<CoinInfo>> = {};

            tickers.forEach((ticker: BinanceTicker) => {
                const symbol = ticker.symbol.toLowerCase();
                priceUpdates[symbol] = {
                    price: parseFloat(ticker.lastPrice),
                    priceChangePercent: parseFloat(ticker.priceChangePercent),
                    priceChange: parseFloat(ticker.priceChange),
                    volume: parseFloat(ticker.volume),
                    lastUpdated: Date.now(),
                };
            });

            return priceUpdates;
        } catch (error) {
            console.error('Error fetching coin prices:', error);
            return rejectWithValue('Failed to fetch coin prices');
        }
    }
);

const coinSlice = createSlice({
    name: 'coins',
    initialState,
    reducers: {
        setSearchTerm: (state, action: PayloadAction<string>) => {
            state.searchTerm = action.payload.toLowerCase();
            state.filteredCoins = filterCoins(state.allCoins, state.searchTerm, state.filterStatus, state.filterQuoteAsset);
        },

        setFilterStatus: (state, action: PayloadAction<'all' | 'trading' | 'halted'>) => {
            state.filterStatus = action.payload;
            state.filteredCoins = filterCoins(state.allCoins, state.searchTerm, action.payload, state.filterQuoteAsset);
        },

        setFilterQuoteAsset: (state, action: PayloadAction<string>) => {
            state.filterQuoteAsset = action.payload;
            state.filteredCoins = filterCoins(state.allCoins, state.searchTerm, state.filterStatus, action.payload);
        },

        updateCoinPrice: (state, action: PayloadAction<{ symbol: string; price: number; changePercent: number }>) => {
            const { symbol, price, changePercent } = action.payload;
            if (state.allCoins[symbol]) {
                state.allCoins[symbol].price = price;
                state.allCoins[symbol].priceChangePercent = changePercent;
                state.allCoins[symbol].lastUpdated = Date.now();
            }
        },

        addCoin: (state, action: PayloadAction<{ symbol: string; name: string }>) => {
            const { symbol, name } = action.payload;
            if (!state.allCoins[symbol]) {
                state.allCoins[symbol] = {
                    symbol,
                    name,
                    baseAsset: symbol.replace('usdt', ''),
                    quoteAsset: 'USDT',
                    status: 'TRADING',
                    baseAssetPrecision: 8,
                    quotePrecision: 8,
                    filters: [],
                    permissions: ['SPOT'],
                    targets: [],
                };
            }
        },

        addTarget: (state, action: PayloadAction<{
            symbol: string;
            target: Omit<TargetPrice, 'id' | 'createdAt'>;
        }>) => {
            const { symbol, target } = action.payload;
            const coin = state.allCoins[symbol];

            if (coin) {
                const newTarget: TargetPrice = {
                    ...target,
                    id: Date.now().toString(),
                    createdAt: Date.now(),
                };
                coin.targets.push(newTarget);
            }
        },

        // ... other target actions remain the same
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllCoins.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllCoins.fulfilled, (state, action) => {
                state.loading = false;
                state.allCoins = action.payload;
                state.filteredCoins = Object.keys(action.payload);
                state.lastFetched = Date.now();
            })
            .addCase(fetchAllCoins.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchAllCoinPrices.pending, (state) => {
                state.pricesLoading = true;
            })
            .addCase(fetchAllCoinPrices.fulfilled, (state, action) => {
                state.pricesLoading = false;
                // Update coins with price data
                Object.keys(action.payload).forEach(symbol => {
                    if (state.allCoins[symbol]) {
                        Object.assign(state.allCoins[symbol], action.payload[symbol]);
                    }
                });
            })
            .addCase(fetchAllCoinPrices.rejected, (state, action) => {
                state.pricesLoading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchCoinPrices.pending, (state) => {
                state.pricesLoading = true;
            })
            .addCase(fetchCoinPrices.fulfilled, (state, action) => {
                state.pricesLoading = false;
                // Update coins with price data
                Object.keys(action.payload).forEach(symbol => {
                    if (state.allCoins[symbol]) {
                        Object.assign(state.allCoins[symbol], action.payload[symbol]);
                    }
                });
            })
            .addCase(fetchCoinPrices.rejected, (state, action) => {
                state.pricesLoading = false;
                state.error = action.payload as string;
            });
    },
});

// Helper function to filter coins (same as before)
function filterCoins(
    coins: Record<string, CoinInfo>,
    searchTerm: string,
    status: string,
    quoteAsset: string
): string[] {
    return Object.keys(coins).filter(symbol => {
        const coin = coins[symbol];
        const matchesSearch = searchTerm === '' ||
            symbol.includes(searchTerm) ||
            coin.name.toLowerCase().includes(searchTerm) ||
            coin.baseAsset.toLowerCase().includes(searchTerm);

        const matchesStatus = status === 'all' ||
            (status === 'trading' && coin.status === 'TRADING') ||
            (status === 'halted' && coin.status !== 'TRADING');

        const matchesQuoteAsset = quoteAsset === 'all' || coin.quoteAsset === quoteAsset;

        return matchesSearch && matchesStatus && matchesQuoteAsset;
    });
}

export const {
    setSearchTerm,
    setFilterStatus,
    setFilterQuoteAsset,
    updateCoinPrice,
    addCoin,
    addTarget,
    // ... other exports
} = coinSlice.actions;

export const selectAllCoins = (state: { coins: CoinState }) => state.coins.allCoins;
export const selectFilteredCoins = (state: { coins: CoinState }) => state.coins.filteredCoins;
export const selectCoin = (symbol: string) => (state: { coins: CoinState }) =>
    state.coins.allCoins[symbol];
export const selectCoinLoading = (state: { coins: CoinState }) =>
    state.coins.loading;
export const selectPricesLoading = (state: { coins: CoinState }) =>
    state.coins.pricesLoading;
export const selectCoinError = (state: { coins: CoinState }) =>
    state.coins.error;
export const selectCoins = (state: { coins: CoinState }) => state.coins.allCoins;
export const selectCoinStats = (state: { coins: CoinState }) => ({
    total: Object.keys(state.coins.allCoins).length,
    filtered: state.coins.filteredCoins.length,
    lastFetched: state.coins.lastFetched,
    withPrices: Object.values(state.coins.allCoins).filter(coin => coin.price !== undefined).length,
});

export default coinSlice.reducer;