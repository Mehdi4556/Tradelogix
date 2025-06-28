import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiPlus, FiImage, FiCalendar, FiLogOut } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import LogoutModal from '@/components/LogoutModal';
import { createPortal } from 'react-dom';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutModal(false);
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  return (
    <>
      <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <motion.div 
              className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center"
                          whileHover={{ rotate: 360 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <span className="text-primary-foreground font-bold text-sm">TL</span>
            </motion.div>
            <div>
              <h1 className="text-lg font-bold font-heading text-white">TradeLogix</h1>
              <p className="text-xs text-muted-foreground font-medium">Trading Journal</p>
            </div>
          </motion.div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              
              return (
                <motion.button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer
                    ${isActive 
                      ? 'text-white' 
                      : 'text-muted-foreground hover:text-white'
                    }
                  `}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -2 
                  }}
                  whileTap={{ 
                    scale: 0.95,
                    y: 0 
                  }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: index * 0.03,
                    type: "spring",
                    stiffness: 400,
                    damping: 17
                  }}
                >
                  {/* Active Background */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 bg-primary rounded-lg shadow-md"
                      layoutId="activeTab"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                      }}
                    />
                  )}
                  
                  {/* Hover Background */}
                  <motion.div
                    className="absolute inset-0 bg-muted/50 rounded-lg"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: isActive ? 0 : 1 }}
                    transition={{ duration: 0.2 }}
                  />
                  
                  {/* Content */}
                  <div className="relative z-10 flex items-center gap-2">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon className="h-4 w-4" />
                    </motion.div>
                    <span className="font-semibold">{item.label}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center space-x-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              
              return (
                <motion.button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`
                    relative p-2 rounded-lg cursor-pointer
                    ${isActive 
                      ? 'text-white' 
                      : 'text-muted-foreground hover:text-white'
                    }
                  `}
                  title={item.label}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: index * 0.03,
                    type: "spring",
                    stiffness: 400,
                    damping: 17
                  }}
                >
                  {/* Active Background */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 bg-primary rounded-lg"
                      layoutId="activeMobileTab"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                      }}
                    />
                  )}
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon className="h-5 w-5" />
                    </motion.div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Logout Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={handleLogoutClick} 
              variant="ghost" 
              size="sm"
              className="text-muted-foreground hover:text-white"
            >
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.2 }}
              >
                <FiLogOut className="h-4 w-4 mr-2" />
              </motion.div>
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </motion.div>
        </div>

        {/* Mobile Description */}
        <div className="md:hidden mt-3">
          <AnimatePresence mode="wait">
            {navItems.map((item) => {
              if (isActivePath(item.path)) {
                return (
                  <motion.p 
                    key={item.path} 
                    className="text-sm text-muted-foreground"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                  >
                    {item.description}
                  </motion.p>
                );
              }
              return null;
            })}
          </AnimatePresence>
        </div>
      </div>
      </motion.nav>

      {/* Render Modal at Document Root */}
      {typeof document !== 'undefined' && createPortal(
        <LogoutModal 
          isOpen={showLogoutModal}
          onClose={handleLogoutCancel}
          onConfirm={handleLogoutConfirm}
        />,
        document.body
      )}
    </>
  );
} 