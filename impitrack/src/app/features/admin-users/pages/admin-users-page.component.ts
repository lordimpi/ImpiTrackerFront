import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner/loading-spinner.component';
import { AdminUsersFacade } from '../application/admin-users.facade';
import { AdminUsersSortDirection, AdminUsersSortField } from '../models/admin-user.model';

interface PageEventLike {
  readonly page?: number;
  readonly rows?: number;
}

interface SortFieldOption {
  readonly label: string;
  readonly value: AdminUsersSortField;
}

interface SortDirectionOption {
  readonly label: string;
  readonly value: AdminUsersSortDirection;
}

@Component({
  selector: 'app-admin-users-page',
  imports: [
    ButtonDirective,
    Card,
    InputText,
    LoadingSpinnerComponent,
    Message,
    PaginatorModule,
    ReactiveFormsModule,
    RouterLink,
    SelectModule,
    TableModule,
    Tag,
  ],
  templateUrl: './admin-users-page.component.html',
  styleUrl: './admin-users-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersPageComponent {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly adminUsersFacade = inject(AdminUsersFacade);

  protected readonly users = computed(() => [...this.adminUsersFacade.users()]);
  protected readonly plans = computed(() => [...this.adminUsersFacade.plans()]);
  protected readonly query = this.adminUsersFacade.query;
  protected readonly totalItems = this.adminUsersFacade.totalItems;
  protected readonly totalPages = this.adminUsersFacade.totalPages;
  protected readonly pendingInitialLoad = this.adminUsersFacade.pendingInitialLoad;
  protected readonly pendingUsers = this.adminUsersFacade.pendingUsers;
  protected readonly featureError = this.adminUsersFacade.errorMessage;
  protected readonly hasUsers = computed(() => this.users().length > 0);
  protected readonly planFilterOptions = computed(() =>
    this.plans()
      .filter((plan) => plan.isActive)
      .map((plan) => ({
        label: `${plan.name} (${plan.code})`,
        value: plan.code,
      })),
  );
  protected readonly sortFieldOptions: SortFieldOption[] = [
    { label: 'Correo', value: 'email' },
    { label: 'Nombre', value: 'fullName' },
    { label: 'Plan', value: 'planCode' },
    { label: 'Cupo maximo', value: 'maxGps' },
    { label: 'GPS usados', value: 'usedGps' },
    { label: 'Creacion', value: 'createdAt' },
  ];
  protected readonly sortDirectionOptions: SortDirectionOption[] = [
    { label: 'Ascendente', value: 'asc' },
    { label: 'Descendente', value: 'desc' },
  ];
  protected readonly form = this.formBuilder.group({
    search: [''],
    planCode: [''],
    sortBy: ['email' as AdminUsersSortField],
    sortDirection: ['asc' as AdminUsersSortDirection],
  });
  protected readonly activeFiltersLabel = computed(() => {
    const filters = [
      this.form.controls.search.getRawValue().trim() ? 'Busqueda activa' : null,
      this.form.controls.planCode.getRawValue() ? 'Plan filtrado' : null,
      this.form.controls.sortBy.getRawValue() !== 'email' ||
      this.form.controls.sortDirection.getRawValue() !== 'asc'
        ? 'Orden personalizado'
        : null,
    ].filter(Boolean);

    return filters.length > 0 ? filters.join(' / ') : 'Vista general';
  });

  constructor() {
    void this.adminUsersFacade.initialize();
  }

  protected async submitFilters(): Promise<void> {
    await this.adminUsersFacade.applyQuery({
      page: 1,
      pageSize: this.query().pageSize,
      search: this.normalizeOptional(this.form.controls.search.getRawValue()),
      planCode: this.normalizeOptional(this.form.controls.planCode.getRawValue()),
      sortBy: this.form.controls.sortBy.getRawValue(),
      sortDirection: this.form.controls.sortDirection.getRawValue(),
    });
  }

  protected async clearFilters(): Promise<void> {
    this.form.reset({
      search: '',
      planCode: '',
      sortBy: 'email',
      sortDirection: 'asc',
    });

    await this.adminUsersFacade.applyQuery({
      page: 1,
      pageSize: this.query().pageSize,
      search: undefined,
      planCode: undefined,
      sortBy: 'email',
      sortDirection: 'asc',
    });
  }

  protected async changePage(event: PageEventLike): Promise<void> {
    await this.adminUsersFacade.applyQuery({
      page: (event.page ?? 0) + 1,
      pageSize: event.rows ?? this.query().pageSize,
    });
  }

  protected async retryLoad(): Promise<void> {
    await this.adminUsersFacade.initialize();
  }

  protected getQuotaSeverity(usedGps: number, maxGps: number): 'success' | 'warn' {
    return usedGps >= maxGps ? 'warn' : 'success';
  }

  private normalizeOptional(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
}
