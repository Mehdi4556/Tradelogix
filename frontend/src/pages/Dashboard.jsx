import { useState, useEffect } from 'react';
import { 
  FiHome, 
  FiDollarSign, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiPlus, 
  FiCalendar,
  FiImage,
  FiUsers,
  FiTrash2,
  FiAlertTriangle
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Skeleton } from '../components/ui/skeleton';
import Navigation from '../components/Navigation';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  
  // Temporary debug log
  console.log('Dashboard - user object:', user);
  const [stats, setStats] = useState({
    totalTrades: 0,
    totalPnL: 0,
    winRate: 0,
    bestTrade: 0,
    worstTrade: 0
  });
  const [recentTrades, setRecentTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/trades', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const trades = response.data.data.trades;
      
      // Calculate statistics
      const totalTrades = trades.length;
      const closedTrades = trades.filter(trade => trade.status === 'CLOSED');
      
      let totalPnL = 0;
      let wins = 0;
      let bestTrade = 0;
      let worstTrade = 0;

      closedTrades.forEach(trade => {
        if (trade.exitPrice) {
          const pnl = trade.type === 'BUY' 
            ? (trade.exitPrice - trade.entryPrice) * trade.quantity
            : (trade.entryPrice - trade.exitPrice) * trade.quantity;
          
          totalPnL += pnl;
          if (pnl > 0) wins++;
          if (pnl > bestTrade) bestTrade = pnl;
          if (pnl < worstTrade) worstTrade = pnl;
        }
      });

      const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

      setStats({
        totalTrades,
        totalPnL,
        winRate,
        bestTrade,
        worstTrade
      });

      // Get recent trades (last 5)
      const recent = trades.slice(0, 5);
      setRecentTrades(recent);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTradePnL = (trade) => {
    if (trade.status !== 'CLOSED' || !trade.exitPrice) return 0;
    return trade.type === 'BUY' 
      ? (trade.exitPrice - trade.entryPrice) * trade.quantity
      : (trade.entryPrice - trade.exitPrice) * trade.quantity;
  };

  const handleDeleteTrade = async (tradeId) => {
    try {
      await axios.delete(`http://localhost:5000/api/trades/${tradeId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Remove trade from recent trades
      setRecentTrades(prev => prev.filter(trade => trade._id !== tradeId));
      
      // Refresh dashboard data to update stats
      fetchDashboardData();
      
      toast.success('Trade deleted successfully!');
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting trade:', error);
      toast.error('Failed to delete trade');
    }
  };

  const confirmDelete = (trade) => {
    setDeleteConfirm(trade);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const StatsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-5 w-5 bg-gray-800 rounded" />
            <Skeleton className="h-4 w-16 bg-gray-800" />
          </div>
          <Skeleton className="h-8 w-24 bg-gray-800 mb-2" />
          <Skeleton className="h-3 w-20 bg-gray-800" />
        </div>
      ))}
    </div>
  );

  const RecentTradesSkeleton = () => (
    <div className="bg-gray-900 rounded-lg border border-gray-800">
      <div className="p-6 border-b border-gray-800">
        <Skeleton className="h-6 w-32 bg-gray-800" />
      </div>
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-4 w-4 bg-gray-700 rounded" />
              <div>
                <Skeleton className="h-4 w-16 bg-gray-700 mb-1" />
                <Skeleton className="h-3 w-24 bg-gray-700" />
              </div>
            </div>
            <div className="text-right">
              <Skeleton className="h-4 w-20 bg-gray-700 mb-1" />
              <Skeleton className="h-3 w-16 bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-black text-white pt-24 p-6">
          <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-8 w-48 bg-gray-800 mb-4" />
            <Skeleton className="h-4 w-96 bg-gray-800" />
          </div>

          {/* Stats Skeleton */}
          <StatsSkeleton />

          {/* Quick Actions Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} className="h-32 bg-gray-800 rounded-lg" />
            ))}
          </div>

          {/* Recent Trades Skeleton */}
          <RecentTradesSkeleton />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-black text-white pt-24 p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-in fade-in-0 slide-in-from-top-4 duration-500">
          {/* Welcome Message */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold font-heading text-white mb-2">
              {authLoading ? (
                <Skeleton className="h-10 w-80 bg-gray-800" />
              ) : (
                <>Welcome Back👋</>
              )}
            </h1>
            <p className="text-gray-400 text-lg">
              Ready to conquer the markets today?
            </p>
          </div>
          
          <div className="flex items-center space-x-3 mb-4">
            <FiHome className="w-8 h-8 text-blue-500" />
            <h2 className="text-3xl font-bold font-heading">Dashboard</h2>
          </div>
          <p className="text-gray-400">
            Overview of your trading performance and key metrics
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-100">
            <div className="flex items-center justify-between mb-3">
              <FiUsers className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">TOTAL</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stats.totalTrades}</div>
            <div className="text-xs text-gray-400">Trades</div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-150">
            <div className="flex items-center justify-between mb-3">
              <FiDollarSign className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">P&L</span>
            </div>
            <div className={`text-2xl font-bold mb-1 ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">
              {stats.totalPnL >= 0 ? 'Profit' : 'Loss'}
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-200">
            <div className="flex items-center justify-between mb-3">
              <FiTrendingUp className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">WIN RATE</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stats.winRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-400">Success Rate</div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-250">
            <div className="flex items-center justify-between mb-3">
              <FiTrendingUp className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">BEST</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              ${stats.bestTrade.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">Best Trade</div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-300">
            <div className="flex items-center justify-between mb-3">
              <FiTrendingDown className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">WORST</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              ${Math.abs(stats.worstTrade).toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">Worst Trade</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Link 
            to="/add-trade" 
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 hover:bg-gray-800 transition-all duration-300 animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-350 cursor-pointer"
          >
            <div className="flex items-center space-x-4">
              <FiPlus className="w-8 h-8 text-gray-400" />
              <div>
                <h3 className="text-lg font-semibold font-heading text-white">Add New Trade</h3>
                <p className="text-gray-400">Record your latest trading activity</p>
              </div>
            </div>
          </Link>

          <Link 
            to="/calendar" 
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 hover:bg-gray-800 transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-400 cursor-pointer"
          >
            <div className="flex items-center space-x-4">
              <FiCalendar className="w-8 h-8 text-gray-400" />
              <div>
                <h3 className="text-lg font-semibold font-heading text-white">View Calendar</h3>
                <p className="text-gray-400">Timeline view of your trades</p>
              </div>
            </div>
          </Link>

          <Link 
            to="/gallery" 
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 hover:bg-gray-800 transition-all duration-300 animate-in fade-in-0 slide-in-from-right-4 duration-500 delay-450 cursor-pointer"
          >
            <div className="flex items-center space-x-4">
              <FiImage className="w-8 h-8 text-gray-400" />
              <div>
                <h3 className="text-lg font-semibold font-heading text-white">Trade Gallery</h3>
                <p className="text-gray-400">Browse your trade screenshots</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Trades */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-500">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold font-heading text-white">Recent Trades</h2>
          </div>
          <div className="p-6">
            {recentTrades.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-2">No trades yet</div>
                <Link 
                  to="/add-trade" 
                  className="text-blue-400 hover:text-blue-300 transition-colors duration-200 cursor-pointer"
                >
                  Add your first trade →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTrades.map((trade, index) => {
                  const pnl = calculateTradePnL(trade);
                  const isProfit = pnl > 0;
                  const isLoss = pnl < 0;
                  
                  return (
                    <div 
                      key={trade._id} 
                      className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-all duration-200 animate-in fade-in-0 slide-in-from-left-4 duration-300 group cursor-pointer"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          trade.type === 'BUY' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-white">{trade.symbol}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {trade.type}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              trade.status === 'OPEN' ? 'bg-blue-500/20 text-blue-400' : 
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {trade.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-400">
                            {trade.quantity} shares @ ${trade.entryPrice}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          {trade.status === 'CLOSED' ? (
                            <div className={`font-medium ${
                              isProfit ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-gray-400'
                            }`}>
                              {isProfit ? '+' : ''}${pnl.toFixed(2)}
                            </div>
                          ) : (
                            <div className="text-gray-400">Open</div>
                          )}
                          <div className="text-sm text-gray-500">
                            {new Date(trade.entryDate).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(trade);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 cursor-pointer"
                          title="Delete trade"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
                  </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 max-w-md w-full animate-in fade-in-0 zoom-in-95 duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-500/20 rounded-full">
                  <FiAlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold font-heading text-white">Delete Trade</h3>
                  <p className="text-gray-400 text-sm">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-300 mb-2">
                  Are you sure you want to delete this trade?
                </p>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-white">{deleteConfirm.symbol}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        deleteConfirm.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {deleteConfirm.type}
                      </span>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {new Date(deleteConfirm.entryDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteTrade(deleteConfirm._id)}
                  className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </>
    );
  };

  export default Dashboard; 