import { useState, useEffect } from 'react';
import { FiFilter, FiSearch, FiCalendar, FiDollarSign, FiTrendingUp, FiTrendingDown, FiImage, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Skeleton } from '../components/ui/skeleton';
import TradeModal from '../components/TradeModal';
import Navigation from '../components/Navigation';

const Gallery = () => {
  const [trades, setTrades] = useState([]);
  const [filteredTrades, setFilteredTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    symbol: '',
    type: '',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchTrades();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [trades, filters]);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/trades', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Only show trades with images
      const tradesWithImages = response.data.data.trades.filter(trade => trade.image);
      
      // Initialize loading states first
      const loadingStates = {};
      tradesWithImages.forEach(trade => {
        loadingStates[trade._id] = false; // Start with false to show images immediately
      });
      
      // Set states in the correct order
      setImageLoadingStates(loadingStates);
      setTrades(tradesWithImages);
      
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = trades;

    if (filters.symbol) {
      filtered = filtered.filter(trade =>
        trade.symbol.toLowerCase().includes(filters.symbol.toLowerCase())
      );
    }

    if (filters.type) {
      filtered = filtered.filter(trade => trade.type === filters.type);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(trade =>
        new Date(trade.entryDate) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(trade =>
        new Date(trade.entryDate) <= new Date(filters.dateTo)
      );
    }

    setFilteredTrades(filtered);
    
    // Ensure all filtered trades have loading states
    setImageLoadingStates(prev => {
      const newStates = { ...prev };
      filtered.forEach(trade => {
        if (!(trade._id in newStates)) {
          newStates[trade._id] = false;
        }
      });
      return newStates;
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      symbol: '',
      type: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const openTradeModal = (trade) => {
    setSelectedTrade(trade);
    setIsModalOpen(true);
  };

  const closeTradeModal = () => {
    setIsModalOpen(false);
    setSelectedTrade(null);
  };

  const handleImageLoad = (tradeId) => {
    setImageLoadingStates(prev => ({
      ...prev,
      [tradeId]: false
    }));
  };

  const handleImageError = (tradeId, imgElement) => {
    console.log('Image failed to load for trade:', tradeId);
    handleImageLoad(tradeId);
    // Hide the img and show fallback
    imgElement.style.display = 'none';
    const fallback = document.getElementById(`fallback-${tradeId}`);
    if (fallback) {
      fallback.classList.remove('hidden');
    }
  };

  const calculatePnL = (trade) => {
    if (!trade.exitPrice) return 0;
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
      
      // Remove trade from all trades and filtered trades
      setTrades(prev => prev.filter(trade => trade._id !== tradeId));
      setFilteredTrades(prev => prev.filter(trade => trade._id !== tradeId));
      
      toast.success('Trade deleted successfully!');
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting trade:', error);
      toast.error('Failed to delete trade');
    }
  };

  const onTradeDeleted = (tradeId) => {
    // Remove trade from all trades and filtered trades when deleted from modal
    setTrades(prev => prev.filter(trade => trade._id !== tradeId));
    setFilteredTrades(prev => prev.filter(trade => trade._id !== tradeId));
  };

  const confirmDelete = (trade, e) => {
    e.stopPropagation(); // Prevent opening the modal
    setDeleteConfirm(trade);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const GallerySkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, index) => (
        <div key={index} className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <Skeleton className="w-full h-48 bg-gray-800" />
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-16 bg-gray-800" />
              <Skeleton className="h-5 w-12 bg-gray-800" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 bg-gray-800" />
              <Skeleton className="h-4 w-20 bg-gray-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-black text-white pt-20 sm:pt-24 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-8 w-48 bg-gray-800 mb-4" />
            <Skeleton className="h-4 w-96 bg-gray-800" />
          </div>

          {/* Filters Skeleton */}
          <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, index) => (
                <Skeleton key={index} className="h-10 bg-gray-800" />
              ))}
            </div>
          </div>

          {/* Gallery Skeleton */}
          <GallerySkeleton />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-black text-white pt-20 sm:pt-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-in fade-in-0 slide-in-from-top-4 duration-500">
          <div className="flex items-center space-x-3 mb-4">
            <FiImage className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold font-heading">Trade Gallery</h1>
          </div>
          <p className="text-gray-400">
            Visual overview of your trades with screenshots and detailed analysis
          </p>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-800 animate-in fade-in-0 slide-in-from-top-6 duration-500 delay-100">
          <div className="flex items-center space-x-2 mb-4">
            <FiFilter className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold font-heading">Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search symbol..."
                value={filters.symbol}
                onChange={(e) => handleFilterChange('symbol', e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">All Types</option>
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </select>
            
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          {(filters.symbol || filters.type || filters.dateFrom || filters.dateTo) && (
            <div className="mt-4">
                          <button
              onClick={clearFilters}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 cursor-pointer"
            >
              Clear Filters
            </button>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="mb-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-200">
          <p className="text-gray-400">
            Showing <span className="text-white font-medium">{filteredTrades.length}</span> trade{filteredTrades.length !== 1 ? 's' : ''} with screenshots
          </p>
        </div>

        {/* Gallery Grid */}
        {filteredTrades.length === 0 ? (
          <div className="text-center py-16 animate-in fade-in-0 zoom-in-95 duration-500 delay-300">
            <FiImage className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold font-heading text-gray-300 mb-2">No trades with screenshots found</h3>
            <p className="text-gray-500">
              Try adjusting your filters or add some trades with screenshots
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTrades.map((trade, index) => {
              const pnl = calculatePnL(trade);
              const isProfit = pnl > 0;
              const isLoss = pnl < 0;
              
              return (
                <div
                  key={trade._id}
                  className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer group animate-in fade-in-0 zoom-in-95 duration-500 relative"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => openTradeModal(trade)}
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gray-800 overflow-hidden">
                    {trade.image ? (
                      <>
                        {imageLoadingStates[trade._id] === true && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                          </div>
                        )}
                        <img
                          src={trade.image?.startsWith('http') 
                            ? trade.image 
                            : `http://localhost:5000${trade.image?.startsWith('/') ? trade.image : `/uploads/trades/${trade.image}`}`
                          }
                          alt={`Trade ${trade.symbol}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                          onLoad={() => handleImageLoad(trade._id)}
                          onError={(e) => handleImageError(trade._id, e.target)}
                        />
                        
                        {/* Fallback when image fails to load */}
                        <div 
                          className="absolute inset-0 flex items-center justify-center bg-gray-800 hidden"
                          id={`fallback-${trade._id}`}
                        >
                          <div className="text-center">
                            <FiImage className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                            <p className="text-gray-500 text-xs">Image not available</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <div className="text-center">
                          <FiImage className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                          <p className="text-gray-500 text-xs">No Image</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        trade.status === 'OPEN' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 
                        trade.status === 'CLOSED' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' : 
                        'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {trade.status}
                      </span>
                    </div>

                    {/* P&L Badge */}
                    {trade.status === 'CLOSED' && (
                      <div className="absolute top-3 right-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          isProfit ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                          isLoss ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                          'bg-gray-500/20 text-gray-400 border-gray-500/30'
                        }`}>
                          {isProfit ? '+' : ''}${pnl.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-bold font-heading text-white">{trade.symbol}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {trade.type}
                        </span>
                      </div>
                      {trade.status === 'CLOSED' && (
                        <div className="text-right">
                          {isProfit ? (
                            <FiTrendingUp className="w-4 h-4 text-green-400" />
                          ) : isLoss ? (
                                                          <FiTrendingDown className="w-4 h-4 text-red-400" />
                          ) : (
                                                          <FiDollarSign className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between text-gray-400">
                        <span>Entry Price:</span>
                        <span className="text-white font-mono tabular-nums">${trade.entryPrice}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-gray-400">
                        <span>Quantity:</span>
                        <span className="text-white font-mono tabular-nums">{trade.quantity}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-gray-400">
                        <span>Date:</span>
                        <span className="text-white">
                          {new Date(trade.entryDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
                      <button className="flex-1 text-center text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-200 cursor-pointer">
                        Click to view details →
                      </button>
                      <button
                        onClick={(e) => confirmDelete(trade, e)}
                        className="ml-3 p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:hover:bg-red-500/20 cursor-pointer"
                        title="Delete trade"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Trade Modal */}
      <TradeModal
        trade={selectedTrade}
        isOpen={isModalOpen}
        onClose={closeTradeModal}
        onTradeDeleted={onTradeDeleted}
      />

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
              {deleteConfirm.image && (
                <div className="mt-3">
                  <img
                    src={deleteConfirm.image?.startsWith('http') 
                      ? deleteConfirm.image 
                      : `http://localhost:5000${deleteConfirm.image?.startsWith('/') ? deleteConfirm.image : `/uploads/trades/${deleteConfirm.image}`}`
                    }
                    alt={`Trade ${deleteConfirm.symbol}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                </div>
              )}
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

export default Gallery; 