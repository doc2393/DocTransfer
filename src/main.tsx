import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Debug logging
console.log('Clerk Key exists:', !!PUBLISHABLE_KEY);
if (PUBLISHABLE_KEY) {
  console.log('Clerk Key prefix:', PUBLISHABLE_KEY.substring(0, 8));
} else {
  console.error('Clerk Key is MISSING completely');
}

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </StrictMode>,
)
