import { useState } from 'react';
import { Eye, EyeOff, KeyRound, X } from 'lucide-react';
import { GoogleSheetsClient } from '../../infrastructure/google-sheets.client';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddEmployeeModal({ isOpen, onClose, onSuccess }: AddEmployeeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    empId: '',
    department: '',
    rfid: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const generatePassword = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData((prev) => ({ ...prev, password: pwd, confirmPassword: pwd }));
    setShowPassword(true);
    setErrors((prev) => ({ ...prev, password: '', confirmPassword: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Vui lòng nhập họ tên';
    if (!formData.empId) newErrors.empId = 'Vui lòng nhập mã NV';
    if (!formData.department) newErrors.department = 'Vui lòng chọn phòng ban';
    if (!formData.rfid) newErrors.rfid = 'Vui lòng nhập RFID UID';
    
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const gasUrl = import.meta.env.VITE_GAS_URL || '';
      const client = new GoogleSheetsClient(gasUrl);
      
      await client.createEmployee({
        'Mã NV': formData.empId,
        'Họ tên': formData.name,
        'RFID UID': formData.rfid,
        'Phòng ban': formData.department,
        'Trạng thái': 'Active',
        'Password': formData.password, // Plain text here, GAS will hash it
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrors({ submit: err.message || 'Có lỗi xảy ra khi thêm nhân viên' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-lg font-semibold">Thêm nhân viên mới</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted text-muted-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="empId" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mã NV <span className="text-destructive">*</span></label>
              <input
                id="empId" name="empId" type="text"
                value={formData.empId} onChange={handleChange}
                className={`h-9 w-full rounded-md border bg-input px-3 text-sm outline-none transition-colors ${errors.empId ? 'border-destructive' : 'border-border focus:border-primary focus:ring-1 focus:ring-primary/20'}`}
              />
              {errors.empId && <p className="text-[10px] text-destructive">{errors.empId}</p>}
            </div>
            <div className="space-y-1">
              <label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Họ và tên <span className="text-destructive">*</span></label>
              <input
                id="name" name="name" type="text"
                value={formData.name} onChange={handleChange}
                className={`h-9 w-full rounded-md border bg-input px-3 text-sm outline-none transition-colors ${errors.name ? 'border-destructive' : 'border-border focus:border-primary focus:ring-1 focus:ring-primary/20'}`}
              />
              {errors.name && <p className="text-[10px] text-destructive">{errors.name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="department" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Phòng ban <span className="text-destructive">*</span></label>
              <select
                id="department" name="department"
                value={formData.department} onChange={handleChange}
                className={`h-9 w-full rounded-md border bg-input px-3 text-sm outline-none transition-colors ${errors.department ? 'border-destructive' : 'border-border focus:border-primary focus:ring-1 focus:ring-primary/20'}`}
              >
                <option value="">Chọn...</option>
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
              </select>
              {errors.department && <p className="text-[10px] text-destructive">{errors.department}</p>}
            </div>
            <div className="space-y-1">
              <label htmlFor="rfid" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">RFID UID <span className="text-destructive">*</span></label>
              <input
                id="rfid" name="rfid" type="text"
                value={formData.rfid} onChange={handleChange}
                className={`h-9 w-full rounded-md border bg-input px-3 text-sm font-mono outline-none transition-colors ${errors.rfid ? 'border-destructive' : 'border-border focus:border-primary focus:ring-1 focus:ring-primary/20'}`}
              />
              {errors.rfid && <p className="text-[10px] text-destructive">{errors.rfid}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-end">
              <label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mật khẩu <span className="text-destructive">*</span></label>
              <button type="button" onClick={generatePassword} className="text-[10px] font-medium text-primary hover:underline flex items-center gap-1">
                <KeyRound className="h-3 w-3" /> Tạo ngẫu nhiên
              </button>
            </div>
            <div className="relative">
              <input
                id="password" name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password} onChange={handleChange}
                className={`h-9 w-full rounded-md border bg-input pl-3 pr-10 text-sm outline-none transition-colors ${errors.password ? 'border-destructive' : 'border-border focus:border-primary focus:ring-1 focus:ring-primary/20'}`}
              />
              <button
                type="button"
                aria-label="Hiện mật khẩu"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-[10px] text-destructive">{errors.password}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Xác nhận mật khẩu <span className="text-destructive">*</span></label>
            <input
              id="confirmPassword" name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword} onChange={handleChange}
              className={`h-9 w-full rounded-md border bg-input px-3 text-sm outline-none transition-colors ${errors.confirmPassword ? 'border-destructive' : 'border-border focus:border-primary focus:ring-1 focus:ring-primary/20'}`}
            />
            {errors.confirmPassword && <p className="text-[10px] text-destructive">{errors.confirmPassword}</p>}
          </div>

          {errors.submit && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {errors.submit}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 rounded-md border border-border px-4 text-sm font-medium hover:bg-accent disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang thêm...' : 'Thêm nhân viên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
