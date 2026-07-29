import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { map, Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private auth = inject(AuthService);
  private router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    return this.auth.currentUser$.pipe(
      map(user => {
        if (user) return true;
        return this.router.createUrlTree(['/auth/login']);
      })
    );
  }
}
