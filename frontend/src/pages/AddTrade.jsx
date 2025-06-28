import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiUpload, FiImage, FiDollarSign, FiCalendar, FiFileText, FiTrendingUp, FiTrendingDown, FiPlus } from 'react-icons/fi';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Navigation from '@/components/Navigation';

const addTradeSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').toUpperCase(),
  type: z.enum(['BUY', 'SELL'], { required_error: 'Trade type is required' }),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  entryPrice: z.number().min(0.01, 'Entry price must be greater than 0'),
  exitPrice: z.number().optional(),
  entryDate: z.string().min(1, 'Entry date is required'),
  exitDate: z.string().optional(),
  notes: z.string().optional(),
  strategy: z.string().optional(),
  status: z.enum(['OPEN', 'CLOSED'], { required_error: 'Status is required' }),
});

export default function AddTrade() {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(addTradeSchema),
    defaultValues: {
      symbol: '',
      type: 'BUY',
      quantity: '',
      entryPrice: '',
      exitPrice: '',
      entryDate: new Date().toISOString().split('T')[0],
      exitDate: '',
      notes: '',
      strategy: '',
      status: 'OPEN',
    },
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Add form fields to FormData
      Object.keys(data).forEach(key => {
        if (data[key] !== '' && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      
      // Add image if selected
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await axios.post('http://localhost:5000/api/trades', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      toast.success('Trade added successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add trade');
    } finally {
      setLoading(false);
    }
  };

  const watchedStatus = form.watch('status');

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-black pt-24 p-6">
        <div className="max-w-4xl mx-auto">
        <div className="mb-8 animate-in fade-in-0 slide-in-from-top-4 duration-500">
          <div className="flex items-center space-x-3 mb-4">
            <FiPlus className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold font-heading">Add New Trade</h1>
          </div>
          <p className="text-gray-400">
            Record your trading activity with detailed information
          </p>
        </div>

        <Card className="bg-gray-900 border-gray-800 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white font-heading">
              <FiTrendingUp className="h-5 w-5 text-blue-500" />
              Trade Details
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enter your trade information and optionally upload a screenshot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Symbol */}
                  <FormField
                    control={form.control}
                    name="symbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Symbol</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <FiDollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="AAPL, TSLA, BTC, etc."
                              className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:ring-blue-500 focus:border-blue-500"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Trade Type */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Trade Type</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={field.value === 'BUY' ? 'default' : 'outline'}
                              className={`flex-1 ${field.value === 'BUY' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                              onClick={() => field.onChange('BUY')}
                            >
                              <FiTrendingUp className="mr-2 h-4 w-4" />
                              BUY
                            </Button>
                            <Button
                              type="button"
                              variant={field.value === 'SELL' ? 'default' : 'outline'}
                              className={`flex-1 ${field.value === 'SELL' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                              onClick={() => field.onChange('SELL')}
                            >
                              <FiTrendingDown className="mr-2 h-4 w-4" />
                              SELL
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Quantity */}
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="100"
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:ring-blue-500 focus:border-blue-500"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Entry Price */}
                  <FormField
                    control={form.control}
                    name="entryPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Entry Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="150.50"
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:ring-blue-500 focus:border-blue-500"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Entry Date */}
                  <FormField
                    control={form.control}
                    name="entryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Entry Date</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <FiCalendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              type="date"
                              className="pl-9 bg-gray-800 border-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Status */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Status</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={field.value === 'OPEN' ? 'default' : 'outline'}
                              className="flex-1"
                              onClick={() => field.onChange('OPEN')}
                            >
                              OPEN
                            </Button>
                            <Button
                              type="button"
                              variant={field.value === 'CLOSED' ? 'default' : 'outline'}
                              className="flex-1"
                              onClick={() => field.onChange('CLOSED')}
                            >
                              CLOSED
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Exit Price - Only show if status is CLOSED */}
                  {watchedStatus === 'CLOSED' && (
                    <FormField
                      control={form.control}
                      name="exitPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Exit Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="155.75"
                              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:ring-blue-500 focus:border-blue-500"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Exit Date - Only show if status is CLOSED */}
                  {watchedStatus === 'CLOSED' && (
                    <FormField
                      control={form.control}
                      name="exitDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Exit Date</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <FiCalendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                type="date"
                                className="pl-9 bg-gray-800 border-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Strategy */}
                <FormField
                  control={form.control}
                  name="strategy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Strategy (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Day Trading, Swing Trading, Scalping, etc."
                          className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:ring-blue-500 focus:border-blue-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Notes (Optional)</FormLabel>
                      <FormControl>
                        <textarea
                          className="flex min-h-[80px] w-full rounded-md border bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Add any notes about this trade..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label className="text-white">Trade Screenshot (Optional)</Label>
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 bg-gray-800">
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img 
                          src={imagePreview} 
                          alt="Trade screenshot" 
                          className="max-w-full h-48 object-contain rounded-lg mx-auto"
                        />
                        <div className="flex justify-center">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setImagePreview(null);
                              setImageFile(null);
                            }}
                          >
                            Remove Image
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <Label htmlFor="image-upload" className="cursor-pointer text-white">
                            <span className="text-blue-400 font-medium">Click to upload</span>
                            <span className="text-gray-400"> or drag and drop</span>
                          </Label>
                          <p className="text-xs text-gray-400 mt-1">
                            PNG, JPG, GIF up to 10MB
                          </p>
                        </div>
                        <input
                          id="image-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate('/dashboard')}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? 'Adding Trade...' : 'Add Trade'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        </div>
      </div>
    </>
  );
} 