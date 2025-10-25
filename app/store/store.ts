// app/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import coinReducer from './slices/coinSlice';
import notificationReducer from './slices/notificationSlice';
import priceReducer from './slices/priceSlice';

export const makeStore = () => {
    return configureStore({
        reducer: {
            prices: priceReducer,
            notifications: notificationReducer,
            coins: coinReducer, // Make sure this matches the selector
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {
                    ignoredActions: [
                        'prices/updatePrice',
                        'notifications/addNotification',
                        'coins/fetchCoinInfo/fulfilled'
                    ],
                    ignoredPaths: [
                        'prices.data',
                        'notifications.list',
                        'coins.coins'
                    ],
                },
            }),
    });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];