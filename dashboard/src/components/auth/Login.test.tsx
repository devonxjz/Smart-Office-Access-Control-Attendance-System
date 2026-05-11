import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { Login } from './Login';
import { hashPassword } from '../../lib/crypto';
import { GoogleSheetsClient } from '../../infrastructure/google-sheets.client';

// Mock dependencies
vi.mock('../../lib/crypto', () => ({
  hashPassword: vi.fn(),
}));

// Mock react-router-dom navigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

describe('Login Component - Basic Flow', () => {
  const mockNavigate = vi.fn();
  let mockAuthenticateSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    (useNavigate as any).mockReturnValue(mockNavigate);
    
    mockAuthenticateSpy = vi.spyOn(GoogleSheetsClient.prototype, 'authenticate');
  });

  it('authenticates successfully, saves session and navigates to dashboard', async () => {
    // Arrange
    (hashPassword as any).mockResolvedValue('hashed-pass');
    mockAuthenticateSpy.mockResolvedValue({ name: 'Admin', role: 'admin' });
    
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // Act
    const emailInput = screen.getByLabelText(/Tài khoản/i);
    const passwordInput = screen.getByLabelText(/Mật khẩu/i);
    const submitButton = screen.getByRole('button', { name: /truy cập dashboard/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    fireEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(hashPassword).toHaveBeenCalledWith('password123');
      expect(mockAuthenticateSpy).toHaveBeenCalledWith('test@example.com', 'hashed-pass');
      expect(sessionStorage.getItem('userSession')).toBe(JSON.stringify({ name: 'Admin', role: 'admin' }));
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays error and enforces cooldown on failed login', async () => {
    (hashPassword as any).mockResolvedValue('wrong-hash');
    mockAuthenticateSpy.mockRejectedValue(new Error('Invalid credentials'));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/Tài khoản/i);
    const passwordInput = screen.getByLabelText(/Mật khẩu/i);
    const submitButton = screen.getByRole('button', { name: /truy cập dashboard/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'badpass' } });
    fireEvent.click(submitButton);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });

    // Check cooldown state: Button should be disabled and show cooldown text
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent(/Thử lại sau \d+s/i);
  });
});
