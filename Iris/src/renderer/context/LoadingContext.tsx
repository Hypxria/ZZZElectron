// src/renderer/context/LoadingContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  progress: number;
  message: string;
  showLoading: (message?: string) => void;
  updateLoading: (progress: number, message?: string) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  progress: 0,
  message: '',
  showLoading: () => {},
  updateLoading: () => {},
  hideLoading: () => {},
});

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Listen for loading updates from main process
    const removeListener = window.loading.onLoadingUpdate((newProgress, newMessage) => {
      setProgress(newProgress);
      if (newMessage) setMessage(newMessage);
      setIsLoading(newProgress < 100);
    });

    return () => {
      if (removeListener) removeListener();
    };
  }, []);

  const showLoading = (msg = 'Loading...') => {
    setIsLoading(true);
    setProgress(0);
    setMessage(msg);
    window.loading.showLoading(msg);
  };

  const updateLoading = (newProgress: number, msg?: string) => {
    setProgress(newProgress);
    if (msg) setMessage(msg);
    window.loading.updateLoading(newProgress, msg);
  };

  const hideLoading = () => {
    setIsLoading(false);
    window.loading.hideLoading();
  };

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        progress,
        message,
        showLoading,
        updateLoading,
        hideLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};
