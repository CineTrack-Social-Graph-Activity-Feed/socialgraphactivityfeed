import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BuscarAmigos from './BuscarAmigos';

// Mock all child components
vi.mock('../../compenents/navbar/Navbar', () => ({
  default: () => <div data-testid="navbar">Navbar</div>
}));

vi.mock('../../compenents/feedPrincipal/sidebar/SideBar', () => ({
  default: () => <div data-testid="sidebar">SideBar</div>
}));

vi.mock('../../compenents/footer/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>
}));

describe('BuscarAmigos', () => {
  it('should render the page layout', () => {
    render(<BuscarAmigos />);
    
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('should render the page title', () => {
    render(<BuscarAmigos />);
    
    expect(screen.getByText('Buscar Amigos')).toBeInTheDocument();
  });

  it('should have correct layout structure', () => {
    const { container } = render(<BuscarAmigos />);
    
    expect(container.querySelector('.layout')).toBeInTheDocument();
    expect(container.querySelector('.navbar-container')).toBeInTheDocument();
    expect(container.querySelector('.content')).toBeInTheDocument();
    expect(container.querySelector('.sidebar-feed')).toBeInTheDocument();
    expect(container.querySelector('.bkg-especial')).toBeInTheDocument();
    expect(container.querySelector('.footer-container')).toBeInTheDocument();
  });

  it('should have main content with correct styles', () => {
    const { container } = render(<BuscarAmigos />);
    
    const main = container.querySelector('main.bkg-especial');
    expect(main).toBeInTheDocument();
    expect(main).toHaveStyle({ width: '100%', padding: '20px' });
  });

  it('should have h1 heading inside main', () => {
    const { container } = render(<BuscarAmigos />);
    
    const main = container.querySelector('main.bkg-especial');
    const heading = main.querySelector('h1');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Buscar Amigos');
  });

  it('should render all three main sections', () => {
    render(<BuscarAmigos />);
    
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByText('Buscar Amigos')).toBeInTheDocument();
  });
});
