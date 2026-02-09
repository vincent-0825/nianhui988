import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Coins, User as UserIcon, Shield, ArrowRight, RefreshCw } from 'lucide-react';
import { userStorage, sessionStorage, getOrCreateDeviceId } from '@/services/storage';
import type { User } from '@/types';

interface LoginProps {
  onLogin: (user: { id: string; name: string; coins: number; isAdmin: boolean }) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [name, setName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [boundUser, setBoundUser] = useState<User | null>(null);
  const [showSwitchAccount, setShowSwitchAccount] = useState(false);

  // 检查设备绑定状态
  useEffect(() => {
    const deviceId = getOrCreateDeviceId();
    const existingUser = userStorage.getByDeviceId(deviceId);
    const currentUser = sessionStorage.getCurrentUser();
    const isAdmin = sessionStorage.isAdmin();

    if (currentUser) {
      onLogin({ ...currentUser, isAdmin });
    } else if (existingUser) {
      // 设备已绑定用户，显示关联用户信息，但不自动登录
      setBoundUser(existingUser);
      setIsLoading(false);
    } else {
      // 新设备，需要输入姓名
      setIsLoading(false);
    }
  }, [onLogin]);

  const handleUserLogin = () => {
    if (!name.trim()) {
      setError('请输入姓名');
      return;
    }

    const user = userStorage.create(name.trim());
    sessionStorage.setCurrentUser(user);
    sessionStorage.setAdmin(false);
    onLogin({ ...user, isAdmin: false });
  };

  const handleBoundUserLogin = () => {
    if (boundUser) {
      sessionStorage.setCurrentUser(boundUser);
      sessionStorage.setAdmin(false);
      onLogin({ ...boundUser, isAdmin: false });
    }
  };

  const handleSwitchAccount = () => {
    setShowSwitchAccount(true);
    setBoundUser(null);
    setError('');
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') {
      sessionStorage.setAdmin(true);
      onLogin({ id: 'admin', name: '管理员', coins: 0, isAdmin: true });
    } else {
      setError('密码错误');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-500 to-cyan-400 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-500 to-cyan-400 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
            <Coins className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            年会押注系统
          </CardTitle>
          <CardDescription>
            {isAdminMode ? '管理员登录' : '员工登录'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isAdminMode ? (
            <>
              {/* 已绑定用户 - 显示快速登录 */}
              {boundUser && !showSwitchAccount ? (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-white">
                        {boundUser.name.charAt(0)}
                      </span>
                    </div>
                    <p className="text-lg font-medium text-gray-800">{boundUser.name}</p>
                    <p className="text-sm text-gray-500">欢迎回来！</p>
                  </div>
                  
                  <Button 
                    onClick={handleBoundUserLogin}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    直接登录
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={handleSwitchAccount}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    切换账号
                  </Button>
                </div>
              ) : (
                /* 新用户或切换账号 - 显示输入框 */
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">姓名</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="name"
                        placeholder="请输入您的姓名"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUserLogin()}
                        className="pl-10"
                        autoFocus
                      />
                    </div>
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <Button 
                    onClick={handleUserLogin} 
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
                  >
                    登录
                  </Button>
                  
                  {/* 返回已绑定账号 */}
                  {boundUser && showSwitchAccount && (
                    <Button 
                      variant="ghost"
                      onClick={() => setShowSwitchAccount(false)}
                      className="w-full text-gray-500"
                    >
                      返回 {boundUser.name} 的登录
                    </Button>
                  )}
                </>
              )}
              
              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    setIsAdminMode(true);
                    setError('');
                  }}
                  className="text-sm text-gray-500 hover:text-purple-600 flex items-center justify-center gap-1 mx-auto"
                >
                  <Shield className="w-4 h-4" />
                  管理员入口
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="adminPassword">管理员密码</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="请输入管理员密码"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-400">默认密码: admin123</p>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button 
                onClick={handleAdminLogin} 
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                管理员登录
              </Button>
              <div className="text-center">
                <button
                  onClick={() => {
                    setIsAdminMode(false);
                    setError('');
                    setAdminPassword('');
                  }}
                  className="text-sm text-gray-500 hover:text-purple-600"
                >
                  返回员工登录
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
