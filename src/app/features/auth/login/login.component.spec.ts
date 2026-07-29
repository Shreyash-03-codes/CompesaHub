import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authMock = jasmine.createSpyObj('AuthService', ['login']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an invalid form when empty', () => {
    expect(component.form.valid).toBeFalse();
  });

  it('should validate email and password fields', () => {
    const email = component.form.controls.email;
    const password = component.form.controls.password;

    email.setValue('invalid');
    expect(email.valid).toBeFalse();

    email.setValue('test@compesa.in');
    expect(email.valid).toBeTrue();

    password.setValue('12');
    expect(password.valid).toBeFalse();

    password.setValue('123456');
    expect(password.valid).toBeTrue();
  });

  it('should call AuthService.login on submit and navigate on success', async () => {
    authMock.login.and.resolveTo({});
    component.form.setValue({ email: 'a@b.com', password: '123456' });
    await component.onSubmit();
    expect(authMock.login).toHaveBeenCalledWith('a@b.com', '123456');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should show error message on login failure', async () => {
    authMock.login.and.resolveTo({ error: 'Invalid credentials' });
    component.form.setValue({ email: 'a@b.com', password: '123456' });
    await component.onSubmit();
    expect(component.error).toBe('Invalid credentials');
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });
});
