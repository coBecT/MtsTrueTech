import React from 'react';

interface TogglePanelProps {
  isActive: boolean;
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

const TogglePanel: React.FC<TogglePanelProps> = ({ isActive, onLoginClick, onRegisterClick }) => {
  return (
    <div className="absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-all duration-600 ease-in-out rounded-r-2xl z-10 md:block hidden">
      <div className={`bg-gradient-to-r from-mts-primary to-mts-secondary h-full text-mts-text relative ${isActive ? 'translate-x-[-100%]' : 'translate-x-0'} w-[200%] transition-all duration-600 ease-in-out`}>
        
        {/* Left Panel (Shows when active) */}
        <div className={`absolute w-1/2 h-full flex items-center justify-center flex-col p-12 text-center transition-all duration-600 ease-in-out ${isActive ? 'translate-x-0' : 'translate-x-[-200%]'}`}>
          <h1 className="text-2xl font-bold mb-4">Добро пожаловать!</h1>
          <p className="mb-8">Введите свои данные для входа</p>
          <button 
            onClick={onLoginClick}
            className="bg-transparent border-2 border-white py-4 px-12 rounded-lg font-semibold uppercase tracking-wider hover:bg-white/10 transition-all"
          >
            Войти
          </button>
        </div>
        
        {/* Right Panel (Shows when not active) */}
        <div className={`absolute right-0 w-1/2 h-full flex items-center justify-center flex-col p-12 text-center transition-all duration-600 ease-in-out ${isActive ? 'translate-x-[200%]' : 'translate-x-0'}`}>
          <h1 className="text-2xl font-bold mb-4">Привет!</h1>
          <p className="mb-8">Зарегистрируйтесь, чтобы получить доступ</p>
          <button 
            onClick={onRegisterClick}
            className="bg-transparent border-2 border-white py-4 px-12 rounded-lg font-semibold uppercase tracking-wider hover:bg-white/10 transition-all"
          >
            Зарегистрироваться
          </button>
        </div>
      </div>
    </div>
  );
};

export default TogglePanel;