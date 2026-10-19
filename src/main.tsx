import {createRoot} from 'react-dom/client';
import '@fontsource-variable/fredoka';
import '@fontsource-variable/outfit';
import '@fontsource-variable/plus-jakarta-sans';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
