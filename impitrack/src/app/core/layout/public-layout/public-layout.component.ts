import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthFacade } from '../../auth/application/auth.facade';

@Component({
  selector: 'app-public-layout',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicLayoutComponent {
  private readonly authFacade = inject(AuthFacade);

  protected readonly appName = 'IMPITrack';
  protected readonly currentUser = this.authFacade.user;
  protected readonly headline = computed(() =>
    this.currentUser() ? 'Vuelve a la consola' : 'Telemetría operativa, sin ruido innecesario',
  );
}
