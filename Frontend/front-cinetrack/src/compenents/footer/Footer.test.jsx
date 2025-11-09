import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
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
    expect(link).toHaveAttribute('href', '#');
  });
});
