import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, Edit, Zap, Target, User, Moon, Sun, LogOut, LogIn, MessageCircle, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NavbarProps {
  currentPage?: 'home' | 'resume-editor' | 'quick-update' | 'dashboard' | 'profile' | 'career-mate';
}

export default function Navbar({ currentPage = 'home' }: NavbarProps) {
  const [, setLocation] = useLocation();
  const { user, signOut } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
      return localStorage.getItem('theme') as 'light' | 'dark';
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleSignOut = async () => {
    await signOut();
    setLocation('/');
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setLocation('/')}>
            <FileText className="text-primary text-xl" />
            <h1 className="text-xl font-bold">SkillMatch Resume Maker</h1>
          </div>
          <nav className="flex space-x-1">
            <Button
              variant={currentPage === 'home' ? 'default' : 'ghost'}
              onClick={() => setLocation('/')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button
              variant={currentPage === 'resume-editor' ? 'default' : 'ghost'}
              onClick={() => setLocation('/resume-editor')}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Resume
            </Button>
            <Button
              variant={currentPage === 'quick-update' ? 'default' : 'ghost'}
              onClick={() => setLocation('/quick-update')}
            >
              <Zap className="h-4 w-4 mr-2" />
              Quick Update
            </Button>
            <Button
              variant={currentPage === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => setLocation('/dashboard')}
            >
              <Target className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={currentPage === 'profile' ? 'default' : 'ghost'}
              onClick={() => setLocation('/profile')}
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <Button
              variant={currentPage === 'career-mate' ? 'default' : 'ghost'}
              onClick={() => setLocation('/career-mate')}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Career Mate
            </Button>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-medium">
                    {user.email?.split('@')[0] || 'User'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.user_metadata?.provider === 'google' ? 'Google Account' : 'Email Account'}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation('/dashboard')}>
                  <Target className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation('/privacy-policy')}>
                  <Shield className="mr-2 h-4 w-4" />
                  Privacy Policy
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={() => setLocation('/login')}>
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
              <Button onClick={() => setLocation('/register')}>
                Register
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

