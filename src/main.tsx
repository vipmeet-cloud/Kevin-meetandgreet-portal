import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applyFavicon } from './utils/favicon';

const storedFavicon = typeof window !== 'undefined' ? localStorage.getItem('aura_vip_site_favicon_url') : null;
applyFavicon(storedFavicon || '/favicon.svg');

createRoot(document.getElementById('root')!).render(<App />);
