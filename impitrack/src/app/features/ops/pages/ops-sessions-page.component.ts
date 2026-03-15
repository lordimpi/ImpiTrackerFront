import { DatePipe, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner/loading-spinner.component';
import { OpsSessionsFacade } from '../application/ops-sessions.facade';

@Component({
  selector: 'app-ops-sessions-page',
  imports: [
    ButtonDirective,
    Card,
    DatePipe,
    InputText,
    LoadingSpinnerComponent,
    Message,
    ReactiveFormsModule,
    TableModule,
    Tag,
  ],
  templateUrl: './ops-sessions-page.component.html',
  styleUrl: './ops-sessions-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpsSessionsPageComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly platformId = inject(PLATFORM_ID);
  private readonly facade = inject(OpsSessionsFacade);

  private pollingHandle: ReturnType<typeof setInterval> | null = null;

  protected readonly sessions = computed(() => [...this.facade.sessions()]);
  protected readonly pendingInitialLoad = this.facade.pendingInitialLoad;
  protected readonly refreshing = this.facade.refreshing;
  protected readonly featureError = this.facade.errorMessage;
  protected readonly hasSessions = this.facade.hasSessions;
  protected readonly form = this.formBuilder.group({
    port: [''],
  });

  async ngOnInit(): Promise<void> {
    await this.load();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  protected async submitFilters(): Promise<void> {
    await this.load();
  }

  protected async clearFilters(): Promise<void> {
    this.form.reset({
      port: '',
    });
    await this.load();
  }

  private async load(background = false): Promise<void> {
    await this.facade.load(
      {
        port: this.normalizeOptionalNumber(this.form.controls.port.getRawValue()),
      },
      background,
    );
  }

  private startPolling(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.pollingHandle = globalThis.setInterval(() => {
      void this.load(true);
    }, 10_000);
  }

  private stopPolling(): void {
    if (this.pollingHandle) {
      globalThis.clearInterval(this.pollingHandle);
      this.pollingHandle = null;
    }
  }

  private normalizeOptionalNumber(value: string): number | undefined {
    const trimmed = value.trim();
    return trimmed.length > 0 ? Number(trimmed) : undefined;
  }
}
