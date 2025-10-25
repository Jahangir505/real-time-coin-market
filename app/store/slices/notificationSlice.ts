// app/store/slices/notificationSlice.ts
import { NotificationSettings, NotificationType } from '@/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NotificationState {
    list: NotificationType[];
    settings: NotificationSettings;
}

const initialSettings: NotificationSettings = {
    threshold: 2.0,
    enabledSymbols: ['btcusdt', 'ethusdt', 'adausdt', 'degousdt', 'solusdt'],
    notificationMethods: {
        browser: true,
        sound: false,
        email: false,
    },
    soundEnabled: true,
};

const initialState: NotificationState = {
    list: [],
    settings: initialSettings,
};

const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addNotification: (state, action: PayloadAction<Omit<NotificationType, 'id' | 'read'>>) => {
            const newNotification: NotificationType = {
                ...action.payload,
                id: Date.now().toString(),
                read: false,
            };

            state.list.unshift(newNotification);

            // Keep only last 50 notifications
            if (state.list.length > 50) {
                state.list = state.list.slice(0, 50);
            }

            // Trigger browser notification
            if (state.settings.notificationMethods.browser && 'Notification' in window) {
                if (Notification.permission === 'granted') {
                    new Notification(
                        `Price Alert: ${newNotification.symbol.toUpperCase()}`,
                        {
                            body: `${newNotification.changePercent > 0 ? '📈' : '📉'} ${Math.abs(newNotification.changePercent).toFixed(2)}% change`,
                            icon: '/crypto-icon.png',
                            tag: 'binance-alert',
                        }
                    );
                }
            }

            // Play sound if enabled
            if (state.settings.soundEnabled) {
                const audio = new Audio('/notification.mp3');
                audio.play().catch(() => { });
            }
        },

        markAsRead: (state, action: PayloadAction<string>) => {
            const notification = state.list.find(n => n.id === action.payload);
            if (notification) {
                notification.read = true;
            }
        },

        markAllAsRead: (state) => {
            state.list.forEach(notification => {
                notification.read = true;
            });
        },

        clearNotifications: (state) => {
            state.list = [];
        },

        updateSettings: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
            state.settings = { ...state.settings, ...action.payload };
        },

        addSymbol: (state, action: PayloadAction<string>) => {
            const symbol = action.payload.toLowerCase();
            if (!state.settings.enabledSymbols.includes(symbol)) {
                state.settings.enabledSymbols.push(symbol);
            }
        },

        removeSymbol: (state, action: PayloadAction<string>) => {
            state.settings.enabledSymbols = state.settings.enabledSymbols.filter(
                s => s !== action.payload
            );
        },
    },
});

export const {
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    updateSettings,
    addSymbol,
    removeSymbol,
} = notificationSlice.actions;

export const selectNotifications = (state: { notifications: NotificationState }) =>
    state.notifications.list;
export const selectUnreadCount = (state: { notifications: NotificationState }) =>
    state.notifications.list.filter(n => !n.read).length;
export const selectSettings = (state: { notifications: NotificationState }) =>
    state.notifications.settings;

export default notificationSlice.reducer;