import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface DashboardContextType {
  refreshTrigger: number;
  triggerDashboardRefresh: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerDashboardRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <DashboardContext.Provider value={{ refreshTrigger, triggerDashboardRefresh }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}; 