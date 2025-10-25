// lib/websocket.ts
import { WebSocketMessage } from '@/types';

export class BinanceWebSocketService {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private onMessageCallback: ((data: WebSocketMessage) => void) | null = null;
    private onStatusChange: ((status: boolean) => void) | null = null;
    private symbols: string[] = [];

    constructor(
        onMessage: (data: WebSocketMessage) => void,
        onStatusChange: (status: boolean) => void
    ) {
        this.onMessageCallback = onMessage;
        this.onStatusChange = onStatusChange;
    }

    connect(symbols: string[]): void {
        this.symbols = symbols;
        this.reconnectAttempts = 0;
        this.internalConnect();
    }

    private internalConnect(): void {
        try {
            if (this.ws) {
                this.ws.close();
            }

            const streams = this.symbols.map(symbol => `${symbol}@ticker`).join('/');
            const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;

            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                this.onStatusChange?.(true);
            };

            this.ws.onmessage = (event: MessageEvent) => {
                try {
                    const data: WebSocketMessage = JSON.parse(event.data);
                    this.onMessageCallback?.(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.ws.onerror = (error: Event) => {
                console.error('WebSocket error:', error);
                this.onStatusChange?.(false);
            };

            this.ws.onclose = (event: CloseEvent) => {
                console.log('WebSocket disconnected:', event.code, event.reason);
                this.onStatusChange?.(false);
                this.handleReconnect();
            };

        } catch (error) {
            console.error('WebSocket connection failed:', error);
            this.handleReconnect();
        }
    }

    private handleReconnect(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * this.reconnectAttempts, 30000);

            console.log(`Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts})`);

            this.reconnectTimeout = setTimeout(() => {
                this.internalConnect();
            }, delay);
        } else {
            console.error('Max reconnection attempts reached');
        }
    }

    disconnect(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    updateSymbols(newSymbols: string[]): void {
        this.symbols = newSymbols;
        this.disconnect();
        this.internalConnect();
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}