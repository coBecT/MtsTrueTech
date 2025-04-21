import React, { useState } from 'react';
import LoginForm from '../components/Login/LoginForm';
import RegisterForm from '../components/Login/RegisterForm';

const LoginPage: React.FC = () => {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="relative w-full max-w-[900px] min-h-[600px] bg-gray-800 text-white rounded-2xl shadow-lg overflow-hidden">
        {/* Forms container */}
        <div
          className="absolute top-0 left-0 w-full h-full flex transition-transform duration-700"
          style={{ transform: isActive ? 'translateX(-50%)' : 'translateX(0%)' }}
        >
          {/* Login */}
          <div className="w-full md:w-1/2 flex items-center justify-center p-8">
            <LoginForm />
          </div>

          {/* Register */}
          <div className="w-1/2 flex items-center justify-center p-8">
            <RegisterForm />
          </div>
        </div>

        {/* Toggle Panel */}
        <div className="hidden md:block absolute top-0 right-0 w-1/2 h-full z-10 transition-transform duration-700"
             style={{ transform: isActive ? 'translateX(100%)' : 'translateX(0%)' }}>
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-700 to-pink-600 text-white p-12 text-center">
            {isActive ? (
              <div>
                <h2 className="text-2xl font-bold mb-4">Уже есть аккаунт?</h2>
                <button
                  onClick={() => setIsActive(false)}
                  className="mt-4 border border-white px-6 py-2 rounded hover:bg-white/20 transition"
                >
                  Войти
                </button>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-4">Нет аккаунта?</h2>
                <button
                  onClick={() => setIsActive(true)}
                  className="mt-4 border border-white px-6 py-2 rounded hover:bg-white/20 transition"
                >
                  Зарегистрироваться
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden absolute bottom-6 left-0 w-full flex justify-center z-20">
          {isActive ? (
            <button
              onClick={() => setIsActive(false)}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
            >
              Уже есть аккаунт? Войти
            </button>
          ) : (
            <button
              onClick={() => setIsActive(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
            >
              Нет аккаунта? Зарегистрироваться
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
