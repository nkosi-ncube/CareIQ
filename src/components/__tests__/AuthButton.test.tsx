
import React from 'react';
import { render, screen } from '@testing-library/react';
import AuthButton from '../auth-button';
import { UserSession } from '@/lib/types';

// Mock the next/navigation router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

describe('AuthButton', () => {
  it('renders Login and Sign Up buttons when no user is provided', () => {
    render(<AuthButton user={null} />);

    // Check if the Login button is rendered
    const loginButton = screen.getByRole('link', { name: /login/i });
    expect(loginButton).toBeInTheDocument();
    expect(loginButton).toHaveAttribute('href', '/login');

    // Check if the Sign Up button is rendered
    const signUpButton = screen.getByRole('link', { name: /sign up/i });
    expect(signUpButton).toBeInTheDocument();
    expect(signUpButton).toHaveAttribute('href', '/register');
  });

  it('renders user avatar and dropdown when a user is provided', () => {
    const user: UserSession = {
      id: '123',
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'patient',
    };

    render(<AuthButton user={user} />);

    // Check if the Avatar button is rendered (which acts as the dropdown trigger)
    const avatarButton = screen.getByRole('button');
    expect(avatarButton).toBeInTheDocument();

    // Check for the avatar fallback text
    const avatarFallback = screen.getByText('J');
    expect(avatarFallback).toBeInTheDocument();
  });
});
