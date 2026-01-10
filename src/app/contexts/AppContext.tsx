import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  avatar?: string;
  department?: string;
  organizationId?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  dueDate: string;
  createdAt: string;
}

export interface Receipt {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  imageUrl: string;
  tags: string[];
  uploadedBy: string;
  uploadedAt: string;
}

export interface FileDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  category: string;
  metadata?: Record<string, any>;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  phone: string;
  avatar?: string;
  status: 'active' | 'inactive';
}

interface AppContextType {
  user: User | null;
  tasks: Task[];
  receipts: Receipt[];
  files: FileDocument[];
  employees: Employee[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addReceipt: (receipt: Omit<Receipt, 'id' | 'uploadedAt'>) => void;
  deleteReceipt: (id: string) => void;
  addFile: (file: Omit<FileDocument, 'id' | 'uploadedAt'>) => void;
  deleteFile: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock data
const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Fr. Juan Santos',
    email: 'juan.santos@province.ph',
    position: 'Provincial Minister',
    department: 'Administration',
    phone: '+63 912 345 6789',
    status: 'active'
  },
  {
    id: '2',
    name: 'Br. Brendan',
    email: 'brendan@province.ph',
    position: 'Secretary',
    department: 'Administration',
    phone: '+63 912 345 6790',
    status: 'active'
  },
  {
    id: '3',
    name: 'Sr. Maria Cruz',
    email: 'maria.cruz@province.ph',
    position: 'Finance Officer',
    department: 'Finance',
    phone: '+63 912 345 6791',
    status: 'active'
  },
  {
    id: '4',
    name: 'Br. Miguel Torres',
    email: 'miguel.torres@province.ph',
    position: 'Community Coordinator',
    department: 'Community Affairs',
    phone: '+63 912 345 6792',
    status: 'active'
  }
];

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@province.ph',
    role: 'admin',
    department: 'Administration'
  },
  {
    id: '2',
    name: 'Manager User',
    email: 'manager@province.ph',
    role: 'manager',
    department: 'Finance'
  }
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [files, setFiles] = useState<FileDocument[]>([]);
  const [employees] = useState<Employee[]>(mockEmployees);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedTasks = localStorage.getItem('tasks');
    const savedReceipts = localStorage.getItem('receipts');
    const savedFiles = localStorage.getItem('files');

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedReceipts) setReceipts(JSON.parse(savedReceipts));
    if (savedFiles) setFiles(JSON.parse(savedFiles));
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('receipts', JSON.stringify(receipts));
  }, [receipts]);

  useEffect(() => {
    localStorage.setItem('files', JSON.stringify(files));
  }, [files]);

  const login = (email: string, password: string): boolean => {
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser && password === 'password') {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setTasks([...tasks, newTask]);
  };

  const updateTask = (id: string, updatedTask: Partial<Task>) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, ...updatedTask } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const addReceipt = (receipt: Omit<Receipt, 'id' | 'uploadedAt'>) => {
    const newReceipt: Receipt = {
      ...receipt,
      id: Date.now().toString(),
      uploadedAt: new Date().toISOString()
    };
    setReceipts([...receipts, newReceipt]);
  };

  const deleteReceipt = (id: string) => {
    setReceipts(receipts.filter(receipt => receipt.id !== id));
  };

  const addFile = (file: Omit<FileDocument, 'id' | 'uploadedAt'>) => {
    const newFile: FileDocument = {
      ...file,
      id: Date.now().toString(),
      uploadedAt: new Date().toISOString()
    };
    setFiles([...files, newFile]);
  };

  const deleteFile = (id: string) => {
    setFiles(files.filter(file => file.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        tasks,
        receipts,
        files,
        employees,
        login,
        logout,
        addTask,
        updateTask,
        deleteTask,
        addReceipt,
        deleteReceipt,
        addFile,
        deleteFile
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
