import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import SideBar from './SideBar';

const mockSignOut = vi.fn();
const mockFetchWithAuth = vi.fn();
const mockUser = {
  user: {
    user_id: 'user123',
    full_name: 'Test User',
    sub: 'testuser',
    image_url: null
  }
};

vi.mock('../../../config/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    fetchWithAuth: mockFetchWithAuth,
    signOut: mockSignOut
  })
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('SideBar', () => {
  it('should render user profile information', () => {
    renderWithRouter(<SideBar />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('@testuser')).toBeInTheDocument();
  });

  it('should render default avatar when user has no image_url', () => {
    renderWithRouter(<SideBar />);
    
    const avatar = screen.getByAltText('Avatar user');
    expect(avatar).toHaveAttribute('src', expect.stringContaining('depositphotos'));
  });

  it('should render all navigation links', () => {
    renderWithRouter(<SideBar />);
    
    expect(screen.getByText('Actividad Amigos')).toBeInTheDocument();
    expect(screen.getByText('Mi Actividad')).toBeInTheDocument();
    expect(screen.getByText('Network')).toBeInTheDocument();
  });

  it('should render logout button', () => {
    renderWithRouter(<SideBar />);
    
    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
  });

  it('should call signOut when logout button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SideBar />);
    
    const logoutButton = screen.getByText('Cerrar sesión');
    await user.click(logoutButton);
    
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('should have correct navigation link structure', () => {
    const { container } = renderWithRouter(<SideBar />);
    
    const feedLink = container.querySelector('a[href="/feed"]');
    const actividadLink = container.querySelector('a[href="/mi-actividad"]');
    const followsLink = container.querySelector('a[href="/follows"]');
    
    expect(feedLink).toBeInTheDocument();
    expect(actividadLink).toBeInTheDocument();
    expect(followsLink).toBeInTheDocument();
  });

  it('should render section title', () => {
    renderWithRouter(<SideBar />);
    
    expect(screen.getByText('Panel')).toBeInTheDocument();
  });

  it('should have sidebar structure with correct classes', () => {
    const { container } = renderWithRouter(<SideBar />);
    
    expect(container.querySelector('.sidebar')).toBeInTheDocument();
    expect(container.querySelector('.profile')).toBeInTheDocument();
    expect(container.querySelector('.section')).toBeInTheDocument();
    expect(container.querySelector('.menu')).toBeInTheDocument();
  });

  it('should render all SVG icons', () => {
    const { container } = renderWithRouter(<SideBar />);
    
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('should have danger class on logout button', () => {
    const { container } = renderWithRouter(<SideBar />);
    
    const logoutButton = container.querySelector('.danger');
    expect(logoutButton).toBeInTheDocument();
    expect(logoutButton).toHaveTextContent('Cerrar sesión');
  });
});
