import React from 'react';
import { User } from '../../types';
import ProfileHeader from './ProfileHeader';
import ProfileContent from './ProfileContent';

// Mock user data
const mockUser: User = {
  id: '1',
  name: 'Иванов Иван Иванович',
  position: 'Старший разработчик',
  phone: '+7 (XXX) XXX-XX-XX',
  avatar: '/img/avatar.png', // Updated path to use the public directory
  birthDate: '15 марта 1992',
  city: 'Москва',
  education: 'МГУ, 2014'
};

const Profile: React.FC = () => {
  return (
    <div className="mts-profile max-w-2xl mx-auto bg-mts-bg-dark min-h-screen">
      <ProfileHeader user={mockUser} />
      <ProfileContent user={mockUser} />
    </div>
  );
};

export default Profile;