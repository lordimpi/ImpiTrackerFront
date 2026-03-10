import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-ops-shell-page',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './ops-shell-page.component.html',
  styleUrl: './ops-shell-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpsShellPageComponent {}
