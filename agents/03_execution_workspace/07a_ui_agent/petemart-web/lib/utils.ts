import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getModeLabel(mode: string): { label: string; color: string } {
  switch (mode) {
    case 'A':
    case 'buy':
      return { label: 'Buy Now', color: '#2E7D32' };
    case 'B':
    case 'whatsapp':
      return { label: 'Enquire on WhatsApp', color: '#25D366' };
    case 'C':
    case 'visit':
      return { label: 'Visit Store', color: '#1976D2' };
    default:
      return { label: mode, color: '#666666' };
  }
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: '#FF9800',
    confirmed: '#2196F3',
    packing: '#9C27B0',
    picked_up: '#FF9800',
    consolidated: '#2196F3',
    in_transit: '#2196F3',
    delivered: '#4CAF50',
    completed: '#4CAF50',
    cancelled: '#F44336',
  };
  return colors[status] || '#666666';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_payment: 'Pending Payment',
    pending: 'Payment Pending',
    confirmed: 'Confirmed',
    packing: 'Packing',
    picked_up: 'Picked Up',
    consolidated: 'Consolidated',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
}
