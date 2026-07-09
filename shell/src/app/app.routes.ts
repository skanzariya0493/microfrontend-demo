import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { HomeComponent } from './home';
import { SignupComponent } from './pages/signup/signup';
import { LoginComponent } from './login';
import { authGuard, guestGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
  },
  {
    path: 'signup',
    component: SignupComponent,
    canActivate: [guestGuard],
  },
  {
    path: '',
    component: HomeComponent,
    canActivate: [authGuard],
  },
  {
    path: 'product',
    canActivate: [authGuard],
    loadComponent: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'product',
        exposedModule: './Component',
      }).then((m) => m.App),
  },
  {
    path: 'order',
    canActivate: [authGuard],
    loadComponent: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'order',
        exposedModule: './Component',
      }).then((m) => m.App),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
