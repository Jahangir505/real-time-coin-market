// app/store/slices/priceSlice.ts
import { PriceData } from '@/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PriceState {
    data: Record<string, PriceData>;
    lastUpdated: number | null;
    isConnected: boolean;
    error: string | null;
}

const initialState: PriceState = {
    data: {},
    lastUpdated: null,
    isConnected: false,
    error: null,
};

const priceSlice = createSlice({
    name: 'prices',
    initialState,
    reducers: {
        updatePrice: (state, action: PayloadAction<{ symbol: string; price: number }>) => {
            const { symbol, price } = action.payload;
            const previousData = state.data[symbol];
            const previousPrice = previousData?.price;
            const changePercent = previousPrice
                ? ((price - previousPrice) / previousPrice) * 100
                : 0;

            state.data[symbol] = {
                symbol,
                price,
                timestamp: Date.now(),
                changePercent,
                previousPrice,
            };
            state.lastUpdated = Date.now();
        },

        updateMultiplePrices: (state, action: PayloadAction<Array<{ symbol: string; price: number }>>) => {
            action.payload.forEach(({ symbol, price }) => {
                const previousData = state.data[symbol];
                const previousPrice = previousData?.price;
                const changePercent = previousPrice
                    ? ((price - previousPrice) / previousPrice) * 100
                    : 0;

                state.data[symbol] = {
                    symbol,
                    price,
                    timestamp: Date.now(),
                    changePercent,
                    previousPrice,
                };
            });
            state.lastUpdated = Date.now();
        },

        setConnectionStatus: (state, action: PayloadAction<boolean>) => {
            state.isConnected = action.payload;
            if (action.payload) {
                state.error = null;
            }
        },

        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },

        clearPrices: (state) => {
            state.data = {};
            state.lastUpdated = null;
        },
    },
});

export const {
    updatePrice,
    updateMultiplePrices,
    setConnectionStatus,
    setError,
    clearPrices
} = priceSlice.actions;

export const selectAllPrices = (state: { prices: PriceState }) => state.prices.data;
export const selectPrice = (symbol: string) => (state: { prices: PriceState }) =>
    state.prices.data[symbol];
export const selectConnectionStatus = (state: { prices: PriceState }) =>
    state.prices.isConnected;
export const selectLastUpdated = (state: { prices: PriceState }) =>
    state.prices.lastUpdated;

export default priceSlice.reducer;