import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-ops-shell-page',
  imports: [RouterOutlet],
  templateUrl: './ops-shell-page.component.html',
  styleUrl: './ops-shell-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpsShellPageComponent {}
