import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Column, ColumnSettings } from '../types/column';

interface ColumnContextType {
  columns: Column[];
  addColumn: (column: Omit<Column, 'id'>) => void;
  removeColumn: (id: string) => void;
  moveColumn: (fromIndex: number, toIndex: number) => void;
}

const ColumnContext = createContext<ColumnContextType | undefined>(undefined);

const STORAGE_KEY = 'mastofy-columns';

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function ColumnProvider({ children }: { children: ReactNode }) {
  const [columns, setColumns] = useState<Column[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [
      { id: generateId(), type: 'home', title: 'Home' },
      { id: generateId(), type: 'notifications', title: 'Notifications' },
    ];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
  }, [columns]);

  const addColumn = (column: Omit<Column, 'id'>) => {
    setColumns(prev => [...prev, { ...column, id: generateId() }]);
  };

  const removeColumn = (id: string) => {
    setColumns(prev => prev.filter(column => column.id !== id));
  };

  const moveColumn = (fromIndex: number, toIndex: number) => {
    setColumns(prev => {
      const newColumns = [...prev];
      const [removed] = newColumns.splice(fromIndex, 1);
      newColumns.splice(toIndex, 0, removed);
      return newColumns;
    });
  };

  return (
    <ColumnContext.Provider value={{ columns, addColumn, removeColumn, moveColumn }}>
      {children}
    </ColumnContext.Provider>
  );
}

export function useColumns() {
  const context = useContext(ColumnContext);
  if (context === undefined) {
    throw new Error('useColumns must be used within a ColumnProvider');
  }
  return context;
}