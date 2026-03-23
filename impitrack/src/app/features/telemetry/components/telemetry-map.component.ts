import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
  inject,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TelemetryMapMarker } from '../models/telemetry.model';

type LeafletModule = typeof import('leaflet');
type LeafletMap = import('leaflet').Map;
type LeafletLayerGroup = import('leaflet').LayerGroup;

@Component({
  selector: 'app-telemetry-map',
  templateUrl: './telemetry-map.component.html',
  styleUrl: './telemetry-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelemetryMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly markers = input<readonly TelemetryMapMarker[]>([]);
  readonly pathPoints = input<readonly TelemetryMapMarker[]>([]);
  readonly activeImei = input<string | null>(null);
  readonly followPosition = input(false);
  readonly emptyLabel = input('Todavia no hay posiciones para mostrar.');

  @ViewChild('mapHost')
  private set mapHostRef(value: ElementRef<HTMLDivElement> | undefined) {
    this.mapHost = value;
    void this.ensureMap().then(() => this.syncMap());
  }

  private mapHost?: ElementRef<HTMLDivElement>;

  private leaflet?: LeafletModule;
  private map?: LeafletMap;
  private markerLayer?: LeafletLayerGroup;
  private mapInitPromise?: Promise<void>;
  private viewInitialized = false;
  private hasFittedBounds = false;
  private lastPathPointsLength = 0;

  protected get hasMapData(): boolean {
    return this.markers().length > 0 || this.pathPoints().length > 0;
  }

  async ngAfterViewInit(): Promise<void> {
    this.viewInitialized = true;
    await this.ensureMap();
    this.syncMap();
  }

  async ngOnChanges(_changes: SimpleChanges): Promise<void> {
    if (!this.viewInitialized) {
      return;
    }

    await this.ensureMap();
    this.syncMap();
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = undefined;
    this.markerLayer = undefined;
    this.mapInitPromise = undefined;
    this.hasFittedBounds = false;

    const hostElement = this.mapHost?.nativeElement as
      | (HTMLDivElement & { _leaflet_id?: number })
      | undefined;
    if (hostElement && '_leaflet_id' in hostElement) {
      delete hostElement._leaflet_id;
    }
  }

  private async ensureMap(): Promise<void> {
    if (!this.isBrowser || this.map || !this.mapHost) {
      return;
    }

    if (this.mapInitPromise) {
      await this.mapInitPromise;
      return;
    }

    this.mapInitPromise = this.createMap();
    try {
      await this.mapInitPromise;
    } finally {
      this.mapInitPromise = undefined;
    }
  }

  private async createMap(): Promise<void> {
    if (!this.mapHost) {
      return;
    }

    this.leaflet ??= (await import('leaflet/dist/leaflet-src.esm.js')) as LeafletModule;

    const hostElement = this.mapHost.nativeElement as HTMLDivElement & { _leaflet_id?: number };
    if ('_leaflet_id' in hostElement) {
      delete hostElement._leaflet_id;
    }

    this.map = this.leaflet.map(hostElement, {
      zoomControl: true,
      attributionControl: true,
    });

    this.leaflet
      .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      })
      .addTo(this.map);

    this.markerLayer = this.leaflet.layerGroup().addTo(this.map);
  }

  private syncMap(): void {
    if (!this.map || !this.leaflet || !this.markerLayer) {
      return;
    }

    this.markerLayer.clearLayers();

    const boundsPoints: Array<[number, number]> = [];
    const pathPoints = this.pathPoints();

    // Reset bounds cuando cambian los pathPoints (nuevo trip seleccionado)
    if (pathPoints.length !== this.lastPathPointsLength) {
      this.lastPathPointsLength = pathPoints.length;
      if (pathPoints.length > 0) {
        this.hasFittedBounds = false;
      }
    }

    // Dibujar recorrido — siempre amarillo con borde negro
    if (pathPoints.length > 1) {
      const coords = pathPoints.map(
        (point) => [point.latitude, point.longitude] as [number, number],
      );

      // Borde negro
      this.leaflet
        .polyline(coords, {
          color: '#1a1a1a',
          weight: 7,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        })
        .addTo(this.markerLayer);

      // Línea amarilla encima
      this.leaflet
        .polyline(coords, {
          color: '#f5c842',
          weight: 4,
          opacity: 1,
          lineCap: 'round',
          lineJoin: 'round',
        })
        .addTo(this.markerLayer);

      // Marcador A (inicio) — verde
      const startIcon = this.leaflet.divIcon({
        className: 'telemetry-map__ab-icon-shell',
        html: '<span class="telemetry-map__ab-icon telemetry-map__ab-icon--start">A</span>',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
      });
      this.leaflet
        .marker(coords[0], { icon: startIcon })
        .bindPopup('Inicio del recorrido')
        .addTo(this.markerLayer);

      // Marcador B (final) — naranja
      const endIcon = this.leaflet.divIcon({
        className: 'telemetry-map__ab-icon-shell',
        html: '<span class="telemetry-map__ab-icon telemetry-map__ab-icon--end">B</span>',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
      });
      this.leaflet
        .marker(coords[coords.length - 1], { icon: endIcon })
        .bindPopup('Fin del recorrido')
        .addTo(this.markerLayer);

      boundsPoints.push(...coords);
    }

    // Dibujar marcadores de dispositivos
    for (const marker of this.markers()) {
      const isActive = marker.imei === this.activeImei();
      const vehicleIcon = this.leaflet.divIcon({
        className: 'telemetry-map__vehicle-icon-shell',
        html: `<span class="telemetry-map__vehicle-icon${isActive ? ' telemetry-map__vehicle-icon--active' : ''}"><i class="pi pi-car"></i></span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -12],
      });
      const vehicleMarker = this.leaflet.marker([marker.latitude, marker.longitude], {
        icon: vehicleIcon,
      });

      vehicleMarker.bindPopup(
        `<strong>${marker.imei}</strong><br/>Ultimo visto: ${marker.lastSeenAtUtc ?? 'Sin dato'}`,
      );
      vehicleMarker.addTo(this.markerLayer);
      boundsPoints.push([marker.latitude, marker.longitude]);
    }

    // Ajustar viewport
    if (!this.hasFittedBounds && boundsPoints.length > 0) {
      this.hasFittedBounds = true;

      if (boundsPoints.length === 1) {
        this.map.setView(boundsPoints[0], 14);
      } else {
        this.map.fitBounds(boundsPoints, { padding: [24, 24] });
      }
    } else if (!this.hasFittedBounds && boundsPoints.length === 0) {
      this.map.setView([4.5709, -74.2973], 6);
    } else if (this.followPosition() && boundsPoints.length > 0) {
      const lastPoint = boundsPoints[boundsPoints.length - 1];
      this.map.panTo(lastPoint, { animate: true, duration: 0.5 });
    }
  }
}
