// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tradelogix-full.vercel.app/api';

// Debug logging
console.log('Environment VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('Final API_BASE_URL:', API_BASE_URL);

export { API_BASE_URL }; 