import React from 'react';
import { User } from '../../types';
import { Phone } from 'lucide-react';
import defaultAvatar from '../../assets/img/Avatar.png';

interface ProfileHeaderProps {
  user: User;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  return (
    <div className="relative">
      {/* Cover Photo */}
      <div className="h-44 bg-gradient-to-r from-mts-primary to-mts-primary-dark"></div>
      
      {/* Profile Info Section */}
      <div className="flex px-6 -mt-16 relative z-10 md:flex-row flex-col">
        {/* Avatar Section */}
        <div className="md:mr-6">
          <div className="relative w-36 h-36 rounded-2xl border-4 border-mts-bg-dark bg-mts-bg-light shadow-lg overflow-hidden">
            <img 
              src={defaultAvatar} 
              alt="Аватар" 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 right-0 bg-mts-secondary w-9 h-9 rounded-tl-none rounded-tr-none rounded-bl-2xl rounded-br-2xl flex items-center justify-center cursor-pointer transition-all hover:bg-pink-600 hover:w-10 hover:h-10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.12 5.12L18.87 8.87L20.71 7.04ZM3 17.25V21H6.75L17.81 9.93L14.06 6.18L3 17.25Z" fill="white"/>
              </svg>
            </div>
          </div>
        </div>
        
        {/* User Info */}
        <div className="flex-1 pt-5 md:mt-0 mt-4">
          <h1 className="text-2xl font-bold text-mts-text mb-2">{user.name}</h1>
          <div className="text-mts-secondary text-base font-medium mb-6">{user.position}</div>
          
          {/* Contacts */}
          <div className="mt-4">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-xl mr-4 flex items-center justify-center bg-gradient-to-r from-mts-primary to-mts-primary-dark">
                <Phone size={18} color="white" />
              </div>
              <div>
                <div className="text-sm text-mts-text-secondary mb-1">Телефон</div>
                <div className="text-base font-medium">{user.phone}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;