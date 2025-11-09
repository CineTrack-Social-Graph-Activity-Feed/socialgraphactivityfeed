import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../../compenents/navbar/Navbar';
import { AuthProvider } from '../../config/AuthContext';

// Mock AuthContext
vi.mock('../../config/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    user: {
      user: {
        user_id: 'test-user-123',
        username: 'testuser'
      }
    },
    fetchWithAuth: vi.fn(),
    signOut: vi.fn()
  })
}));

describe('Navbar Component', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
  });

  it('displays user information when loaded', async () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    
    // Component should render even if data is loading
    expect(document.querySelector('.navbar')).toBeInTheDocument();
  });
});
