'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/frontend/reusable-elements/buttons/Button';
import { ButtonPrimary } from '@/frontend/reusable-elements/buttons/ButtonPrimary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/reusable-elements/cards/Card';
import { Badge } from '@/frontend/reusable-elements/badges/Badge';
import { TopBar } from '@/frontend/reusable-components/layout/TopBar';
import { Mail, Calendar, Briefcase } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/role-labels';
import { getAvatarColor } from '@/lib/avatar-color';


interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  phone?: string;
  location?: string;
  avatar?: string;
  role: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error('Пользователь не найден');
        }
        const data = await response.json();
        setUser(data.data);
        document.title = `${data.data.name} - Profile | EZTest`;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить профиль');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050608]">
        <TopBar breadcrumbs={[{ label: 'Профиль' }]} />
        <div className="max-w-4xl mx-auto px-8 pt-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-muted-foreground">Загрузка профиля...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-[#050608]">
        <TopBar breadcrumbs={[{ label: 'Профиль' }]} />
        <div className="max-w-4xl mx-auto px-8 pt-8">
          <Card variant="glass">
            <CardContent className="p-8 text-center">
              <p className="text-lg text-white/70 mb-4">{error || 'Пользователь не найден'}</p>
              <ButtonPrimary onClick={() => router.back()}>
                Назад
              </ButtonPrimary>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050608]">
      <TopBar
        breadcrumbs={[
          { label: 'Пользователи' },
          { label: user.name },
        ]}
      />

      <div className="max-w-4xl mx-auto px-8 pt-8 pb-8">
        {/* Profile Header Card */}
        <Card variant="glass" className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div
                  className="w-32 h-32 rounded-full flex items-center justify-center text-5xl font-bold text-white"
                  style={{ backgroundColor: getAvatarColor(user.email || user.name) }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="mb-4">
                  <h1 className="text-4xl font-bold text-white mb-2">{user.name}</h1>
                  <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                    <Briefcase className="w-3 h-3 mr-1" />
                    {ROLE_LABELS[user.role.name] ?? user.role.name}
                  </Badge>
                </div>

                <div className="space-y-2 text-white/70">
                  {user.email && (
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <Mail className="w-4 h-4 text-primary" />
                      <a href={`mailto:${user.email}`} className="hover:text-white transition-colors">
                        {user.email}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 justify-center md:justify-start text-sm">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>В системе с {new Date(user.createdAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Информация</CardTitle>
            <CardDescription className="text-white/70">
              Основные данные аккаунта
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-white/60 mb-1">Имя</div>
                <div className="text-lg font-medium text-white">{user.name}</div>
              </div>
              <div>
                <div className="text-sm text-white/60 mb-1">Email</div>
                <div className="text-lg font-medium text-white">{user.email}</div>
              </div>
              <div>
                <div className="text-sm text-white/60 mb-1">Роль</div>
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                  {ROLE_LABELS[user.role.name] ?? user.role.name}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-white/60 mb-1">В системе с</div>
                <div className="text-lg font-medium text-white">
                  {new Date(user.createdAt).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Button onClick={() => router.back()} variant="glass">
            Назад
          </Button>
        </div>
      </div>
    </div>
  );
}
