import React, { createContext, useContext, useState, useEffect } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Отклонение в эксперименте',
      message: 'Обнаружено значительное отклонение в эксперименте "Влияние температуры на скорость реакции"',
      type: 'warning',
      timestamp: new Date(),
      read: false
    },
    {
      id: '2',
      title: 'Приближается срок завершения',
      message: 'Через 3 дня заканчивается срок эксперимента "Оптимизация синтеза полимерных нанокапсул"',
      type: 'info',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: true
    }
  ]);
  
  const unreadCount = notifications.filter(notif => !notif.read).length;
  
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };
  
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };
  
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };
  
  const removeNotification = (id: string) => {
    setNotifications(prev =>
      prev.filter(notif => notif.id !== id)
    );
  };
  
  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};