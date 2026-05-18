import { useState } from 'react';
import { X, Lock, AlertTriangle } from 'lucide-react';
import { sheetsClient } from '../../infrastructure/google-sheets.client';

interface Employee {
  'Mã NV'?: string;
  'Họ tên'?: string;
  'RFID UID'?: string;
  'Phòng ban'?: string;
  'Trạng thái'?: string;
  [key: string]: string | undefined;
}

interface EmployeeDetailModalProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EmployeeDetailModal({ isOpen, employee, onClose, onSuccess }: EmployeeDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDeactivate, setShowConfirmDeactivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: employee?.['Họ tên'] || '',
    department: employee?.['Phòng ban'] || '',
    rfid: employee?.['RFID UID'] || '',
    status: employee?.['Trạng thái'] || 'Active'
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [pwdErrors, setPwdErrors] = useState<Record<string, string>>({});

  if (!isOpen || !employee) return null;

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePwdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitInfoUpdate = async () => {
    setIsSubmitting(true);
    try {
      await sheetsClient.updateEmployee(employee?.['Mã NV'] || '', {
        'Họ tên': formData.name,
        'Phòng ban': formData.department,
        'RFID UID': formData.rfid,
        'Trạng thái': formData.status
      });
      onSuccess();
      setIsEditing(false);
    } catch (err: unknown) {
      setPwdErrors({ submit: err instanceof Error ? err.message : 'Operation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitPasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrs: Record<string, string> = {};
    if (passwordData.newPassword.length < 8) newErrs.newPassword = 'Tối thiểu 8 ký tự';
    if (passwordData.newPassword !== passwordData.confirmPassword) newErrs.confirmPassword = 'Không khớp';
    if (Object.keys(newErrs).length > 0) {
      setPwdErrors(newErrs);
      return;
    }

    setIsSubmitting(true);
    try {
      await sheetsClient.updatePassword(employee?.['Mã NV'] || '', passwordData.newPassword);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      alert('Đã đổi mật khẩu thành công');
    } catch (err: unknown) {
      setPwdErrors({ submit: err instanceof Error ? err.message : 'Operation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    setIsSubmitting(true);
    try {
      await sheetsClient.deactivateEmployee(employee?.['Mã NV'] || '');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setPwdErrors({ submit: err instanceof Error ? err.message : 'Operation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold">Chi tiết nhân viên</h2>
            <p className="text-sm text-muted-foreground font-mono mt-1">ID: {employee['Mã NV']}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT: BASIC INFO */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-primary">Thông tin cơ bản</h3>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="text-xs text-primary hover:underline font-medium">
                  Chỉnh sửa thông tin
                </button>
              ) : (
                <button onClick={() => setIsEditing(false)} className="text-xs text-muted-foreground hover:underline">
                  Hủy sửa
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Mã NV</label>
                <input type="text" value={employee['Mã NV']} readOnly className="w-full h-9 rounded-md border bg-muted/50 px-3 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Họ và tên</label>
                <input
                  type="text" name="name"
                  value={formData.name} onChange={handleInfoChange}
                  readOnly={!isEditing}
                  className={`w-full h-9 rounded-md border px-3 text-sm ${!isEditing ? 'bg-muted/50 border-transparent' : 'bg-input border-border focus:border-primary'}`}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Phòng ban</label>
                <select
                  name="department" value={formData.department} onChange={handleInfoChange}
                  disabled={!isEditing}
                  className={`w-full h-9 rounded-md border px-3 text-sm ${!isEditing ? 'bg-muted/50 border-transparent appearance-none' : 'bg-input border-border focus:border-primary'}`}
                >
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">RFID UID</label>
                <input
                  type="text" name="rfid"
                  value={formData.rfid} onChange={handleInfoChange}
                  readOnly={!isEditing}
                  className={`w-full h-9 rounded-md border px-3 text-sm font-mono ${!isEditing ? 'bg-muted/50 border-transparent' : 'bg-input border-border focus:border-primary'}`}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Trạng thái</label>
                <select
                  name="status" value={formData.status} onChange={handleInfoChange}
                  disabled={!isEditing}
                  className={`w-full h-9 rounded-md border px-3 text-sm ${!isEditing ? 'bg-muted/50 border-transparent appearance-none' : 'bg-input border-border focus:border-primary'}`}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {isEditing && (
              <div className="pt-2">
                <button onClick={submitInfoUpdate} disabled={isSubmitting} className="w-full h-9 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">
                  {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            )}

            {!isEditing && formData.status === 'Active' && !showConfirmDeactivate && (
              <div className="pt-4 border-t border-border mt-4">
                <button onClick={() => setShowConfirmDeactivate(true)} className="w-full h-9 border border-destructive/30 text-destructive rounded-md text-sm font-medium hover:bg-destructive hover:text-destructive-foreground transition-colors">
                  Vô hiệu hóa
                </button>
              </div>
            )}

            {showConfirmDeactivate && (
              <div className="pt-4 border-t border-border mt-4 rounded-md bg-destructive/10 p-3 border border-destructive/20">
                <p className="text-sm text-destructive font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Bạn chắc chắn muốn vô hiệu hóa?</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={handleDeactivate} disabled={isSubmitting} className="flex-1 h-8 bg-destructive text-destructive-foreground rounded-md text-xs font-medium">Vô hiệu hóa</button>
                  <button onClick={() => setShowConfirmDeactivate(false)} className="flex-1 h-8 bg-background border border-border rounded-md text-xs font-medium">Hủy</button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: PASSWORD */}
          <div className="space-y-4 rounded-lg bg-muted/30 p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Đổi mật khẩu</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Mật khẩu mới sẽ có hiệu lực ngay lập tức cho lần đăng nhập Dashboard tiếp theo.
            </p>

            <form onSubmit={submitPasswordUpdate} className="space-y-3">
              <div>
                <label htmlFor="newPassword" className="text-xs font-medium text-muted-foreground">Mật khẩu mới</label>
                <input
                  id="newPassword" name="newPassword" type="password"
                  value={passwordData.newPassword} onChange={handlePwdChange}
                  className="w-full h-9 rounded-md border border-border bg-input px-3 text-sm"
                />
                {pwdErrors.newPassword && <p className="text-[10px] text-destructive">{pwdErrors.newPassword}</p>}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="text-xs font-medium text-muted-foreground">Xác nhận mật khẩu mới</label>
                <input
                  id="confirmPassword" name="confirmPassword" type="password"
                  value={passwordData.confirmPassword} onChange={handlePwdChange}
                  className="w-full h-9 rounded-md border border-border bg-input px-3 text-sm"
                />
                {pwdErrors.confirmPassword && <p className="text-[10px] text-destructive">{pwdErrors.confirmPassword}</p>}
              </div>

              <button type="submit" disabled={isSubmitting || !passwordData.newPassword} className="w-full h-9 bg-foreground text-background rounded-md text-sm font-medium hover:bg-foreground/90 disabled:opacity-50 mt-2">
                Cập nhật mật khẩu
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
