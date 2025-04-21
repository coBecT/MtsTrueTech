import React from 'react';
import { User } from '../../types';
import { Pencil } from 'lucide-react';

interface ProfileContentProps {
  user: User;
}

const ProfileContent: React.FC<ProfileContentProps> = ({ user }) => {
  return (
    <div className="px-6 py-6 -mt-10">
      {/* Main Information Section */}
      <div className="bg-mts-bg-light rounded-2xl p-5 mb-6 shadow-lg">
        <h2 className="text-lg font-bold text-mts-text mb-5 flex items-center">
          <span className="block w-1 h-4 bg-mts-secondary rounded mr-3"></span>
          Основная информация
        </h2>
        
        <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
          {user.birthDate && (
            <div className="mb-3">
              <div className="text-sm text-mts-text-secondary mb-1.5">Дата рождения</div>
              <div className="text-base font-medium">{user.birthDate}</div>
            </div>
          )}
          
          {user.city && (
            <div className="mb-3">
              <div className="text-sm text-mts-text-secondary mb-1.5">Город</div>
              <div className="text-base font-medium">{user.city}</div>
            </div>
          )}
          
          {user.education && (
            <div className="mb-3">
              <div className="text-sm text-mts-text-secondary mb-1.5">Образование</div>
              <div className="text-base font-medium">{user.education}</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Edit Button */}
      <button className="flex items-center justify-center w-full py-4 bg-gradient-to-r from-mts-primary to-mts-primary-dark border-none rounded-xl text-white text-base font-semibold cursor-pointer transition-all hover:from-mts-primary-dark hover:to-mts-primary hover:-translate-y-0.5 shadow-lg">
        <Pencil size={16} className="mr-2" />
        Редактировать профиль
      </button>
    </div>
  );
};

export default ProfileContent;