
import React from 'react';
import { Loader2 } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { MainLayout } from './layouts/MainLayout';

const AppContent = () => {
  const { isDataLoaded } = useData();
  const { showNotification } = useNotification();

  if (!isDataLoaded) {
      return (
          <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
              <p className="text-emerald-400 font-black text-xs uppercase tracking-widest">Iniciando Ecosistema...</p>
          </div>
      );
  }

  return (
    <MainLayout onShowNotification={showNotification} />
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <DataProvider>
             <AppContent />
          </DataProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
