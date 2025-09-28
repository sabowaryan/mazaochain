import { render, screen } from '@testing-library/react';
import { Button } from '../Button';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Test Button</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('shows loading spinner when loading prop is true', () => {
    render(<Button loading={true}>Loading Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('does not show loading spinner when loading prop is false', () => {
    render(<Button loading={false}>Normal Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
    expect(button).not.toHaveClass('opacity-50');
  });

  it('applies correct variant classes', () => {
    render(<Button variant="destructive">Destructive Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-error-600');
  });

  it('applies correct size classes', () => {
    render(<Button size="lg">Large Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-11');
  });

  it('is disabled when loading is true', () => {
    render(<Button loading={true}>Loading Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('respects disabled prop even when loading is false', () => {
    render(<Button disabled={true} loading={false}>Disabled Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('does not pass loading attribute to DOM element', () => {
    const { container } = render(<Button loading={true}>Test</Button>);
    const button = container.querySelector('button');
    expect(button).not.toHaveAttribute('loading');
  });

  it('does not pass asChild attribute to DOM element', () => {
    const { container } = render(<Button asChild={true}>Test</Button>);
    const button = container.querySelector('button');
    expect(button).not.toHaveAttribute('asChild');
  });
});