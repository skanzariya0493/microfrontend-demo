import { loadManifest } from '@angular-architects/module-federation';
import { environment } from './environments/environment';

loadManifest(environment.manifest)
  .then(() => import('./bootstrap'))
  .catch(err => console.error(err));