import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-unauthorized-page',
  imports: [ButtonDirective, Card, RouterLink],
  templateUrl: './unauthorized-page.component.html',
  styleUrl: './unauthorized-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnauthorizedPageComponent {}
