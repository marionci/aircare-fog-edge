import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface SensorReading {
  device_id:    string;
  timestamp:    string;
  window_sec:   number;
  sample_count: number;
  any_alert:    boolean;
  sensors: {
    temperature_c: { avg: number; min: number; max: number };
    humidity_pct:  { avg: number; min: number; max: number };
    co2_ppm:       { avg: number; min: number; max: number };
    pm25_ugm3:     { avg: number; min: number; max: number };
  };
  alerts: {
    temperature_c: boolean;
    humidity_pct:  boolean;
    co2_ppm:       boolean;
    pm25_ugm3:     boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private socket!: WebSocket;
  private messageSubject = new Subject<SensorReading>();
  private statusSubject  = new Subject<string>();

  private readonly WS_URL =
    'wss://okho1mizvi.execute-api.eu-west-1.amazonaws.com/production';

  connect(): void {
    this.socket = new WebSocket(this.WS_URL);

    this.socket.onopen = () => {
      console.log('[WS] Connected');
      this.statusSubject.next('connected');
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'sensor_update') {
        this.messageSubject.next(data.payload as SensorReading);
      }
    };

    this.socket.onclose = () => {
      console.log('[WS] Disconnected — reconnecting in 5s');
      this.statusSubject.next('disconnected');
      setTimeout(() => this.connect(), 5000);
    };

    this.socket.onerror = (err) => {
      console.error('[WS] Error', err);
      this.statusSubject.next('error');
    };
  }

  disconnect(): void {
    this.socket?.close();
  }

  onMessage(): Observable<SensorReading> {
    this.socket.onmessage = (event) => {
  console.log('[WS] Message received:', event.data);  // añade esta línea
  const data = JSON.parse(event.data);
  if (data.type === 'sensor_update') {
    this.messageSubject.next(data.payload as SensorReading);
  }
};
    return this.messageSubject.asObservable();
  }

  onStatus(): Observable<string> {
    return this.statusSubject.asObservable();
  }
}