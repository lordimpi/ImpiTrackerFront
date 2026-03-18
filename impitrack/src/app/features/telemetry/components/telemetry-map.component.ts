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
    if (pathPoints.length > 1) {
      const segments = this.segmentByIgnition(pathPoints);
      for (const segment of segments) {
        this.leaflet
          .polyline(segment.coords, {
            color: segment.color,
            weight: 4,
            opacity: 0.8,
          })
          .addTo(this.markerLayer);
      }
      boundsPoints.push(
        ...pathPoints.map((point) => [point.latitude, point.longitude] as [number, number]),
      );
    }

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

    if (boundsPoints.length === 0) {
      this.map.setView([4.5709, -74.2973], 6);
      return;
    }

    if (boundsPoints.length === 1) {
      this.map.setView(boundsPoints[0], 14);
      return;
    }

    this.map.fitBounds(boundsPoints, {
      padding: [24, 24],
    });
  }

  private segmentByIgnition(
    points: readonly TelemetryMapMarker[],
  ): Array<{ coords: [number, number][]; color: string }> {
    if (points.length < 2) {
      return [];
    }

    const segments: Array<{ coords: [number, number][]; color: string }> = [];
    const colorFor = (ignitionOn: boolean | undefined): string =>
      ignitionOn === true ? '#77c9de' : '#aaaaaa';

    let currentColor = colorFor(points[0].ignitionOn);
    let currentCoords: [number, number][] = [[points[0].latitude, points[0].longitude]];

    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      const pointColor = colorFor(point.ignitionOn);
      const coord: [number, number] = [point.latitude, point.longitude];

      if (pointColor !== currentColor) {
        currentCoords.push(coord);
        segments.push({ coords: currentCoords, color: currentColor });
        currentCoords = [coord];
        currentColor = pointColor;
      } else {
        currentCoords.push(coord);
      }
    }

    if (currentCoords.length >= 2) {
      segments.push({ coords: currentCoords, color: currentColor });
    }

    return segments;
  }
}
