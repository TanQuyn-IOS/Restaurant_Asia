import { useState, type FormEvent } from 'react';
import { AlertCircle, KeyRound } from 'lucide-react';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Overlay';

/** Modal đổi mật khẩu cá nhân của tài khoản đang đăng nhập (FR-26 / 10.1.2). */
export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const authUser = useRestaurantStore((s) => s.authUser);
  const changeOwnPassword = useRestaurantStore((s) => s.changeOwnPassword);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetAndClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await changeOwnPassword(currentPassword, newPassword, confirmPassword);
      if (!res.ok) {
        setError(res.error ?? 'Không thể cập nhật mật khẩu.');
        return;
      }
      resetAndClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      size="sm"
      icon={<KeyRound size={20} />}
      title="Đổi mật khẩu"
      description={authUser ? `Tài khoản ${authUser.ten_dang_nhap}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={resetAndClose} disabled={submitting}>
            Hủy
          </Button>
          <Button type="submit" form="ac-change-password-form" variant="primary" loading={submitting}>
            Lưu mật khẩu mới
          </Button>
        </>
      }
    >
      <form id="ac-change-password-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-st-serving/40 bg-st-serving-soft px-3.5 py-2.5 text-xs text-st-serving-ink"
          >
            <AlertCircle size={15} aria-hidden className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Field label="Mật khẩu hiện tại">
          {({ id }) => (
            <Input
              id={id}
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại..."
            />
          )}
        </Field>

        <Field label="Mật khẩu mới" hint="Tối thiểu 6 ký tự, khác mật khẩu hiện tại.">
          {({ id, describedBy }) => (
            <Input
              id={id}
              type="password"
              autoComplete="new-password"
              aria-describedby={describedBy}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới..."
            />
          )}
        </Field>

        <Field label="Xác nhận mật khẩu mới">
          {({ id }) => (
            <Input
              id={id}
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới..."
            />
          )}
        </Field>
      </form>
    </Modal>
  );
}
