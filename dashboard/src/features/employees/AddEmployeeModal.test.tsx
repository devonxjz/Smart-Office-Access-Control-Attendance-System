import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddEmployeeModal } from './AddEmployeeModal';

describe('AddEmployeeModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all required form fields', () => {
    render(<AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    expect(screen.getByLabelText(/Họ và tên/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mã NV/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phòng ban/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/RFID UID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Xác nhận mật khẩu/i)).toBeInTheDocument();
  });

  it('validates required fields on submit', async () => {
    render(<AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    fireEvent.click(screen.getByText('Thêm nhân viên'));
    
    await waitFor(() => {
      expect(screen.getByText(/Vui lòng nhập họ tên/i)).toBeInTheDocument();
      expect(screen.getByText(/Vui lòng nhập mã NV/i)).toBeInTheDocument();
      expect(screen.getByText(/Vui lòng nhập mật khẩu/i)).toBeInTheDocument();
    });
    
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('validates password length and matching', async () => {
    render(<AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    fireEvent.change(screen.getByLabelText(/^Mật khẩu/i), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu/i), { target: { value: 'short2' } });
    fireEvent.click(screen.getByText('Thêm nhân viên'));
    
    await waitFor(() => {
      expect(screen.getByText(/Mật khẩu phải có ít nhất 8 ký tự/i)).toBeInTheDocument();
      expect(screen.getByText(/Mật khẩu xác nhận không khớp/i)).toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    render(<AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    const pwdInput = screen.getByLabelText(/^Mật khẩu/i);
    expect(pwdInput).toHaveAttribute('type', 'password');
    
    const toggleBtn = screen.getByLabelText(/Hiện mật khẩu/i);
    fireEvent.click(toggleBtn);
    
    expect(pwdInput).toHaveAttribute('type', 'text');
  });

  it('generates random password', async () => {
    render(<AddEmployeeModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    const pwdInput = screen.getByLabelText(/^Mật khẩu/i) as HTMLInputElement;
    expect(pwdInput.value).toBe('');
    
    const generateBtn = screen.getByText(/Tạo ngẫu nhiên/i);
    fireEvent.click(generateBtn);
    
    expect(pwdInput.value.length).toBeGreaterThanOrEqual(8);
    // Should also fill confirm password
    const confirmInput = screen.getByLabelText(/Xác nhận mật khẩu/i) as HTMLInputElement;
    expect(confirmInput.value).toBe(pwdInput.value);
  });
});
