'use client';

import { useState, useEffect } from 'react';
import { ButtonPrimary } from '@/frontend/reusable-elements/buttons/ButtonPrimary';
import { Alert, AlertDescription } from '@/frontend/reusable-elements/alerts/Alert';
import { Loader } from '@/frontend/reusable-elements/loaders/Loader';
import { CreateApiKeyDialog } from './subcomponents/CreateApiKeyDialog';
import { DeleteApiKeyDialog } from './subcomponents/DeleteApiKeyDialog';
import { Key, Copy, Check, Trash2, AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/frontend/reusable-elements/buttons/Button';
import { usePermissions } from '@/hooks/usePermissions';

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  projectId: string | null;
  project?: {
    id: string;
    name: string;
    key: string;
  } | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  updatedAt: string;
}

interface ApiKeysManagementProps {
  className?: string;
}

export function ApiKeysManagement({ className }: ApiKeysManagementProps) {
  const { hasPermission: hasPermissionCheck } = usePermissions();
  // Only users with create/update permissions can create API keys
  const canCreateApiKey = 
    hasPermissionCheck('testcases:create') || 
    hasPermissionCheck('testcases:update') ||
    hasPermissionCheck('testruns:create') ||
    hasPermissionCheck('testruns:update') ||
    hasPermissionCheck('projects:update') ||
    hasPermissionCheck('projects:create');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdApiKey, setCreatedApiKey] = useState<{ key: string; apiKey: ApiKey } | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [apiKeyToDelete, setApiKeyToDelete] = useState<ApiKey | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/apikeys');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Не удалось загрузить API-ключи');
      }

      const data = await response.json();
      // Handle different response formats
      // The route might return { data: [...] } or the array directly
      const apiKeysArray = Array.isArray(data) ? data : (data?.data || []);
      // Filter out inactive/deleted API keys
      const activeKeys = apiKeysArray.filter((key: ApiKey) => key.isActive);
      setApiKeys(activeKeys);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить API-ключи');
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeyCreated = (newApiKey: { key: string; apiKey: ApiKey }) => {
    // Store the created key to show it until user clicks hide
    setCreatedApiKey(newApiKey);
    setSuccess(null); // Clear any previous success message
    
    // Refresh the list
    fetchApiKeys();
    setCreateDialogOpen(false);
  };

  const handleHideApiKey = () => {
    setCreatedApiKey(null);
    setSuccess('Ключ скрыт. Он больше не будет показан — убедитесь, что сохранили его.');
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleApiKeyDeleted = (apiKeyId: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== apiKeyId));
    setDeleteDialogOpen(false);
    setApiKeyToDelete(null);
    setSuccess('Ключ удалён');
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleDeleteClick = (apiKey: ApiKey) => {
    setApiKeyToDelete(apiKey);
    setDeleteDialogOpen(true);
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKeyId(keyId);
      setTimeout(() => setCopiedKeyId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };


  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return <Loader text="Загрузка API-ключей..." />;
  }

  const statusOf = (apiKey: ApiKey) =>
    !apiKey.isActive
      ? { label: 'Отключён', className: 'text-red-400' }
      : isExpired(apiKey.expiresAt)
        ? { label: 'Истёк', className: 'text-orange-400' }
        : { label: 'Активен', className: 'text-emerald-400' };

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <p className="text-sm text-white/50">
            Для доступа к API и SDK. Полный ключ показывается один раз — при создании.
          </p>
          {canCreateApiKey && (
            <ButtonPrimary onClick={() => setCreateDialogOpen(true)} size="sm">
              <Plus className="w-4 h-4" />
              Новый ключ
            </ButtonPrimary>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500/40 bg-green-500/10">
            <AlertDescription className="text-green-300">{success}</AlertDescription>
          </Alert>
        )}

        {createdApiKey && (
          <div className="rounded-[12px] border border-yellow-500/30 bg-yellow-500/[0.07] p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-yellow-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Сохраните ключ сейчас — больше он показан не будет
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 min-w-0 truncate px-3 py-2 rounded-[10px] bg-black/30 font-mono text-sm text-yellow-100">
                {createdApiKey.key}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(createdApiKey.key, 'created-key')}
                title="Скопировать ключ"
              >
                {copiedKeyId === 'created-key' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleHideApiKey}>
                Скрыть
              </Button>
            </div>
          </div>
        )}

        {apiKeys.length === 0 ? (
          <div className="flex items-center gap-3 rounded-[12px] bg-white/[0.03] px-4 py-3.5 text-sm text-white/50">
            <Key className="w-4 h-4 shrink-0 text-white/35" />
            {canCreateApiKey
              ? 'Ключей пока нет.'
              : 'Ключей нет. Чтобы получить ключ, обратитесь к администратору.'}
          </div>
        ) : (
          <div className="space-y-1.5">
            {apiKeys.map((apiKey) => {
              const status = statusOf(apiKey);
              return (
                <div
                  key={apiKey.id}
                  className="flex items-center gap-4 rounded-[12px] bg-white/[0.03] hover:bg-white/[0.05] px-4 py-3 transition-colors"
                >
                  <Key className="w-4 h-4 shrink-0 text-white/35" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">{apiKey.name}</span>
                      <span className={`text-xs ${status.className}`}>● {status.label}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-white/45">
                      <code className="font-mono">{apiKey.keyPrefix}…</code>
                      {apiKey.project && <span>Проект: {apiKey.project.name}</span>}
                      <span>Создан {formatDate(apiKey.createdAt)}</span>
                      <span>{apiKey.expiresAt ? `До ${formatDate(apiKey.expiresAt)}` : 'Бессрочный'}</span>
                      {apiKey.lastUsedAt && <span>Использован {formatDate(apiKey.lastUsedAt)}</span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(apiKey)}
                    className="text-white/40 hover:text-red-400"
                    title="Удалить ключ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateApiKeyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onApiKeyCreated={handleApiKeyCreated}
      />

      {apiKeyToDelete && (
        <DeleteApiKeyDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          apiKey={apiKeyToDelete}
          onApiKeyDeleted={handleApiKeyDeleted}
        />
      )}
    </div>
  );
}

