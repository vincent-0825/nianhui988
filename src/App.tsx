import { useState, useEffect } from 'react';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import BetDetail from '@/pages/BetDetail';
import Admin from '@/pages/Admin';
import { sessionStorage } from '@/services/storage';
import './App.css';

type Page = 'login' | 'home' | 'bet' | 'admin';

interface User {
  id: string;
  name: string;
  coins: number;
  isAdmin: boolean;
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [user, setUser] = useState<User | null>(null);
  const [pageParams, setPageParams] = useState<any>(null);

  // 检查是否已登录
  useEffect(() => {
    const currentUser = sessionStorage.getCurrentUser();
    const isAdmin = sessionStorage.isAdmin();
    if (currentUser) {
      setUser({ ...currentUser, isAdmin });
      setCurrentPage('home');
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    if (loggedInUser.isAdmin) {
      setCurrentPage('admin');
    } else {
      setCurrentPage('home');
    }
  };

  const handleLogout = () => {
    sessionStorage.logout();
    setUser(null);
    setCurrentPage('login');
  };

  const handleNavigate = (page: string, params?: any) => {
    setPageParams(params);
    setCurrentPage(page as Page);
  };

  const handleUpdateUser = (updatedUser: any) => {
    if (user) {
      setUser({ ...user, coins: updatedUser.coins });
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login onLogin={handleLogin} />;
      case 'home':
        if (!user) return <Login onLogin={handleLogin} />;
        return (
          <Home
            user={user}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
          />
        );
      case 'bet':
        if (!user) return <Login onLogin={handleLogin} />;
        return (
          <BetDetail
            user={user}
            themeId={pageParams?.themeId}
            onBack={() => setCurrentPage('home')}
            onUpdateUser={handleUpdateUser}
          />
        );
      case 'admin':
        if (!user?.isAdmin) return <Login onLogin={handleLogin} />;
        return <Admin onBack={() => setCurrentPage('home')} />;
      default:
        return <Login onLogin={handleLogin} />;
    }
  };

  return (
    <div className="app">
      {renderPage()}
    </div>
  );
}

export default App;
