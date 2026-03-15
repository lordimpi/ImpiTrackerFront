import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { Message } from 'primeng/message';
import { Tag } from 'primeng/tag';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner/loading-spinner.component';
import { OpsPortsFacade } from '../application/ops-ports.facade';
import { PortIngestionSnapshotDto } from '../models/ops.model';

@Component({
  selector: 'app-ops-ports-page',
  imports: [ButtonDirective, Card, LoadingSpinnerComponent, Message, Tag],
  templateUrl: './ops-ports-page.component.html',
  styleUrl: './ops-ports-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpsPortsPageComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly facade = inject(OpsPortsFacade);

  private pollingHandle: ReturnType<typeof setInterval> | null = null;

  protected readonly ports = this.facade.ports;
  protected readonly pendingInitialLoad = this.facade.pendingInitialLoad;
  protected readonly refreshing = this.facade.refreshing;
  protected readonly featureError = this.facade.errorMessage;
  protected readonly hasPorts = this.facade.hasPorts;

  async ngOnInit(): Promise<void> {
    await this.facade.load();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  protected async refresh(): Promise<void> {
    await this.facade.load();
  }

  protected getBacklogSeverity(port: PortIngestionSnapshotDto): 'success' | 'warn' | 'danger' {
    if (port.backlog >= 100) {
      return 'danger';
    }

    return port.backlog >= 20 ? 'warn' : 'success';
  }

  private startPolling(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.pollingHandle = globalThis.setInterval(() => {
      void this.facade.load(true);
    }, 10_000);
  }

  private stopPolling(): void {
    if (this.pollingHandle) {
      globalThis.clearInterval(this.pollingHandle);
      this.pollingHandle = null;
    }
  }
}
