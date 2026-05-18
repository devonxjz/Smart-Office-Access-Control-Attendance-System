import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { hashPassword } from '../lib/crypto';
import { sheetsClient } from '../infrastructure/google-sheets.client';

// Mock dependencies
vi.mock('../lib/crypto', () => ({
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

describe('LoginPage Component - Basic Flow', () => {
  const mockNavigate = vi.fn();
  let mockAuthenticateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    (useNavigate as ReturnType<typeof vi.fn>).mockReturnValue(mockNavigate);

    mockAuthenticateSpy = vi.spyOn(sheetsClient, 'authenticate');
  });

  it('authenticates successfully, saves session and navigates to dashboard', async () => {
    (hashPassword as ReturnType<typeof vi.fn>).mockResolvedValue('hashed-pass');
    mockAuthenticateSpy.mockResolvedValue({ name: 'Admin', role: 'admin' });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/Tài khoản/i);
    const passwordInput = screen.getByLabelText(/Mật khẩu/i);
    const submitButton = screen.getByRole('button', { name: /truy cập dashboard/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAuthenticateSpy).toHaveBeenCalledWith('test@example.com', 'hashed-pass');
      expect(sessionStorage.getItem('userSession')).toBe(JSON.stringify({ name: 'Admin', role: 'admin' }));
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    }, { timeout: 3000 });
  });

  it('displays error and enforces cooldown on failed login', async () => {
    (hashPassword as ReturnType<typeof vi.fn>).mockResolvedValue('wrong-hash');
    mockAuthenticateSpy.mockRejectedValue(new Error('Invalid credentials'));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/Tài khoản/i);
    const passwordInput = screen.getByLabelText(/Mật khẩu/i);
    const submitButton = screen.getByRole('button', { name: /truy cập dashboard/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'badpass' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });

    expect(submitButton).toBeDisabled();
  });
});
