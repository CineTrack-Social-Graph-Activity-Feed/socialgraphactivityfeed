import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MiActividad from './MiActividad';

// Mock all child components
vi.mock('../../compenents/navbar/Navbar', () => ({
  default: () => <div data-testid="navbar">Navbar</div>
}));

vi.mock('../../compenents/feedPrincipal/sidebar/SideBar', () => ({
  default: () => <div data-testid="sidebar">SideBar</div>
}));

vi.mock('../../compenents/feedPrincipal/followed/Followed', () => ({
  default: () => <div data-testid="followed">Followed</div>
}));

vi.mock('../../compenents/miActividad/postMiActividad', () => ({
  default: () => <div data-testid="post-mi-actividad">PostMiActividad</div>
}));

vi.mock('../../compenents/footer/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>
}));

describe('MiActividad', () => {
  it('should render the page layout', () => {
    render(<MiActividad />);
    
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('followed')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('should render the activity message', () => {
    render(<MiActividad />);
    
    expect(screen.getByText(/Aquí verás las reseñas que escribiste!/i)).toBeInTheDocument();
  });

  it('should render PostMiActividad components', () => {
    render(<MiActividad />);
    
    const posts = screen.getAllByTestId('post-mi-actividad');
    expect(posts).toHaveLength(1);
  });

  it('should have correct layout structure', () => {
    const { container } = render(<MiActividad />);
    
    expect(container.querySelector('.layout-feed')).toBeInTheDocument();
    expect(container.querySelector('.navbar-container')).toBeInTheDocument();
    expect(container.querySelector('.content-feed')).toBeInTheDocument();
    expect(container.querySelector('.sidebar-feed')).toBeInTheDocument();
    expect(container.querySelector('.main.bkg-especial')).toBeInTheDocument();
    expect(container.querySelector('.followed.bkg-especial')).toBeInTheDocument();
    expect(container.querySelector('.footer-container')).toBeInTheDocument();
  });

  it('should have title section with user reviews message', () => {
    const { container } = render(<MiActividad />);
    
    const titleSection = container.querySelector('.title-section');
    expect(titleSection).toBeInTheDocument();
    expect(titleSection.querySelector('h2')).toHaveTextContent(/Aquí verás las reseñas que escribiste!/i);
  });

  it('should have feed-stack container', () => {
    const { container } = render(<MiActividad />);
    
    const feedStack = container.querySelector('.feed-stack');
    expect(feedStack).toBeInTheDocument();
  });
});
