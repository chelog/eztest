import UserProfileSettings from '../../frontend/components/profile/UserProfileSettings';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Настройки аккаунта',
  description: 'Настройки аккаунта и безопасности',
};

const ProfilePage = () => {
  return <UserProfileSettings />;
};

export default ProfilePage;
