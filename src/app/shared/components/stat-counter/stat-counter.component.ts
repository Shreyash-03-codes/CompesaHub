import { Component, Input, ElementRef, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-counter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-counter.component.html',
  styleUrls: ['./stat-counter.component.scss'],
})
export class StatCounterComponent implements AfterViewInit, OnDestroy {
  @Input() targetValue = 0;
  @Input() label = '';
  @Input() icon = '';
  @Input() suffix = '';
  @Input() duration = 2000;

  currentValue = signal(0);
  private observer: IntersectionObserver | null = null;
  private rafId = 0;

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.animateCounter();
          this.observer?.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    this.observer.observe(this.el.nativeElement);
  }

  private animateCounter(): void {
    const start = performance.now();
    const from = 0;
    const to = this.targetValue;

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / this.duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      this.currentValue.set(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        this.rafId = requestAnimationFrame(step);
      }
    };
    this.rafId = requestAnimationFrame(step);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    cancelAnimationFrame(this.rafId);
  }
}
