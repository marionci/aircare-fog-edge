import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { WebsocketService, SensorReading } from '../../services/websocket';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private subs = new Subscription();

  status       = 'connecting...';
  lastUpdate   = '';
  readings: SensorReading[] = [];
  latest: SensorReading | null = null;

  readonly thresholds: Record<string, { value: number; unit: string }> = {
  temperature_c: { value: 30.0, unit: '°C' },
  humidity_pct:  { value: 80.0, unit: '%' },
  co2_ppm:       { value: 1000, unit: 'ppm' },
  pm25_ugm3:     { value: 35.0, unit: 'µg/m³' }
};

  constructor(private ws: WebsocketService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.ws.connect();

    this.subs.add(
      this.ws.onStatus().subscribe(s => {
        this.status = s;
        this.cdr.detectChanges();
      })
    );

    this.subs.add(
      this.ws.onMessage().subscribe(reading => {
        this.latest     = reading;
        this.lastUpdate = new Date().toLocaleTimeString();
        this.readings.unshift(reading);
        if (this.readings.length > 20) this.readings.pop();
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.ws.disconnect();
  }

  getStatusClass(): string {
    return ({
      'connected':     'status-ok',
      'disconnected':  'status-error',
      'error':         'status-error',
      'connecting...': 'status-warn'
    } as Record<string, string>)[this.status] ?? 'status-warn';
  }

  isAlert(sensor: keyof SensorReading['alerts']): boolean {
    return this.latest?.alerts?.[sensor] ?? false;
  }

  getSensorValue(sensor: keyof SensorReading['sensors'], stat: 'avg'|'min'|'max'): number {
    return this.latest?.sensors?.[sensor]?.[stat] ?? 0;
  }
}