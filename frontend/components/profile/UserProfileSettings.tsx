'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ButtonPrimary } from '@/frontend/reusable-elements/buttons/ButtonPrimary';
import { Input } from '@/frontend/reusable-elements/inputs/Input';
import { Label } from '@/frontend/reusable-elements/labels/Label';
import { DetailCard } from '@/frontend/reusable-components/cards/DetailCard';
import { FloatingAlert, type FloatingAlertMessage } from '@/frontend/reusable-components/alerts/FloatingAlert';
import { KeyRound, LogOut, Save, ShieldCheck, UserRound } from 'lucide-react';
import { ApiKeysManagement } from '@/frontend/components/apikeys/ApiKeysManagement';
import { Loader } from '@/frontend/reusable-elements/loaders/Loader';
import { Navbar } from '@/frontend/reusable-components/layout/Navbar';
import { ButtonDestructive } from '@/frontend/reusable-elements/buttons/ButtonDestructive';
import { clearAllPersistedForms } from '@/hooks/useFormPersistence';
import { useIsNewTheme } from '@/frontend/context/UiThemeContext';
import { ROLE_LABELS } from '@/lib/role-labels';
import { getAvatarColor } from '@/lib/avatar-color';


function SectionTitle({ icon: Icon, children }: { icon: typeof UserRound; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="w-8 h-8 rounded-[10px] bg-white/[0.06] flex items-center justify-center">
        <Icon className="w-4 h-4 text-white/70" />
      </span>
      {children}
    </span>
  );
}

export default function UserProfileSettings() {
  const { data: session } = useSession();
  const isNewTheme = useIsNewTheme();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [alert, setAlert] = useState<FloatingAlertMessage | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSignOut = () => {
    clearAllPersistedForms();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('lastProjectId');
    }
    // Let the form submit naturally to /api/auth/signout
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/profile');
      if (!response.ok) throw new Error('Не удалось загрузить профиль');
      const data = await response.json();
      setFormData({
        name: data.data.name || '',
        email: data.data.email || '',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        title: 'Ошибка загрузки профиля',
        message: err instanceof Error ? err.message : 'Не удалось загрузить профиль',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name }),
      });

      if (!response.ok) {
        throw new Error('Не удалось сохранить профиль');
      }

      setAlert({
        type: 'success',
        title: 'Профиль сохранён',
        message: 'Изменения профиля сохранены.',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        title: 'Ошибка сохранения',
        message: err instanceof Error ? err.message : 'Не удалось сохранить профиль',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword.length < 8) {
      setAlert({
        type: 'error',
        title: 'Слишком короткий пароль',
        message: 'Новый пароль должен быть не короче 8 символов.',
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setAlert({
        type: 'error',
        title: 'Пароли не совпадают',
        message: 'Новый пароль и подтверждение должны совпадать.',
      });
      return;
    }

    setSavingPassword(true);

    try {
      const response = await fetch('/api/users/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error(
          response.status === 400 || response.status === 401
            ? 'Проверьте текущий пароль'
            : 'Не удалось изменить пароль'
        );
      }

      setAlert({
        type: 'success',
        title: 'Пароль изменён',
        message: 'Новый пароль сохранён.',
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setAlert({
        type: 'error',
        title: 'Ошибка смены пароля',
        message: err instanceof Error ? err.message : 'Не удалось изменить пароль',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <Loader fullScreen text="Загрузка профиля..." />;
  }

  const displayName = formData.name || formData.email;
  const roleLabel = ROLE_LABELS[session?.user?.roleName ?? ''] ?? session?.user?.roleName ?? '';

  return (
    <>
      <FloatingAlert alert={alert} onClose={() => setAlert(null)} />

      <Navbar
        brandLabel={null}
        items={[]}
        hideNavbarContainer={true}
        actions={
          // New theme: sign out lives in the sidebar profile block
          isNewTheme ? undefined : (
            <form action="/api/auth/signout" method="POST" onSubmit={handleSignOut}>
              <ButtonDestructive type="submit" size="default" className="px-5">
                <LogOut className="w-4 h-4 mr-2" />
                Выйти
              </ButtonDestructive>
            </form>
          )
        }
      />

      <div className="max-w-5xl mx-auto px-8 pt-2 pb-8">
        {/* Profile header */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-14 h-14 rounded-full text-white flex items-center justify-center text-xl font-bold shrink-0"
            style={{ backgroundColor: getAvatarColor(formData.email || displayName) }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-white truncate">{displayName}</h1>
            <p className="text-sm text-white/55 truncate">
              {formData.email}
              {roleLabel && <span className="text-white/35"> · {roleLabel}</span>}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Profile */}
          <DetailCard title={<SectionTitle icon={UserRound}>Профиль</SectionTitle>} contentClassName="flex-1 flex flex-col">
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4 h-full">
              <div className="space-y-2">
                <Label htmlFor="name">Имя</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  variant="glass"
                  placeholder="Как вас зовут"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  disabled
                  variant="glass"
                  className="disabled:opacity-60 cursor-not-allowed"
                />
                <p className="text-xs text-white/45">Email меняет администратор.</p>
              </div>

              <div className="mt-auto pt-2">
                <ButtonPrimary type="submit" disabled={savingProfile} className="gap-2 w-full">
                  <Save className="w-4 h-4" />
                  {savingProfile ? 'Сохранение...' : 'Сохранить'}
                </ButtonPrimary>
              </div>
            </form>
          </DetailCard>

          {/* Password */}
          <DetailCard title={<SectionTitle icon={ShieldCheck}>Безопасность</SectionTitle>} contentClassName="flex-1 flex flex-col">
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4 h-full">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Текущий пароль</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  variant="glass"
                  placeholder="Введите текущий пароль"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Новый пароль</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    variant="glass"
                    placeholder="Минимум 8 символов"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Повторите пароль</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    variant="glass"
                    placeholder="Ещё раз"
                    required
                  />
                </div>
              </div>

              <div className="mt-auto pt-2">
                <ButtonPrimary type="submit" disabled={savingPassword} className="gap-2 w-full">
                  <KeyRound className="w-4 h-4" />
                  {savingPassword ? 'Сохранение...' : 'Сменить пароль'}
                </ButtonPrimary>
              </div>
            </form>
          </DetailCard>
        </div>

        {/* API keys */}
        <div className="mt-5">
          <DetailCard title={<SectionTitle icon={KeyRound}>API-ключи</SectionTitle>}>
            <ApiKeysManagement />
          </DetailCard>
        </div>
      </div>
    </>
  );
}
