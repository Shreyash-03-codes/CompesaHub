import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-member-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './member-card.component.html',
  styleUrls: ['./member-card.component.scss']
})
export class MemberCardComponent {
  name = input.required<string>();
  role = input.required<string>();
  bio = input<string>('');
  photoUrl = input<string>('');
  isFacultyCoordinator = input<boolean>(false);

  cardClick = output<void>();

  get initials(): string {
    return this.name()
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}