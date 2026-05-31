import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

describe('Card Component', () => {
  it('renders card with all subcomponents', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>Content Here</CardContent>
        <CardFooter>Footer Here</CardFooter>
      </Card>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Content Here')).toBeInTheDocument();
    expect(screen.getByText('Footer Here')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Card className="custom-class">Card</Card>);
    expect(screen.getByText('Card')).toHaveClass('custom-class');
  });
});
