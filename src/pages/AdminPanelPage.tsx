import React from 'react';
import { AdminDashboardPage } from './admin/AdminDashboardPage';

interface AdminPanelPageProps {
  onNavigate: (route: string) => void;
}

export const AdminPanelPage: React.FC<AdminPanelPageProps> = ({ onNavigate }) => {
  return <AdminDashboardPage onLogout={() => onNavigate('/')} />;
};
