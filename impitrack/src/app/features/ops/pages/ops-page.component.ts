import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-ops-page',
  imports: [Card],
  templateUrl: './ops-page.component.html',
  styleUrl: './ops-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpsPageComponent {}
