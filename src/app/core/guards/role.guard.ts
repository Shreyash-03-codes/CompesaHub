import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot } from '@angular/router';
import { map, Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  private auth = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const requiredRoles = route.data['roles'] as UserRole[];
    return this.auth.userRoles$.pipe(
      map(roles => {
        const hasRole = requiredRoles.some(r => roles.includes(r));
        if (hasRole) return true;
        return this.router.createUrlTree(['/dashboard']);
      })
    );
  }
}
