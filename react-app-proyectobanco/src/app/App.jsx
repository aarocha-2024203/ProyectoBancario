import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './router/AppRoutes';

const App = () => (
  <BrowserRouter>
    {/* Toast notifications globales */}
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#112240',
          color: '#f8f9fa',
          border: '1px solid rgba(201,168,76,.3)',
          fontFamily: 'DM Sans, sans-serif',
        },
        success: { iconTheme: { primary: '#4caf7d', secondary: '#112240' } },
        error:   { iconTheme: { primary: '#e05c5c', secondary: '#112240' } },
      }}
    />
    <AppRoutes />
  </BrowserRouter>
);

export default App;
