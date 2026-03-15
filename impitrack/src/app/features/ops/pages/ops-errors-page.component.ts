import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { Message } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner/loading-spinner.component';
import { OpsErrorsFacade } from '../application/ops-errors.facade';
import { OpsErrorGroupBy } from '../models/ops.model';

interface GroupOption {
  readonly label: string;
  readonly value: OpsErrorGroupBy;
}

interface LimitOption {
  readonly label: string;
  readonly value: number;
}

@Component({
  selector: 'app-ops-errors-page',
  imports: [
    ButtonDirective,
    Card,
    LoadingSpinnerComponent,
    Message,
    ReactiveFormsModule,
    RouterLink,
    SelectModule,
    TableModule,
  ],
  templateUrl: './ops-errors-page.component.html',
  styleUrl: './ops-errors-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpsErrorsPageComponent {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly facade = inject(OpsErrorsFacade);
  private readonly summaryFormatter = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  protected readonly groups = computed(() => [...this.facade.groups()]);
  protected readonly pendingInitialLoad = this.facade.pendingInitialLoad;
  protected readonly featureError = this.facade.errorMessage;
  protected readonly hasGroups = this.facade.hasGroups;
  protected readonly form = this.formBuilder.group({
    from: [this.toDateTimeInputValue(this.subtractHours(1))],
    to: [this.toDateTimeInputValue(new Date())],
    groupBy: ['errorCode' as OpsErrorGroupBy],
    limit: [20],
  });
  protected readonly groupOptions: GroupOption[] = [
    { label: 'Error de parseo', value: 'errorCode' },
    { label: 'Protocolo', value: 'protocol' },
    { label: 'Puerto', value: 'port' },
  ];
  protected readonly limitOptions: LimitOption[] = [
    { label: '10 grupos', value: 10 },
    { label: '20 grupos', value: 20 },
    { label: '50 grupos', value: 50 },
  ];
  protected readonly summary = computed(
    () =>
      `Ventana: ${this.formatSummaryDate(this.form.controls.from.getRawValue())} a ${this.formatSummaryDate(this.form.controls.to.getRawValue())}`,
  );

  constructor() {
    void this.submitFilters();
  }

  protected async submitFilters(): Promise<void> {
    await this.facade.load({
      from: new Date(this.form.controls.from.getRawValue()).toISOString(),
      to: new Date(this.form.controls.to.getRawValue()).toISOString(),
      groupBy: this.form.controls.groupBy.getRawValue(),
      limit: this.form.controls.limit.getRawValue(),
    });
  }

  protected async resetWindow(): Promise<void> {
    this.form.reset({
      from: this.toDateTimeInputValue(this.subtractHours(1)),
      to: this.toDateTimeInputValue(new Date()),
      groupBy: 'errorCode',
      limit: 20,
    });
    await this.submitFilters();
  }

  private subtractHours(hours: number): Date {
    const now = new Date();
    now.setHours(now.getHours() - hours);
    return now;
  }

  private toDateTimeInputValue(date: Date): string {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60_000);
    return local.toISOString().slice(0, 16);
  }

  private formatSummaryDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return this.summaryFormatter.format(date);
  }
}
