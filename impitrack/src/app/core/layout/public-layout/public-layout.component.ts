import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthFacade } from '../../auth/application/auth.facade';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicLayoutComponent {
  private readonly authFacade = inject(AuthFacade);

  protected readonly appName = 'IMPITrack';
  protected readonly currentUser = this.authFacade.user;
  protected readonly headline = computed(() =>
    this.currentUser() ? 'Bienvenido de vuelta' : 'Control total de tu flota',
  );
}
