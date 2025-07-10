import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiEdit3, FiSave, FiX, FiSettings } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }

    setLoading(true);
    try {
      const result = await updateProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim()
      });

      if (result.success) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Navigation />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FiSettings className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Settings & Profile</h1>
            </div>
            <p className="text-gray-400">Manage your account settings and profile information</p>
          </motion.div>

          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <FiUser className="h-5 w-5" />
                    Profile Information
                  </h2>
                  {!isEditing && (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <FiEdit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email - Read Only */}
                  <div>
                    <Label htmlFor="email" className="text-gray-300 flex items-center gap-2 mb-2">
                      <FiMail className="h-4 w-4" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-gray-700/50 border-gray-600 text-gray-300 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  {/* Username - Read Only for now */}
                  <div>
                    <Label htmlFor="username" className="text-gray-300 flex items-center gap-2 mb-2">
                      <FiUser className="h-4 w-4" />
                      Username
                    </Label>
                    <Input
                      id="username"
                      value={user?.username || ''}
                      disabled
                      className="bg-gray-700/50 border-gray-600 text-gray-300 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                  </div>

                  {/* First Name */}
                  <div>
                    <Label htmlFor="firstName" className="text-gray-300 mb-2 block">
                      First Name
                    </Label>
                    {isEditing ? (
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                        placeholder="Enter your first name"
                      />
                    ) : (
                      <Input
                        id="firstName"
                        value={user?.firstName || ''}
                        disabled
                        className="bg-gray-700/50 border-gray-600 text-gray-300"
                      />
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <Label htmlFor="lastName" className="text-gray-300 mb-2 block">
                      Last Name
                    </Label>
                    {isEditing ? (
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                        placeholder="Enter your last name"
                      />
                    ) : (
                      <Input
                        id="lastName"
                        value={user?.lastName || ''}
                        disabled
                        className="bg-gray-700/50 border-gray-600 text-gray-300"
                      />
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 mt-6 pt-6 border-t border-gray-700"
                  >
                    <Button
                      onClick={handleSave}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <FiSave className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <FiX className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Account Details Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8"
          >
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Account Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-300 mb-2 block">Trading Experience</Label>
                    <div className="bg-gray-700/50 border border-gray-600 rounded-md px-3 py-2 text-gray-300">
                      {user?.tradingExperience?.charAt(0).toUpperCase() + user?.tradingExperience?.slice(1) || 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-2 block">Preferred Currency</Label>
                    <div className="bg-gray-700/50 border border-gray-600 rounded-md px-3 py-2 text-gray-300">
                      {user?.preferredCurrency || 'USD'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-2 block">Member Since</Label>
                    <div className="bg-gray-700/50 border border-gray-600 rounded-md px-3 py-2 text-gray-300">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-2 block">Last Login</Label>
                    <div className="bg-gray-700/50 border border-gray-600 rounded-md px-3 py-2 text-gray-300">
                      {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 