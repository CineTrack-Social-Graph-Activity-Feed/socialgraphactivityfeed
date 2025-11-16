import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FeedPrincipal from './FeedPrincipal';

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

vi.mock('../../compenents/feedPrincipal/post/Post', () => ({
  default: () => <div data-testid="post">Post</div>
}));

vi.mock('../../compenents/footer/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>
}));

describe('FeedPrincipal', () => {
  it('should render the page layout', () => {
    render(<FeedPrincipal />);
    
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('followed')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('should render the welcome message', () => {
    render(<FeedPrincipal />);
    
    expect(screen.getByText(/¡Bienvenido! Esto es lo que tus amigos han estado viendo.../i)).toBeInTheDocument();
  });

  it('should render Post components', () => {
    render(<FeedPrincipal />);
    
    const posts = screen.getAllByTestId('post');
    expect(posts).toHaveLength(1);
  });

  it('should have correct layout structure', () => {
    const { container } = render(<FeedPrincipal />);
    
    expect(container.querySelector('.layout-feed')).toBeInTheDocument();
    expect(container.querySelector('.navbar-container')).toBeInTheDocument();
    expect(container.querySelector('.content-feed')).toBeInTheDocument();
    expect(container.querySelector('.sidebar-feed')).toBeInTheDocument();
    expect(container.querySelector('.main.bkg-especial')).toBeInTheDocument();
    expect(container.querySelector('.followed.bkg-especial')).toBeInTheDocument();
    expect(container.querySelector('.footer-container')).toBeInTheDocument();
  });

  it('should have title section with correct class', () => {
    const { container } = render(<FeedPrincipal />);
    
    const titleSection = container.querySelector('.title-section');
    expect(titleSection).toBeInTheDocument();
    expect(titleSection.querySelector('h2')).toBeInTheDocument();
  });

  it('should have feed-stack container', () => {
    const { container } = render(<FeedPrincipal />);
    
    const feedStack = container.querySelector('.feed-stack');
    expect(feedStack).toBeInTheDocument();
  });
});
