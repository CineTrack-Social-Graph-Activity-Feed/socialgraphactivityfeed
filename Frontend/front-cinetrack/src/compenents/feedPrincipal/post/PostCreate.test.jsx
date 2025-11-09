import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PostCreate from './PostCreate';

describe('PostCreate', () => {
  it('should render without crashing', () => {
    const { container } = render(<PostCreate />);
    expect(container).toBeTruthy();
  });

  it('should render write post button', () => {
    render(<PostCreate />);
    expect(screen.getByText(/Escribe un comentario/i)).toBeInTheDocument();
  });

  it('should render upload photo button', () => {
    render(<PostCreate />);
    expect(screen.getByText(/Subir Foto/i)).toBeInTheDocument();
  });

  it('should render upload video button', () => {
    render(<PostCreate />);
    expect(screen.getByText(/Subir Video/i)).toBeInTheDocument();
  });

  it('should have correct structure', () => {
    const { container } = render(<PostCreate />);
    expect(container.querySelector('.post-create-container')).toBeInTheDocument();
    expect(container.querySelector('.post')).toBeInTheDocument();
    expect(container.querySelector('.write-post-header')).toBeInTheDocument();
  });

  it('should render all SVG icons', () => {
    const { container } = render(<PostCreate />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('should have write post button with correct aria-label', () => {
    render(<PostCreate />);
    const writeBtn = screen.getByLabelText('Write Post');
    expect(writeBtn).toBeInTheDocument();
  });

  it('should have upload photo button with correct aria-label', () => {
    render(<PostCreate />);
    const photoBtn = screen.getByLabelText('Upload Photo');
    expect(photoBtn).toBeInTheDocument();
  });

  it('should have upload video button with correct aria-label', () => {
    render(<PostCreate />);
    const videoBtn = screen.getByLabelText('Upload Video');
    expect(videoBtn).toBeInTheDocument();
  });

  it('should render config header sections', () => {
    const { container } = render(<PostCreate />);
    expect(container.querySelectorAll('.config-header').length).toBeGreaterThan(0);
  });
});
