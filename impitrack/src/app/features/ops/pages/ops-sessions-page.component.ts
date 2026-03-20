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
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Paginator } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
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
    FormsModule,
    InputText,
    LoadingSpinnerComponent,
    Message,
    Paginator,
    ReactiveFormsModule,
    RouterLink,
    RouterLinkActive,
    SelectModule,
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
  protected readonly query = this.facade.query;
  protected readonly totalItems = this.facade.totalItems;
  protected readonly totalPages = this.facade.totalPages;
  protected readonly pageSizeOptions = [
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
  ];
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
    this.facade.changePage(1, this.query().pageSize);
    await this.load();
  }

  protected async clearFilters(): Promise<void> {
    this.form.reset({ port: '' });
    this.facade.changePage(1, this.query().pageSize);
    await this.load();
  }

  protected changeSessionsPage(event: { page?: number; rows?: number }): void {
    const currentQuery = this.query();
    this.facade.changePage((event.page ?? 0) + 1, event.rows ?? currentQuery.pageSize);
    void this.load();
  }

  protected changePageSize(pageSize: number): void {
    this.facade.changePage(1, pageSize);
    void this.load();
  }

  private async load(background = false): Promise<void> {
    await this.facade.load(
      this.normalizeOptionalNumber(this.form.controls.port.getRawValue()),
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
