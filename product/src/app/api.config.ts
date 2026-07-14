// Base URL for the backend API.
// Local dev talks to the Express server on :5000; anything else uses the
// deployed backend. Replace the production URL with your Render backend URL.
const isLocalhost =
  typeof location !== 'undefined' && location.hostname === 'localhost';

export const API_BASE_URL = isLocalhost
  ? 'http://localhost:5000/api'
  : 'https://backend-0n9w.onrender.com/api';
