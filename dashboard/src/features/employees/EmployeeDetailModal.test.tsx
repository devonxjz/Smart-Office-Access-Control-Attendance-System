import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmployeeDetailModal } from './EmployeeDetailModal';

describe('EmployeeDetailModal', () => {
  const mockEmployee = {
    'Mã NV': 'EMP01',
    'Họ tên': 'Trần Lê Thái',
    'RFID UID': 'A1B2C3D4',
    'Phòng ban': 'IT',
    'Trạng thái': 'Active'
  };
  
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders employee details in view mode', () => {
    render(<EmployeeDetailModal isOpen={true} employee={mockEmployee} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    expect(screen.getByDisplayValue('Trần Lê Thái')).toBeInTheDocument();
    expect(screen.getByDisplayValue('EMP01')).toBeInTheDocument();
    
    // Inputs should be read-only
    const nameInput = screen.getByDisplayValue('Trần Lê Thái');
    expect(nameInput).toHaveAttribute('readOnly');
  });

  it('switches to edit mode', () => {
    render(<EmployeeDetailModal isOpen={true} employee={mockEmployee} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    const editBtn = screen.getByText('Chỉnh sửa thông tin');
    fireEvent.click(editBtn);
    
    // Inputs should no longer be read-only
    const nameInput = screen.getByDisplayValue('Trần Lê Thái');
    expect(nameInput).not.toHaveAttribute('readOnly');
    
    expect(screen.getByText('Lưu thay đổi')).toBeInTheDocument();
  });

  it('has a separate change password section', () => {
    render(<EmployeeDetailModal isOpen={true} employee={mockEmployee} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    expect(screen.getByText('Đổi mật khẩu')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mật khẩu mới/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Xác nhận mật khẩu/i)).toBeInTheDocument();
  });

  it('shows deactivate warning dialog', async () => {
    render(<EmployeeDetailModal isOpen={true} employee={mockEmployee} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    const deactivateBtn = screen.getByText('Vô hiệu hóa');
    fireEvent.click(deactivateBtn);
    
    // Should show confirm dialog
    expect(screen.getByText(/Bạn chắc chắn/i)).toBeInTheDocument();
  });
});
