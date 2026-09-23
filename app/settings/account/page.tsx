'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/frontend/reusable-elements/buttons/Button';
import { ButtonPrimary } from '@/frontend/reusable-elements/buttons/ButtonPrimary';
import { ButtonDestructive } from '@/frontend/reusable-elements/buttons/ButtonDestructive';
import { Input } from '@/frontend/reusable-elements/inputs/Input';
import { Label } from '@/frontend/reusable-elements/labels/Label';
import { Alert, AlertDescription } from '@/frontend/reusable-elements/alerts/Alert';
import { GlassPanel } from '@/frontend/reusable-components/layout/GlassPanel';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/frontend/reusable-elements/dialogs/Dialog';
import { Loader } from '@/frontend/reusable-elements/loaders/Loader';
import { SettingsSidebar } from '@/app/components/layout/SettingsSidebar';
import { Key, Copy, Trash2, Eye, EyeOff, Plus, AlertTriangle } from 'lucide-react';

interface AccountStatus {
  isMarkedForDeletion: boolean;
  markedAt: string | null;
  permanentDeleteDate: string | null;
}

interface UserInfo {
  name: string;
  email: string;
  role: string;
}

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export default function AccountSettingsPage() {
  useEffect(() => {
    document.title = 'Настройки аккаунта | EZTest';
  }, []);

  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [newApiKeyExpiresInDays, setNewApiKeyExpiresInDays] = useState<number | undefined>(undefined);
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  // Fetch user info and account status
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, accountResponse] = await Promise.all([
          fetch('/api/users/profile'),
          fetch('/api/users/account'),
        ]);

        if (!userResponse.ok) {
          throw new Error('Не удалось загрузить данные пользователя');
        }
        if (!accountResponse.ok) {
          throw new Error('Не удалось получить статус аккаунта');
        }

        const userData = await userResponse.json();
        const accountData = await accountResponse.json();

        setUserInfo(userData.data);
        setAccountStatus(accountData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить настройки аккаунта');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    setLoadingKeys(true);
    try {
      const response = await fetch('/api/apikeys');
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data || []);
      }
    } catch (err) {
      console.error('Error fetching API keys:', err);
    } finally {
      setLoadingKeys(false);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreatingKey(true);

    try {
      let expiresAt: string | null = null;
      if (newApiKeyExpiresInDays && newApiKeyExpiresInDays > 0) {
        const expiresDate = new Date();
        expiresDate.setDate(expiresDate.getDate() + newApiKeyExpiresInDays);
        expiresAt = expiresDate.toISOString();
      }

      const response = await fetch('/api/apikeys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newApiKeyName,
          expiresAt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create API key');
      }

      const data = await response.json();
      // /api/apikeys returns { key, apiKey }
      setNewKey(data.key);
      setNewApiKeyName('');
      setNewApiKeyExpiresInDays(undefined);
      setShowNewKeyDialog(false);
      await fetchApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать API-ключ');
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeApiKey = async (apiKeyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/apikeys/${apiKeyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to revoke API key');
      }

      setSuccess('API key revoked successfully');
      await fetchApiKeys();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отозвать API-ключ');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('API key copied to clipboard');
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Новый пароль должен быть не короче 8 символов');
      return;
    }

    if (passwordData.newPassword === passwordData.currentPassword) {
      setError('Новый пароль должен отличаться от текущего');
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }

      setSuccess('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setChangePasswordForm(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сменить пароль');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!password.trim()) {
      setError('Введите пароль, чтобы подтвердить удаление аккаунта');
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/users/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }

  await response.json(); // response consumed; no variable needed
      setSuccess('Account deletion initiated. Redirecting to login...');
      setPassword('');
      setShowDeleteDialog(false);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить аккаунт');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <Loader fullScreen text="Загрузка настроек аккаунта..." />;
  }

  return (
    <div className="min-h-screen flex">
      <SettingsSidebar />
      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Аккаунт и безопасность</h1>
          <p className="text-muted-foreground">Пароль, безопасность и удаление аккаунта</p>
        </div>

        {/* User Info Display */}
        {userInfo && (
          <div className="mb-8 p-4 rounded-lg border border-primary/30 bg-primary/5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Вы вошли как</p>
                <h2 className="text-2xl font-bold text-foreground">{userInfo.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{userInfo.email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Роль</p>
                <p className="text-lg font-semibold text-primary">{userInfo.role}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-500/40 bg-green-500/10">
            <AlertDescription className="text-green-300">{success}</AlertDescription>
          </Alert>
        )}

        {/* API Tokens Section */}
        <GlassPanel className="mb-6" contentClassName="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Key className="w-6 h-6" />
                API-ключи
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                API-ключи для программного доступа к EZTest
              </p>
            </div>
            <ButtonPrimary
              onClick={() => {
                setShowNewKeyDialog(true);
                setNewKey(null);
                setShowKey(false);
              }}
              className="rounded-[10px]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Создать API-ключ
            </ButtonPrimary>
          </div>

          {loadingKeys ? (
            <p className="text-muted-foreground text-sm">Загрузка API-ключей...</p>
          ) : apiKeys.length === 0 ? (
            <div className="rounded-lg p-4 border border-primary/30 bg-primary/5">
              <p className="text-muted-foreground text-sm">
                Ключей пока нет.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-primary/30 bg-primary/5"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground">{apiKey.name}</h3>
                      {apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date() && (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                          Истёк
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                      {apiKey.keyPrefix}...
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>
                        Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                      </span>
                      {apiKey.lastUsedAt && (
                        <span>
                          Last used: {new Date(apiKey.lastUsedAt).toLocaleDateString()}
                        </span>
                      )}
                      {apiKey.expiresAt && (
                        <span>
                          Expires: {new Date(apiKey.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <ButtonDestructive
                    onClick={() => handleRevokeApiKey(apiKey.id)}
                    className="rounded-[10px]"
                    variant="ghost"
                  >
                    <Trash2 className="w-4 h-4" />
                  </ButtonDestructive>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>

        {/* Change Password Section */}
        <GlassPanel className="mb-6" contentClassName="p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Пароль</h2>
                <p className="text-muted-foreground text-sm mt-1">Регулярно меняйте пароль для безопасности аккаунта</p>
              </div>
            </div>

            {changePasswordForm ? (
              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div>
                  <Label className="block text-sm font-medium text-muted-foreground mb-2">
                    Текущий пароль
                  </Label>
                  <Input
                    type="password"
                    variant="glass"
                    value={passwordData.currentPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    required
                    placeholder="Введите текущий пароль"
                  />
                </div>

                {/* New Password */}
                <div>
                  <Label className="block text-sm font-medium text-muted-foreground mb-2">
                    Новый пароль
                  </Label>
                  <Input
                    type="password"
                    variant="glass"
                    value={passwordData.newPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    required
                    placeholder="Новый пароль (минимум 8 символов)"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <Label className="block text-sm font-medium text-muted-foreground mb-2">
                    Повторите новый пароль
                  </Label>
                  <Input
                    type="password"
                    variant="glass"
                    value={passwordData.confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    required
                    placeholder="Повторите новый пароль"
                  />
                </div>

                <div className="rounded-lg p-3 text-sm border border-primary/30 bg-primary/5">
                  <p className="font-medium mb-2 text-foreground">Требования к паролю:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Не короче 8 символов</li>
                    <li>Должен отличаться от текущего</li>
                    <li>Оба поля нового пароля должны совпадать</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <ButtonPrimary
                    type="submit"
                    disabled={changingPassword}
                    className="flex-1 rounded-[10px]"
                  >
                    {changingPassword ? 'Changing Password...' : 'Change Password'}
                  </ButtonPrimary>
                  <Button
                    type="button"
                    onClick={() => {
                      setChangePasswordForm(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                    }}
                    variant="glass"
                    className="flex-1 rounded-[10px] cursor-pointer"
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            ) : (
              <ButtonPrimary
                onClick={() => setChangePasswordForm(true)}
                className="rounded-[10px]"
              >
                Сменить пароль
              </ButtonPrimary>
            )}
        </GlassPanel>

        {/* Account Deletion Section */}
  <GlassPanel className="border-red-500/30" contentClassName="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Удалить аккаунт</h2>
              <p className="text-muted-foreground text-sm">
                Безвозвратно удалить аккаунт и все его данные
              </p>
            </div>

            {accountStatus?.isMarkedForDeletion ? (
              <div className="rounded-lg p-4 mb-6 border border-yellow-500/40 bg-yellow-500/10">
                <h3 className="font-medium text-yellow-200 mb-2">Аккаунт помечен на удаление</h3>
                <p className="text-yellow-200/90 text-sm mb-2">
                  Your account is scheduled for permanent deletion on{' '}
                  <strong>
                    {new Date(accountStatus.permanentDeleteDate!).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </strong>
                </p>
                <p className="text-yellow-200/90 text-sm">
                  You have until then to{' '}
                  <button className="font-medium underline underline-offset-2">
                    contact support to restore your account
                  </button>
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-lg p-4 mb-6 border border-red-500/40 bg-red-500/10">
                  <h4 className="font-medium text-red-200 mb-2 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" />Важно</h4>
                  <ul className="text-red-200/90 text-sm space-y-2 list-disc list-inside">
                    <li>Аккаунт будет сразу помечен на удаление</li>
                    <li>У вас будет 30 дней, чтобы восстановить аккаунт</li>
                    <li>Через 30 дней все данные будут удалены безвозвратно</li>
                    <li>Через 30 дней действие станет необратимым</li>
                  </ul>
                </div>

                <ButtonDestructive
                  onClick={() => setShowDeleteDialog(true)}
                  className="rounded-[10px]"
                >
                  Удалить мой аккаунт
                </ButtonDestructive>
              </>
            )}
        </GlassPanel>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link href="/settings/profile" className="text-primary hover:text-primary/90 font-medium">
            К настройкам профиля
          </Link>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Удалить аккаунт?</DialogTitle>
            <DialogDescription>
              This action will mark your account for deletion. You&apos;ll have 30 days to restore it before permanent deletion.
            </DialogDescription>
          </DialogHeader>

          {/* Password Confirmation */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Введите пароль для подтверждения
              </label>
              <input
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                className="w-full px-4 py-2 rounded-[10px] border border-border bg-transparent focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && password.trim()) {
                    handleDeleteAccount();
                  }
                }}
              />
            </div>

            <div className="rounded-lg p-3 text-sm border border-red-500/40 bg-red-500/10 text-red-200">
              Your account will be permanently deleted in 30 days. You won&apos;t be able to log in during this period.
            </div>
          </div>

          <DialogFooter className="justify-end pt-4">
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setPassword('');
                  setError(null);
                }}
                variant="glass"
                className="rounded-[10px] cursor-pointer"
              >
                Отмена
              </Button>
              <ButtonDestructive
                onClick={handleDeleteAccount}
                disabled={deleting || !password.trim()}
                className="rounded-[10px]"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </ButtonDestructive>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create API Token Dialog */}
      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Создать API-ключ</DialogTitle>
            <DialogDescription>
              {newKey
                ? 'Copy your API key now. You won&apos;t be able to see it again!'
                : 'Create a new API key for programmatic access to EZTest'}
            </DialogDescription>
          </DialogHeader>

          {newKey ? (
            <div className="space-y-4">
              <div className="rounded-lg p-4 border border-yellow-500/40 bg-yellow-500/10">
                <p className="text-sm text-yellow-200 mb-2 font-medium">
                  <span className="inline-flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" />Скопируйте ключ сейчас</span>
                </p>
                <p className="text-xs text-yellow-200/90">
                  Полный ключ показывается только один раз — сохраните его в надёжном месте.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Ваш API-ключ</Label>
                <div className="flex gap-2">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    value={newKey}
                    readOnly
                    variant="glass"
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    variant="glass"
                    className="rounded-[10px] cursor-pointer"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => copyToClipboard(newKey)}
                    variant="glass"
                    className="rounded-[10px] cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <ButtonPrimary
                  onClick={() => {
                    setShowNewKeyDialog(false);
                    setNewKey(null);
                    setShowKey(false);
                  }}
                  className="flex-1 rounded-[10px]"
                >
                  Готово
                </ButtonPrimary>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateApiKey} className="space-y-4">
              <div>
                <Label className="block text-sm font-medium text-muted-foreground mb-2">
                  Название ключа
                </Label>
                <Input
                  variant="glass"
                  value={newApiKeyName}
                  onChange={(e) => setNewApiKeyName(e.target.value)}
                  required
                  placeholder="например, CI/CD, локальная разработка"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Дайте ключу понятное название
                </p>
              </div>

              <div>
                <Label className="block text-sm font-medium text-muted-foreground mb-2">
                  Срок действия (необязательно)
                </Label>
                <Input
                  type="number"
                  variant="glass"
                  value={newApiKeyExpiresInDays || ''}
                  onChange={(e) =>
                    setNewApiKeyExpiresInDays(
                      e.target.value ? parseInt(e.target.value, 10) : undefined
                    )
                  }
                  placeholder="Дней (пусто — бессрочно)"
                  min={1}
                  max={3650}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Через сколько дней ключ истечёт (максимум 3650)
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <ButtonPrimary
                  type="submit"
                  disabled={creatingKey || !newApiKeyName.trim()}
                  className="flex-1 rounded-[10px]"
                >
                  {creatingKey ? 'Creating...' : 'Create API Key'}
                </ButtonPrimary>
                <Button
                  type="button"
                  onClick={() => {
                    setShowNewKeyDialog(false);
                    setNewApiKeyName('');
                    setNewApiKeyExpiresInDays(undefined);
                  }}
                  variant="glass"
                  className="flex-1 rounded-[10px] cursor-pointer"
                >
                  Отмена
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
