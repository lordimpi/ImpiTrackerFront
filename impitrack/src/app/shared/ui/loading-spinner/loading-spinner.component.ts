import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type LoadingSpinnerMode = 'inline' | 'overlay' | 'screen';
type LoadingSpinnerSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-loading-spinner',
    '[class.app-loading-spinner--inline]': 'mode() === "inline"',
    '[class.app-loading-spinner--overlay]': 'mode() === "overlay"',
    '[class.app-loading-spinner--screen]': 'mode() === "screen"',
    '[class.app-loading-spinner--sm]': 'size() === "sm"',
    '[class.app-loading-spinner--md]': 'size() === "md"',
    '[class.app-loading-spinner--lg]': 'size() === "lg"',
    'role': 'status',
    'aria-live': 'polite',
    '[attr.aria-label]': 'label()',
  },
})
export class LoadingSpinnerComponent {
  readonly label = input('Cargando...');
  readonly mode = input<LoadingSpinnerMode>('inline');
  readonly size = input<LoadingSpinnerSize>('md');
  readonly showLabel = input(true);

  protected readonly labelVisible = computed(() => this.showLabel() && this.label().trim().length > 0);
}
