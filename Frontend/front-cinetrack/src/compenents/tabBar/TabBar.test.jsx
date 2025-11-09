import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Tabs from './TabBar';

describe('TabBar Component', () => {
  it('should render tabs', () => {
    render(<Tabs />);
    expect(screen.getByText('SEGUIDOS')).toBeInTheDocument();
    expect(screen.getByText('SEGUIDORES')).toBeInTheDocument();
  });

  it('should have SEGUIDOS as active by default', () => {
    render(<Tabs />);
    const seguidosButton = screen.getByText('SEGUIDOS');
    expect(seguidosButton.className).toContain('active');
  });

  it('should change active tab on click', () => {
    render(<Tabs />);
    const seguidoresButton = screen.getByText('SEGUIDORES');
    
    fireEvent.click(seguidoresButton);
    expect(seguidoresButton.className).toContain('active');
  });

  it('should call onChange callback when tab is clicked', () => {
    const mockOnChange = vi.fn();
    render(<Tabs onChange={mockOnChange} />);
    
    const seguidoresButton = screen.getByText('SEGUIDORES');
    fireEvent.click(seguidoresButton);
    
    expect(mockOnChange).toHaveBeenCalledWith('SEGUIDORES');
  });

  it('should not call onChange if not provided', () => {
    render(<Tabs />);
    const seguidoresButton = screen.getByText('SEGUIDORES');
    
    // Should not throw error
    fireEvent.click(seguidoresButton);
    expect(true).toBe(true);
  });

  it('should render correct number of tabs', () => {
    render(<Tabs />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });

  it('should only have one active tab at a time', () => {
    render(<Tabs />);
    const seguidosButton = screen.getByText('SEGUIDOS');
    const seguidoresButton = screen.getByText('SEGUIDORES');
    
    fireEvent.click(seguidoresButton);
    
    expect(seguidoresButton.className).toContain('active');
    expect(seguidosButton.className).not.toContain('active');
  });
});
