import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiPlus, FiImage, FiCalendar, FiSettings, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    { 
      path: '/settings', 
      label: 'Settings', 
      icon: FiSettings,
      description: 'Profile & Settings'
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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileNavClick = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <motion.div 
              className="flex items-center gap-2 sm:gap-3 cursor-pointer"
              onClick={() => navigate('/dashboard')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <motion.div 
                className="w-20 h-20 sm:w-12 sm:h-12 flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <img 
                  src="/logo.png" 
                  alt="TradeLogix Logo" 
                  className="w-full h-full object-contain"
                />
              </motion.div>
              <div className="hidden sm:block">
                <h1 className="text-base sm:text-lg font-bold font-heading text-white hover:text-blue-400 transition-colors">TradeLogix</h1>
                <p className="text-xs text-gray-400 font-medium hidden lg:block">Trading Journal</p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-sm font-bold font-heading text-white hover:text-blue-400 transition-colors">TradeLogix</h1>
              </div>
            </motion.div>

            {/* Desktop Navigation Items */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.path);
                
                return (
                  <motion.button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`
                      relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors
                      ${isActive 
                        ? 'text-white' 
                        : 'text-gray-400 hover:text-white'
                      }
                    `}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -1 
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
                        className="absolute inset-0 bg-blue-600 rounded-lg shadow-md"
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
                      className="absolute inset-0 bg-gray-800 rounded-lg"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: isActive ? 0 : 1 }}
                      transition={{ duration: 0.2 }}
                    />
                    
                    {/* Content */}
                    <div className="relative z-10 flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {/* Logout Button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={handleLogoutClick} 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-gray-800 p-2"
                >
                  <FiLogOut className="h-4 w-4" />
                  <span className="hidden xl:ml-2 xl:inline">Logout</span>
                </Button>
              </motion.div>

              {/* Mobile Menu Button */}
              <motion.button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <AnimatePresence mode="wait">
                  {isMobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiX className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiMenu className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="lg:hidden border-t border-gray-800 mt-4 pt-4 pb-2"
              >
                <div className="grid grid-cols-1 gap-2">
                  {navItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = isActivePath(item.path);
                    
                    return (
                      <motion.button
                        key={item.path}
                        onClick={() => handleMobileNavClick(item.path)}
                        className={`
                          relative flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors text-left
                          ${isActive 
                            ? 'text-white bg-blue-600' 
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                          }
                        `}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                          delay: index * 0.05,
                          duration: 0.3 
                        }}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium">{item.label}</div>
                          <div className="text-sm text-gray-500">{item.description}</div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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