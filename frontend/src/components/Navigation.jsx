import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiPlus, FiImage, FiCalendar, FiLogOut } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const navItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: FiHome,
      description: 'Overview & Stats'
    },
    { 
      path: '/add-trade', 
      label: 'Add Trade', 
      icon: FiPlus,
      description: 'Record New Trade'
    },
    { 
      path: '/gallery', 
      label: 'Gallery', 
      icon: FiImage,
      description: 'Trade Screenshots'
    },
    { 
      path: '/calendar', 
      label: 'Calendar', 
      icon: FiCalendar,
      description: 'Trading Timeline'
    },
  ];

  const isActivePath = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">TL</span>
            </div>
            <div>
              <h1 className="text-lg font-bold font-heading text-white">TradeLogix</h1>
              <p className="text-xs text-muted-foreground font-medium">Trading Journal</p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'text-muted-foreground hover:text-white hover:bg-muted/50'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-semibold">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`
                    p-2 rounded-lg transition-all duration-200 cursor-pointer
                    ${isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-white hover:bg-muted/50'
                    }
                  `}
                  title={item.label}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </div>

          {/* Logout Button */}
          <Button 
            onClick={logout} 
            variant="ghost" 
            size="sm"
            className="text-muted-foreground hover:text-white"
          >
            <FiLogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>

        {/* Mobile Description */}
        <div className="md:hidden mt-3">
          {navItems.map((item) => {
            if (isActivePath(item.path)) {
              return (
                <p key={item.path} className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              );
            }
            return null;
          })}
        </div>
      </div>
    </nav>
  );
} 