import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Follows from './Follows';

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

vi.mock('../../compenents/tabBar/TabBar', () => ({
  default: ({ onChange }) => (
    <div data-testid="tabs">
      <button onClick={() => onChange('SEGUIDOS')}>Seguidos</button>
      <button onClick={() => onChange('SEGUIDORES')}>Seguidores</button>
    </div>
  )
}));

vi.mock('../../compenents/listaFollows/ListaFollows', () => ({
  default: () => <div data-testid="lista-follows">ListaFollows</div>
}));

vi.mock('../../compenents/listaFollowers/ListaFollowers', () => ({
  default: () => <div data-testid="lista-followers">ListaFollowers</div>
}));

describe('Follows', () => {
  it('should render the page layout', () => {
    render(<Follows />);
    
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('tabs')).toBeInTheDocument();
  });

  it('should show ListaFollows by default (SEGUIDOS tab)', () => {
    render(<Follows />);
    
    expect(screen.getByTestId('lista-follows')).toBeInTheDocument();
    expect(screen.queryByTestId('lista-followers')).not.toBeInTheDocument();
  });

  it('should switch to ListaFollowers when SEGUIDORES tab is selected', async () => {
    const user = userEvent.setup();
    render(<Follows />);
    
    const seguidoresButton = screen.getByText('Seguidores');
    await user.click(seguidoresButton);
    
    expect(screen.getByTestId('lista-followers')).toBeInTheDocument();
    expect(screen.queryByTestId('lista-follows')).not.toBeInTheDocument();
  });

  it('should switch back to ListaFollows when SEGUIDOS tab is selected', async () => {
    const user = userEvent.setup();
    render(<Follows />);
    
    // First switch to Seguidores
    const seguidoresButton = screen.getByText('Seguidores');
    await user.click(seguidoresButton);
    
    // Then switch back to Seguidos
    const seguidosButton = screen.getByText('Seguidos');
    await user.click(seguidosButton);
    
    expect(screen.getByTestId('lista-follows')).toBeInTheDocument();
    expect(screen.queryByTestId('lista-followers')).not.toBeInTheDocument();
  });

  it('should have correct layout structure', () => {
    const { container } = render(<Follows />);
    
    expect(container.querySelector('.layout-follows')).toBeInTheDocument();
    expect(container.querySelector('.navbar-container')).toBeInTheDocument();
    expect(container.querySelector('.content-feed')).toBeInTheDocument();
    expect(container.querySelector('.sidebar-feed')).toBeInTheDocument();
    expect(container.querySelector('.bkg-especial')).toBeInTheDocument();
    expect(container.querySelector('.footer-container')).toBeInTheDocument();
  });

  it('should have main content with correct styles', () => {
    const { container } = render(<Follows />);
    
    const main = container.querySelector('main.bkg-especial');
    expect(main).toBeInTheDocument();
    expect(main).toHaveStyle({ width: '100%', padding: '20px' });
  });

  it('should have container div inside main', () => {
    const { container } = render(<Follows />);
    
    const containerDiv = container.querySelector('.container');
    expect(containerDiv).toBeInTheDocument();
  });
});
