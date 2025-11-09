import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from './AuthContext';

vi.mock('./AuthContext', () => ({
  useAuth: vi.fn()
}));

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderProtectedRoute = (children) => {
    return render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProtectedRoute>{children}</ProtectedRoute>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </BrowserRouter>
    );
  };

  it('should render children when user is authenticated', () => {
    useAuth.mockReturnValue({
      user: { username: 'testuser', user_id: 123 },
      loadingUser: false
    });

    renderProtectedRoute(<div>Protected Content</div>);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should show nothing while loading', () => {
    useAuth.mockReturnValue({
      user: null,
      loadingUser: true
    });

    const { container } = renderProtectedRoute(<div>Protected Content</div>);
    expect(container.firstChild).toBeNull();
  });

  it('should redirect to login when user is not authenticated', () => {
    useAuth.mockReturnValue({
      user: null,
      loadingUser: false
    });

    renderProtectedRoute(<div>Protected Content</div>);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should not render children when redirecting', () => {
    useAuth.mockReturnValue({
      user: null,
      loadingUser: false
    });

    renderProtectedRoute(<div>Protected Content</div>);
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
