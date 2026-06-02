import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

describe('Tabs Component', () => {
  it('renders tabs and shows active content', () => {
    render(
      <Tabs value="tab1" onValueChange={() => {}}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Content 1')).toBeVisible();
    expect(screen.queryByText('Content 2')).toBeNull();
  });

  it('switches content on trigger click', () => {
    const onValueChange = vi.fn();
    render(
      <Tabs value="tab1" onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    fireEvent.click(screen.getByText('Tab 2'));
    expect(onValueChange).toHaveBeenCalledWith('tab2');
  });

  it('throws error when TabsTrigger is used outside Tabs', () => {
    expect(() => render(<TabsTrigger value="test">Bad</TabsTrigger>)).toThrow('TabsTrigger must be used within Tabs');
  });

  it('highlights active trigger', () => {
    render(
      <Tabs value="tab1" onValueChange={() => {}}>
        <TabsList>
          <TabsTrigger value="tab1">Active Tab</TabsTrigger>
          <TabsTrigger value="tab2">Inactive Tab</TabsTrigger>
        </TabsList>
      </Tabs>
    );
    expect(screen.getByText('Active Tab')).toHaveClass('bg-white', 'shadow-sm');
  });

  it('renders TabsList with correct styling', () => {
    render(
      <Tabs value="a" onValueChange={() => {}}>
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
      </Tabs>
    );
    expect(screen.getByText('A').closest('[class*="inline-flex"]')).toHaveClass('bg-pm-cream');
  });
});
