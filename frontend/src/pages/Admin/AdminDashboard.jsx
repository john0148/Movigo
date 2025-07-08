import React, { useState } from 'react';
import UserManagement from './UserManagement';
import MovieManagement from './MovieManagement';
import '../../styles/Admin/AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="admin-container">
      <div className="admin-sidebar">
        <button onClick={() => setActiveTab('users')} className={activeTab === 'users' ? 'active' : ''}>
          👤 Quản lý User
        </button>
        <button onClick={() => setActiveTab('movies')} className={activeTab === 'movies' ? 'active' : ''}>
          🎬 Quản lý Phim
        </button>
      </div>
      <div className="admin-main">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'movies' && <MovieManagement />}
      </div>
    </div>
  );
};

export default AdminDashboard;
