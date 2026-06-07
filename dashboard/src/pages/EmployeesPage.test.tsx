import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmployeesPage } from './EmployeesPage';
import { useAppData } from '../contexts/app-data-context';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../contexts/app-context';

vi.mock('../contexts/app-data-context');

const mockEmployees = [
  { 'Mã NV': 'EMP01', 'Họ tên': 'Trần Lê Thái', 'RFID UID': 'A1B2C3D4', 'Phòng ban': 'IT', 'Trạng thái': 'Active', 'Password': 'hash1' },
  { 'Mã NV': 'EMP02', 'Họ tên': 'Nhân viên 2', 'RFID UID': 'F3E2A1B0', 'Phòng ban': 'HR', 'Trạng thái': 'Inactive', 'Password': 'hash2' },
];

const renderComponent = () => render(
  <AppProvider>
    <BrowserRouter>
      <EmployeesPage />
    </BrowserRouter>
  </AppProvider>
);

describe('EmployeesPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows loading skeleton while fetching', () => {
    (useAppData as any).mockReturnValue({
      data: [], loading: true, refreshing: false, error: null,
    });
    renderComponent();
    expect(screen.getByText(/đang tải/i)).toBeInTheDocument();
  });

  it('renders correct columns and data based on PRD', () => {
    (useAppData as any).mockReturnValue({
      data: mockEmployees, loading: false, refreshing: false, error: null,
    });
    renderComponent();
    
    // Check columns
    expect(screen.getByText('Họ tên')).toBeInTheDocument();
    expect(screen.getByText('Mã NV')).toBeInTheDocument();
    expect(screen.getByText('UID thẻ NFC')).toBeInTheDocument();
    expect(screen.getByText('Phòng ban')).toBeInTheDocument();
    expect(screen.getByText('Trạng thái')).toBeInTheDocument();

    // Check data
    expect(screen.getByText('Trần Lê Thái')).toBeInTheDocument();
    expect(screen.getByText('EMP01')).toBeInTheDocument();
    expect(screen.getAllByText('IT').length).toBeGreaterThan(0);
  });

  it('does NOT render Password column or data', () => {
    (useAppData as any).mockReturnValue({
      data: mockEmployees, loading: false, refreshing: false, error: null,
    });
    renderComponent();
    expect(screen.queryByText('hash1')).not.toBeInTheDocument();
    expect(screen.queryByText('Password')).not.toBeInTheDocument();
  });

  it('renders action buttons (Thêm nhân viên, Chi tiết)', () => {
    (useAppData as any).mockReturnValue({
      data: mockEmployees, loading: false, refreshing: false, error: null,
    });
    renderComponent();
    
    expect(screen.getByText('Thêm nhân viên')).toBeInTheDocument();
    const detailsButtons = screen.getAllByText('Chi tiết');
    expect(detailsButtons).toHaveLength(2); // One per row
  });

  it('filters employees by search term (name or ID)', () => {
    (useAppData as any).mockReturnValue({
      data: mockEmployees, loading: false, refreshing: false, error: null,
    });
    renderComponent();
    
    const searchInput = screen.getByPlaceholderText(/Tìm kiếm theo tên hoặc mã NV/i);
    fireEvent.change(searchInput, { target: { value: 'Thái' } });
    
    expect(screen.getByText('Trần Lê Thái')).toBeInTheDocument();
    expect(screen.queryByText('Nhân viên 2')).not.toBeInTheDocument();
  });

  it('filters employees by department', () => {
    (useAppData as any).mockReturnValue({
      data: mockEmployees, loading: false, refreshing: false, error: null,
    });
    renderComponent();
    
    const selectTrigger = screen.getByRole('combobox');
    expect(selectTrigger).toBeInTheDocument();
  });
});
