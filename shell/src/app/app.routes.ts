import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { HomeComponent } from './home';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: HomeComponent,
  },
  {
    path: 'product',
    loadComponent: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'product',
        exposedModule: './Component',
      }).then((m) => m.App),
  },
  {
    path: 'order',
    loadComponent: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'order',
        exposedModule: './Component',
      }).then((m) => m.App),
  }
  // {
  //   path: 'product',
  //   loadComponent: () =>
  //     loadRemoteModule({
  //       type: 'module',
  //       remoteEntry: 'http://localhost:4201/remoteEntry.js',
  //       exposedModule: './Component',
  //     }).then((m) => m.App),
  // },
  // {
  //   path: 'order',
  //   loadComponent: () =>
  //     loadRemoteModule({
  //       type: 'module',
  //       remoteEntry: 'http://localhost:4202/remoteEntry.js',
  //       exposedModule: './Component',
  //     }).then((m) => m.App),
  // },
];
