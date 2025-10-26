/* eslint-disable @typescript-eslint/no-explicit-any */
// types/index.ts
export interface PriceData {
    symbol: string;
    price: number;
    timestamp: number;
    changePercent?: number;
    previousPrice?: number;
}

export interface NotificationType {
    id: string;
    symbol: string;
    previousPrice: number;
    currentPrice: number;
    changePercent: number;
    timestamp: string;
    read: boolean;
}

export interface NotificationSettings {
    threshold: number;
    enabledSymbols: string[];
    notificationMethods: {
        browser: boolean;
        sound: boolean;
        email: boolean;
    };
    soundEnabled: boolean;
}

export interface AppState {
    prices: Record<string, PriceData>;
    notifications: Notification[];
    settings: NotificationSettings;
    connection: {
        isConnected: boolean;
        lastUpdate: number | null;
        error: string | null;
    };
}

export interface WebSocketMessage {
    stream: string;
    data: {
        e: string; // Event type
        E: number; // Event time
        s: string; // Symbol
        c: string; // Current price
        o: string; // Open price
        h: string; // High price
        l: string; // Low price
        v: string; // Volume
        q: string; // Quote volume
    };
}

export interface CoinInfo {
    symbol: string;
    name: string;
    baseAsset: string;
    quoteAsset: string;
    status: string;
    baseAssetPrecision: number;
    quotePrecision: number;
    filters: any[];
    permissions: string[];
    targets: TargetPrice[];
    price?: number;
    priceChangePercent?: number;
    priceChange?: number;
    volume?: number;
    lastUpdated?: number;
}


export interface TargetPrice {
    id: string;
    price: number;
    type: 'above' | 'below';
    active: boolean;
    createdAt: number;
}

// Binance coin info response
export interface BinanceCoinInfo {
    symbol: string;
    status: string;
    baseAsset: string;
    baseAssetPrecision: number;
    quoteAsset: string;
    quotePrecision: number;
    quoteAssetPrecision: number;
    baseCommissionPrecision: number;
    quoteCommissionPrecision: number;
    orderTypes: string[];
    icebergAllowed: boolean;
    ocoAllowed: boolean;
    quoteOrderQtyMarketAllowed: boolean;
    allowTrailingStop: boolean;
    cancelReplaceAllowed: boolean;
    isSpotTradingAllowed: boolean;
    isMarginTradingAllowed: boolean;
    filters: unknown[];
    permissions: string[];
}

export interface BinanceExchangeInfo {
    timezone: string;
    serverTime: number;
    rateLimits: any[];
    exchangeFilters: any[];
    symbols: BinanceSymbol[];
}

export interface BinanceSymbol {
    symbol: string;
    status: string;
    baseAsset: string;
    baseAssetPrecision: number;
    quoteAsset: string;
    quotePrecision: number;
    quoteAssetPrecision: number;
    baseCommissionPrecision: number;
    quoteCommissionPrecision: number;
    orderTypes: string[];
    icebergAllowed: boolean;
    ocoAllowed: boolean;
    quoteOrderQtyMarketAllowed: boolean;
    allowTrailingStop: boolean;
    cancelReplaceAllowed: boolean;
    isSpotTradingAllowed: boolean;
    isMarginTradingAllowed: boolean;
    filters: unknown[];
    permissions: string[];
}

export interface BinanceTicker {
    symbol: string;
    priceChange: string;
    priceChangePercent: string;
    weightedAvgPrice: string;
    prevClosePrice: string;
    lastPrice: string;
    lastQty: string;
    bidPrice: string;
    askPrice: string;
    openPrice: string;
    highPrice: string;
    lowPrice: string;
    volume: string;
    quoteVolume: string;
    openTime: number;
    closeTime: number;
    firstId: number;
    lastId: number;
    count: number;
}
