import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiCalendar, FiTrendingUp, FiTrendingDown, FiDollarSign, FiEye } from 'react-icons/fi';
import { API_BASE_URL } from '../config/api';

import { Skeleton } from '@/components/ui/skeleton';
import Navigation from '@/components/Navigation';

export default function Calendar() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrades, setSelectedTrades] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/trades`);
      setTrades(response.data.data.trades);
    } catch (error) {
      toast.error('Failed to fetch trades');
    } finally {
      setLoading(false);
    }
  };

  const formatTradesForCalendar = () => {
    const events = [];
    const tradesByDate = {};

    // Group trades by date
    trades.forEach(trade => {
      const date = trade.entryDate.split('T')[0];
      if (!tradesByDate[date]) {
        tradesByDate[date] = [];
      }
      tradesByDate[date].push(trade);
    });

    // Create calendar events
    Object.keys(tradesByDate).forEach(date => {
      const dayTrades = tradesByDate[date];
      const totalTrades = dayTrades.length;
      const buyTrades = dayTrades.filter(t => t.type === 'BUY').length;
      const sellTrades = dayTrades.filter(t => t.type === 'SELL').length;
      
      // Calculate P&L for the day
      const dayPnL = dayTrades.reduce((total, trade) => {
        if (trade.status === 'CLOSED' && trade.exitPrice) {
          const pnl = trade.type === 'BUY' 
            ? (trade.exitPrice - trade.entryPrice) * trade.quantity
            : (trade.entryPrice - trade.exitPrice) * trade.quantity;
          return total + pnl;
        }
        return total;
      }, 0);

      const isProfitable = dayPnL > 0;
      const isBreakeven = dayPnL === 0;

      events.push({
        id: date,
        title: `${totalTrades} trade${totalTrades > 1 ? 's' : ''}`,
        start: date,
        extendedProps: {
          trades: dayTrades,
          buyCount: buyTrades,
          sellCount: sellTrades,
          pnl: dayPnL,
          isProfitable,
          isBreakeven
        },
        backgroundColor: isProfitable ? '#059669' : isBreakeven ? '#6b7280' : '#dc2626',
        borderColor: isProfitable ? '#047857' : isBreakeven ? '#4b5563' : '#b91c1c',
        textColor: '#ffffff'
      });
    });

    return events;
  };

  const handleDateClick = (arg) => {
    const clickedDate = arg.dateStr;
    const dayTrades = trades.filter(trade => 
      trade.entryDate.split('T')[0] === clickedDate
    );

    if (dayTrades.length > 0) {
      setSelectedTrades(dayTrades);
      setSelectedDate(clickedDate);
      setShowModal(true);
    }
  };

  const handleEventClick = (clickInfo) => {
    const eventTrades = clickInfo.event.extendedProps.trades;
    setSelectedTrades(eventTrades);
    setSelectedDate(clickInfo.event.start.toISOString().split('T')[0]);
    setShowModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculatePnL = (trade) => {
    if (trade.status === 'CLOSED' && trade.exitPrice) {
      const pnl = trade.type === 'BUY' 
        ? (trade.exitPrice - trade.entryPrice) * trade.quantity
        : (trade.entryPrice - trade.exitPrice) * trade.quantity;
      return pnl;
    }
    return null;
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-black pt-20 sm:pt-24 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Skeleton */}
            <div className="mb-8 animate-in fade-in-0 slide-in-from-top-4 duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <Skeleton className="w-8 h-8 bg-gray-800 rounded" />
                <Skeleton className="h-8 w-48 bg-gray-800" />
              </div>
              <Skeleton className="h-4 w-96 bg-gray-800" />
            </div>

            {/* Legend Skeleton */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-5 w-5 bg-gray-800 rounded" />
                <Skeleton className="h-5 w-32 bg-gray-800" />
              </div>
              <div className="flex flex-wrap gap-6">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Skeleton className="w-3 h-3 bg-gray-800 rounded" />
                    <Skeleton className="h-4 w-20 bg-gray-800" />
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar Skeleton */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-300 delay-50">
              <div className="p-6 border-b border-gray-800">
                <Skeleton className="h-6 w-32 bg-gray-800 mb-2" />
                <Skeleton className="h-4 w-64 bg-gray-800" />
              </div>
              <div className="p-6">
                {/* Calendar Header Skeleton */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-16 bg-gray-800" />
                    <Skeleton className="h-9 w-16 bg-gray-800" />
                    <Skeleton className="h-9 w-16 bg-gray-800" />
                  </div>
                  <Skeleton className="h-8 w-32 bg-gray-800" />
                </div>

                {/* Calendar Grid Skeleton */}
                <div className="space-y-2">
                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="p-2 text-center">
                        <Skeleton className="h-4 w-8 bg-gray-800 mx-auto" />
                      </div>
                    ))}
                  </div>

                  {/* Calendar days */}
                  {[...Array(6)].map((_, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 gap-2">
                      {[...Array(7)].map((_, dayIndex) => (
                        <div key={dayIndex} className="h-16 border border-gray-700 rounded">
                          <div className="p-2">
                            <Skeleton className="h-3 w-4 bg-gray-800 mb-1" />
                            {Math.random() > 0.7 && (
                              <Skeleton className="h-2 w-full bg-gray-700" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-black pt-20 sm:pt-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-in fade-in-0 slide-in-from-top-4 duration-300">
          <div className="flex items-center space-x-3 mb-4">
            <FiCalendar className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold font-heading">Trading Calendar</h1>
          </div>
          <p className="text-gray-400">
            Visual timeline of your trading activities
          </p>
        </div>

        {/* Calendar Legend */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2 mb-4">
            <FiCalendar className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-white">Calendar Legend</h2>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-300">Profitable Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-300">Loss Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-500 rounded"></div>
              <span className="text-gray-300">Breakeven/Open Trades</span>
            </div>
          </div>
        </div>

        {/* Trading Calendar */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-300 delay-50">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">Monthly View</h2>
            <p className="text-gray-400 text-sm mt-1">Click on any day to view trade details</p>
          </div>
          <div className="p-6">
            <div className="calendar-container">
              <style jsx global>{`
                .fc {
                  background: transparent;
                  color: #fff;
                }
                .fc-theme-standard .fc-scrollgrid {
                  border: 1px solid #374151;
                }
                .fc-theme-standard td, .fc-theme-standard th {
                  border-color: #374151;
                }
                .fc-col-header-cell {
                  background: #1f2937;
                  color: #9ca3af;
                  font-weight: 600;
                  text-transform: uppercase;
                  font-size: 0.75rem;
                  letter-spacing: 0.05em;
                }
                .fc-daygrid-day {
                  background: transparent;
                  transition: background-color 0.2s;
                }
                .fc-daygrid-day:hover {
                  background: #374151;
                }
                .fc-daygrid-day-number {
                  color: #d1d5db;
                  font-weight: 500;
                  padding: 8px;
                }
                .fc-toolbar {
                  margin-bottom: 1rem;
                }
                .fc-toolbar-title {
                  color: #fff;
                  font-size: 1.125rem;
                  font-weight: 600;
                }
                .fc-daygrid-day-frame {
                  min-height: 60px;
                }
                .fc-scrollgrid-section-body td {
                  height: 60px;
                }
                .fc-button {
                  background: #374151;
                  border: 1px solid #4b5563;
                  color: #d1d5db;
                  padding: 0.5rem 1rem;
                  font-size: 0.875rem;
                  font-weight: 500;
                }
                .fc-button:hover {
                  background: #4b5563;
                  border-color: #6b7280;
                  color: #fff;
                }
                .fc-button:focus {
                  box-shadow: 0 0 0 2px #3b82f6;
                }
                .fc-button-primary:disabled {
                  background: #1f2937;
                  border-color: #374151;
                  color: #6b7280;
                }
                .fc-daygrid-event {
                  margin: 1px 2px;
                  border-radius: 4px;
                  border: none;
                  font-size: 0.75rem;
                  font-weight: 500;
                  padding: 2px 6px;
                }
                .fc-h-event {
                  border: none;
                }
                .fc-event-title {
                  font-weight: 500;
                }
                .fc-more-link {
                  color: #3b82f6;
                  font-size: 0.75rem;
                  font-weight: 500;
                }
                .fc-more-link:hover {
                  color: #60a5fa;
                }
              `}</style>
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={formatTradesForCalendar()}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                height={450}
                aspectRatio={1.8}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: ''
                }}
                dayMaxEvents={2}
                moreLinkClick="popover"
                eventDisplay="block"
                displayEventTime={false}
                eventTextColor="#ffffff"
                fixedWeekCount={false}
                showNonCurrentDates={false}
                contentHeight={400}
              />
            </div>
          </div>
        </div>

        {/* Trade Details Modal */}
        {showModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 cursor-pointer"
            onClick={() => setShowModal(false)}
          >
            <div 
              className="max-w-4xl max-h-[90vh] bg-gray-900 border border-gray-800 rounded-lg overflow-hidden w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-800">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-white">
                    Trades for {formatDate(selectedDate)}
                  </h3>
                  <button 
                    className="text-gray-400 hover:text-white text-2xl leading-none"
                    onClick={() => setShowModal(false)}
                  >
                    ×
                  </button>
                </div>
                <p className="text-gray-400 mt-1">
                  {selectedTrades.length} trade{selectedTrades.length > 1 ? 's' : ''} recorded
                </p>
              </div>
              
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  {selectedTrades.map((trade) => {
                    const pnl = calculatePnL(trade);
                    return (
                      <div key={trade._id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded ${
                              trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {trade.type === 'BUY' ? <FiTrendingUp /> : <FiTrendingDown />}
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg text-white">{trade.symbol}</h4>
                              <p className="text-sm text-gray-400">{trade.type} • {trade.quantity} shares</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-400">Entry Price</div>
                            <div className="font-semibold text-white">{formatCurrency(trade.entryPrice)}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Status:</span>
                            <div className={`font-medium ${
                              trade.status === 'OPEN' ? 'text-blue-400' : 'text-gray-300'
                            }`}>
                              {trade.status}
                            </div>
                          </div>
                          
                          {trade.exitPrice && (
                            <div>
                              <span className="text-gray-400">Exit Price:</span>
                              <div className="font-medium text-white">{formatCurrency(trade.exitPrice)}</div>
                            </div>
                          )}
                          
                          {pnl !== null && (
                            <div>
                              <span className="text-gray-400">P&L:</span>
                              <div className={`font-medium ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatCurrency(pnl)}
                              </div>
                            </div>
                          )}
                          
                          {trade.strategy && (
                            <div>
                              <span className="text-gray-400">Strategy:</span>
                              <div className="font-medium text-white">{trade.strategy}</div>
                            </div>
                          )}
                        </div>

                        {trade.notes && (
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <span className="text-gray-400 text-sm">Notes:</span>
                            <p className="mt-1 text-sm text-gray-300">{trade.notes}</p>
                          </div>
                        )}

                        {trade.image && (
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                              <FiEye className="h-4 w-4" />
                              Screenshot attached
                            </div>
                            <img 
                              src={trade.image?.startsWith('http') 
                                ? trade.image 
                                : trade.image?.startsWith('/uploads') 
                                  ? `http://localhost:5000${trade.image}`
                                  : `${API_BASE_URL}${trade.image?.startsWith('/') ? trade.image : `/uploads/trades/${trade.image}`}`
                              }
                              alt={`${trade.symbol} trade`}
                              className="w-full max-w-sm h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(trade.image?.startsWith('http') 
                                ? trade.image 
                                : trade.image?.startsWith('/uploads') 
                                  ? `http://localhost:5000${trade.image}`
                                  : `${API_BASE_URL}${trade.image?.startsWith('/') ? trade.image : `/uploads/trades/${trade.image}`}`, '_blank')}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
} 