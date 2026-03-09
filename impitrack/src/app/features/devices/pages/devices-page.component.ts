import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-devices-page',
  imports: [Card],
  templateUrl: './devices-page.component.html',
  styleUrl: './devices-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevicesPageComponent {}
