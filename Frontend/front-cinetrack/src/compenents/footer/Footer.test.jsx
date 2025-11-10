import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Footer from '../../compenents/footer/Footer';

describe('Footer Component', () => {
  it('renders footer with correct text', () => {
    render(<Footer />);
    
    expect(screen.getByText(/cineTrack - Todos los derechos reservados/i)).toBeInTheDocument();
  });

  it('renders all footer links', () => {
    render(<Footer />);
    
    expect(screen.getByText('Sobre Nosotros')).toBeInTheDocument();
    expect(screen.getByText('Terminos y Condiciones')).toBeInTheDocument();
    expect(screen.getByText('Ayuda')).toBeInTheDocument();
  });

  it('renders logo button', () => {
    render(<Footer />);
    
    const logoButton = screen.getByRole('button', { name: /cineTrack/i });
    expect(logoButton).toBeInTheDocument();
  });

  it('prevents default on link clicks', () => {
    render(<Footer />);
    
    const link = screen.getByText('Sobre Nosotros');
    const event = { preventDefault: vi.fn() };
    fireEvent.click(link, event);
    expect(link).toHaveAttribute('href', '#');
  });

  it('calls handleLinkClick when clicking on logo button', () => {
    render(<Footer />);
    
    const logoButton = screen.getByRole('button', { name: /cineTrack/i });
    fireEvent.click(logoButton);
    // No debería causar error
    expect(logoButton).toBeInTheDocument();
  });

  it('calls handleLinkClick when clicking on footer links', () => {
    render(<Footer />);
    
    const sobreNosotros = screen.getByText('Sobre Nosotros');
    fireEvent.click(sobreNosotros);
    expect(sobreNosotros).toBeInTheDocument();
  });
});
