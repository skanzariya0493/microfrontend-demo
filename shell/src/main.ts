import { loadManifest } from '@angular-architects/module-federation';

loadManifest('/assets/mf.manifest.json')
  .then(() => import('./bootstrap'))
  .catch(err => console.error(err));