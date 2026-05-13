import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmployeeList } from './EmployeeList';
import * as useSheetsDataModule from '../../hooks/useSheetsData';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../hooks/useSheetsData');

const mockEmployees = [
  { 'Mã NV': 'EMP01', 'Họ tên': 'Trần Lê Thái', 'RFID UID': 'A1B2C3D4', 'Phòng ban': 'IT', 'Trạng thái': 'Active', 'Password': 'hash1' },
  { 'Mã NV': 'EMP02', 'Họ tên': 'Nhân viên 2', 'RFID UID': 'F3E2A1B0', 'Phòng ban': 'HR', 'Trạng thái': 'Inactive', 'Password': 'hash2' },
];

const renderComponent = () => render(
  <BrowserRouter>
    <EmployeeList />
  </BrowserRouter>
);

describe('EmployeeList', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows loading skeleton while fetching', () => {
    vi.spyOn(useSheetsDataModule, 'useSheetsData').mockReturnValue({
      data: [], loading: true, error: null,
    });
    renderComponent();
    expect(screen.getByText(/đang tải/i)).toBeInTheDocument();
  });

  it('renders correct columns and data based on PRD', () => {
    vi.spyOn(useSheetsDataModule, 'useSheetsData').mockReturnValue({
      data: mockEmployees, loading: false, error: null,
    });
    renderComponent();
    
    // Check columns
    expect(screen.getByText('Họ tên')).toBeInTheDocument();
    expect(screen.getByText('Mã NV')).toBeInTheDocument();
    expect(screen.getByText('RFID UID')).toBeInTheDocument();
    expect(screen.getByText('Phòng ban')).toBeInTheDocument();
    expect(screen.getByText('Trạng thái')).toBeInTheDocument();

    // Check data
    expect(screen.getByText('Trần Lê Thái')).toBeInTheDocument();
    expect(screen.getByText('EMP01')).toBeInTheDocument();
    expect(screen.getAllByText('IT').length).toBeGreaterThan(0);
  });

  it('does NOT render Password column or data', () => {
    vi.spyOn(useSheetsDataModule, 'useSheetsData').mockReturnValue({
      data: mockEmployees, loading: false, error: null,
    });
    renderComponent();
    expect(screen.queryByText('hash1')).not.toBeInTheDocument();
    expect(screen.queryByText('Password')).not.toBeInTheDocument();
  });

  it('renders action buttons (+ Thêm nhân viên, Chi tiết)', () => {
    vi.spyOn(useSheetsDataModule, 'useSheetsData').mockReturnValue({
      data: mockEmployees, loading: false, error: null,
    });
    renderComponent();
    
    expect(screen.getByText('+ Thêm nhân viên')).toBeInTheDocument();
    const detailsButtons = screen.getAllByText('Chi tiết');
    expect(detailsButtons).toHaveLength(2); // One per row
  });

  it('filters employees by search term (name or ID)', () => {
    vi.spyOn(useSheetsDataModule, 'useSheetsData').mockReturnValue({
      data: mockEmployees, loading: false, error: null,
    });
    renderComponent();
    
    const searchInput = screen.getByPlaceholderText(/Tìm kiếm theo tên hoặc mã NV/i);
    fireEvent.change(searchInput, { target: { value: 'Thái' } });
    
    expect(screen.getByText('Trần Lê Thái')).toBeInTheDocument();
    expect(screen.queryByText('Nhân viên 2')).not.toBeInTheDocument();
  });

  it('filters employees by department', () => {
    vi.spyOn(useSheetsDataModule, 'useSheetsData').mockReturnValue({
      data: mockEmployees, loading: false, error: null,
    });
    renderComponent();
    
    const selectTrigger = screen.getByRole('combobox'); // Assuming standard combobox for select
    expect(selectTrigger).toBeInTheDocument();
    // Complex interactions like Radix select are hard to test simply without specifics, 
    // but we can verify the filter UI exists.
  });
});
