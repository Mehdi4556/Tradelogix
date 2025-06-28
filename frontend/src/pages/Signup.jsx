import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiTrendingUp, FiBarChart2, FiCheckCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    const result = await signup(data.name, data.email, data.password);
    
    if (result.success) {
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_50%)]" />
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-800 shadow-2xl">
          <CardHeader className="space-y-6 text-center">
            {/* TradeLogix Branding */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col items-center space-y-4"
            >
              <Link 
                to="/dashboard" 
                className="flex items-center space-x-2 hover:scale-105 transition-transform duration-200 cursor-pointer"
              >
                <div className="relative">
                  <FiTrendingUp className="w-8 h-8 text-blue-500" />
                  <FiBarChart2 className="w-4 h-4 text-green-500 absolute -top-1 -right-1" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                  TradeLogix
                </h1>
              </Link>
              <p className="text-sm text-gray-400 max-w-xs">
                Professional Trading Journal & Analytics Platform
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {/* <CardTitle className="text-2xl font-bold text-white">Join TradeLogix</CardTitle> */}
              {/* <CardDescription className="text-gray-400 mt-2">
                Create your account and start optimizing your trading
              </CardDescription> */}
            </motion.div>
          </CardHeader>
        <CardContent>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <FiUser className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-green-400 transition-colors" />
                        <Input
                          placeholder="Mehdi"
                          className="pl-9 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <FiMail className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-green-400 transition-colors" />
                        <Input
                          placeholder="mehdi@example.com"
                          className="pl-9 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <FiLock className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-green-400 transition-colors" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a strong password"
                          className="pl-9 pr-9 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                          {...field}
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-green-400 transition-colors"
                        >
                          {showPassword ? <FiEyeOff /> : <FiEye />}
                        </motion.button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <FiLock className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-green-400 transition-colors" />
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          className="pl-9 pr-9 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                          {...field}
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-green-400 transition-colors"
                        >
                          {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                        </motion.button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-2.5 transition-all duration-200 shadow-lg shadow-green-500/25"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <FiCheckCircle className="w-4 h-4" />
                      <span>Create Account</span>
                    </div>
                  )}
                </Button>
              </motion.div>

              {/* Features List */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="mt-6 space-y-2"
              >
                <p className="text-xs text-gray-400 text-center mb-3">What you'll get:</p>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <FiCheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                    <span>Comprehensive trade tracking & analytics</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <FiCheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                    <span>Performance insights & reporting</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <FiCheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                    <span>Trading calendar & journal</span>
                  </div>
                </div>
              </motion.div>
            </form>
          </Form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.5 }}
            className="mt-6 text-center text-sm"
          >
            <span className="text-gray-400">Already have an account? </span>
            <Link 
              to="/login" 
              className="text-green-400 hover:text-green-300 font-medium transition-colors duration-200 hover:underline"
            >
              Sign in
            </Link>
          </motion.div>
          </motion.div>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
} 