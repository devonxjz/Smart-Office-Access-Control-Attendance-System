import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmployeeList } from './EmployeeList';
import * as useSheetsDataModule from '../../hooks/useSheetsData';

vi.mock('../../hooks/useSheetsData');

const mockEmployees = [
  { UID: 'NV01', 'Họ tên': 'Trần Lê Thái', 'Email': 'admin@gmail.com', 'SĐT': '869655077', 'Giới tính': 'Nam' },
  { UID: 'NV03', 'Họ tên': 'Nhân viên 3', 'Email': 'nv03@gmail.com', 'SĐT': '901155480', 'Giới tính': 'Nam' },
];

describe('EmployeeList', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows loading skeleton while fetching', () => {
    vi.spyOn(useSheetsDataModule, 'useSheetsData').mockReturnValue({
      data: [], loading: true, error: null,
    });
    render(<EmployeeList />);
    expect(screen.getByText(/đang tải/i)).toBeInTheDocument();
  });

  it('renders one row per employee on success', () => {
    vi.spyOn(useSheetsDataModule, 'useSheetsData').mockReturnValue({
      data: mockEmployees, loading: false, error: null,
    });
    render(<EmployeeList />);
    expect(screen.getByText('NV01')).toBeInTheDocument();
    expect(screen.getByText('Trần Lê Thái')).toBeInTheDocument();
    expect(screen.getByText('NV03')).toBeInTheDocument();
    // Có đúng 2 hàng dữ liệu
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3); // 1 header + 2 data rows
  });

  it('does NOT render Password column', () => {
    const dataWithPassword = [
      { ...mockEmployees[0], Password: 'should-be-hidden' },
    ];
    vi.spyOn(useSheetsDataModule, 'useSheetsData').mockReturnValue({
      data: dataWithPassword, loading: false, error: null,
    });
    render(<EmployeeList />);
    expect(screen.queryByText('should-be-hidden')).not.toBeInTheDocument();
    expect(screen.queryByText('Password')).not.toBeInTheDocument();
  });

  it('shows error message when fetch fails', () => {
    vi.spyOn(useSheetsDataModule, 'useSheetsData').mockReturnValue({
      data: [], loading: false, error: 'Không thể kết nối máy chủ',
    });
    render(<EmployeeList />);
    expect(screen.getByText(/không thể kết nối máy chủ/i)).toBeInTheDocument();
  });
});
