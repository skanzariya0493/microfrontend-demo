// Base URL for the backend API, chosen at runtime so it works both locally and
// when deployed (the order MFE has no environment fileReplacements, so relying
// on environment.ts alone would hardcode localhost into the deployed bundle).
const isLocalhost =
  typeof location !== 'undefined' && location.hostname === 'localhost';

export const API_BASE_URL = isLocalhost
  ? 'http://localhost:5000/api'
  : 'https://backend-0n9w.onrender.com/api';
