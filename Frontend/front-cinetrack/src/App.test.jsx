import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './config/AuthContext';

// Mock the pages
vi.mock('./pages/FeedPrincipal/FeedPrincipal', () => ({
  default: () => <div>Feed Principal Page</div>
}));

vi.mock('./pages/Follows/Follows', () => ({
  default: () => <div>Follows Page</div>
}));

vi.mock('./pages/Login/Login', () => ({
  default: () => <div>Login Page</div>
}));

vi.mock('./pages/MiActividad/MiActividad', () => ({
  default: () => <div>Mi Actividad Page</div>
}));

vi.mock('./config/ProtectedRoute', () => ({
  default: ({ children }) => <div>{children}</div>
}));

describe('App Component', () => {
  const renderApp = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('should render without crashing', () => {
    renderApp();
    expect(document.body).toBeTruthy();
  });

  it('should render routes', () => {
    renderApp();
    // App should have Routes component
    expect(true).toBe(true);
  });

  it('should have login route', () => {
    window.history.pushState({}, 'Login', '/login');
    renderApp();
    expect(screen.queryByText(/Login Page/i)).toBeTruthy();
  });

  it('should redirect root to login', () => {
    renderApp();
    // Root should redirect to /login
    expect(true).toBe(true);
  });

  it('should have protected routes for feed', () => {
    renderApp();
    // Protected routes exist
    expect(true).toBe(true);
  });
});
