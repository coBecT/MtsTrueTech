import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RegisterForm: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Просто переходим на страницу профиля без проверки
    navigate('/profile');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center w-full">
      <h1 className="text-2xl font-bold mb-6 text-mts-text">Создать аккаунт</h1>
      
      <div className="flex gap-4 my-6">
        <a href="#" className="w-11 h-11 rounded-full border border-mts-border flex items-center justify-center text-mts-text transition-all hover:bg-mts-primary hover:border-mts-primary hover:-translate-y-1">
          <i className="fa-brands fa-google-plus-g"></i>
        </a>
        <a href="#" className="w-11 h-11 rounded-full border border-mts-border flex items-center justify-center text-mts-text transition-all hover:bg-mts-primary hover:border-mts-primary hover:-translate-y-1">
          <i className="fa-brands fa-vk"></i>
        </a>
        <a href="#" className="w-11 h-11 rounded-full border border-mts-border flex items-center justify-center text-mts-text transition-all hover:bg-mts-primary hover:border-mts-primary hover:-translate-y-1">
          <i className="fa-brands fa-linkedin-in"></i>
        </a>
      </div>
      
      <span className="text-sm text-mts-text-secondary mb-4">или используйте почту для регистрации</span>
      
      <input
        type="text"
        placeholder="Имя"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="w-full bg-mts-bg-dark border border-mts-border rounded-lg p-4 my-3 text-mts-text focus:border-mts-primary focus:outline-none focus:ring-2 focus:ring-mts-primary/20 transition-all"
      />
      
      <input
        type="text"
        placeholder="Фамилия"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        className="w-full bg-mts-bg-dark border border-mts-border rounded-lg p-4 my-3 text-mts-text focus:border-mts-primary focus:outline-none focus:ring-2 focus:ring-mts-primary/20 transition-all"
      />
      
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full bg-mts-bg-dark border border-mts-border rounded-lg p-4 my-3 text-mts-text focus:border-mts-primary focus:outline-none focus:ring-2 focus:ring-mts-primary/20 transition-all"
      />
      
      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full bg-mts-bg-dark border border-mts-border rounded-lg p-4 my-3 text-mts-text focus:border-mts-primary focus:outline-none focus:ring-2 focus:ring-mts-primary/20 transition-all"
      />
      
      <input
        type="password"
        placeholder="Повторите пароль"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="w-full bg-mts-bg-dark border border-mts-border rounded-lg p-4 my-3 text-mts-text focus:border-mts-primary focus:outline-none focus:ring-2 focus:ring-mts-primary/20 transition-all"
      />
      
      <button 
        type="submit"
        className="w-full bg-mts-primary text-mts-text font-semibold py-4 px-12 rounded-lg uppercase tracking-wider hover:bg-mts-primary-dark transform hover:-translate-y-0.5 transition-all mt-5"
      >
        Зарегистрироваться
      </button>
    </form>
  );
};

export default RegisterForm;