import { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiDollarSign, FiTrendingUp, FiTrendingDown, FiClock, FiTarget, FiFileText, FiMaximize2, FiMinimize2, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

const TradeModal = ({ trade, isOpen, onClose, onTradeDeleted }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showFullImage) {
          setShowFullImage(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, showFullImage]);

  // Reset full image view when modal closes or trade changes
  useEffect(() => {
    if (!isOpen) {
      setShowFullImage(false);
      setImageLoaded(false);
      setDeleteConfirm(false);
    }
  }, [isOpen, trade]);

  const handleDeleteTrade = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/trades/${trade._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      toast.success('Trade deleted successfully!');
      setDeleteConfirm(false);
      onClose();
      if (onTradeDeleted) {
        onTradeDeleted(trade._id);
      }
    } catch (error) {
      console.error('Error deleting trade:', error);
      toast.error('Failed to delete trade');
    }
  };

  if (!isOpen || !trade) return null;

  const pnl = trade.exitPrice ? 
    (trade.type === 'BUY' ? 
      (trade.exitPrice - trade.entryPrice) * trade.quantity : 
      (trade.entryPrice - trade.exitPrice) * trade.quantity) 
    : 0;

  const isProfit = pnl > 0;
  const isLoss = pnl < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 cursor-pointer"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gray-900 rounded-lg shadow-2xl h-full flex flex-col animate-in fade-in-0 zoom-in-95 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold font-heading text-white">{trade.symbol}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {trade.type}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  trade.status === 'OPEN' ? 'bg-blue-500/20 text-blue-400' : 
                  trade.status === 'CLOSED' ? 'bg-gray-500/20 text-gray-400' : 
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {trade.status}
                </span>
              </div>
              {trade.status === 'CLOSED' && (
                <div className={`flex items-center space-x-1 ${
                  isProfit ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {isProfit ? <FiTrendingUp className="w-5 h-5" /> : 
                   isLoss ? <FiTrendingDown className="w-5 h-5" /> : 
                   <FiDollarSign className="w-5 h-5" />}
                  <span className="text-lg font-semibold font-mono tabular-nums">
                    ${Math.abs(pnl).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setDeleteConfirm(true)}
                className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors duration-200 cursor-pointer"
                title="Delete trade"
              >
                <FiTrash2 className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200 cursor-pointer"
              >
                <FiX className="w-6 h-6 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[400px] max-h-[600px]">
              {/* Image Section */}
              <div className="relative bg-gray-950 flex items-center justify-center p-4">
                {trade.image ? (
                  <div className="relative w-full h-full flex items-center justify-center max-h-[500px] group">
                    {!imageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                    <div className="relative cursor-pointer" onClick={() => setShowFullImage(true)}>
                      <img
                        src={trade.image?.startsWith('http') 
                          ? trade.image 
                          : `${API_BASE_URL}${trade.image?.startsWith('/') ? trade.image : `/uploads/trades/${trade.image}`}`
                        }
                        alt={`Trade ${trade.symbol}`}
                        className={`max-w-full max-h-full object-contain rounded-lg shadow-xl transition-all duration-500 hover:scale-105 ${
                          imageLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageLoaded(true)}
                        style={{ maxHeight: '450px' }}
                      />
                      
                      {/* Zoom Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-black/60 rounded-full p-3 backdrop-blur-sm">
                          <FiMaximize2 className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-500 h-64">
                    <FiFileText className="w-16 h-16 mb-4" />
                    <p className="text-lg">No screenshot available</p>
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="p-6 space-y-4 overflow-y-auto max-h-[600px]">
                {/* Trade Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Entry Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold font-heading text-white border-b border-gray-800 pb-2">
                      Entry Details
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 flex items-center">
                          <FiDollarSign className="w-4 h-4 mr-2" />
                          Entry Price
                        </span>
                        <span className="text-white font-medium font-mono tabular-nums">${trade.entryPrice}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 flex items-center">
                          <FiTarget className="w-4 h-4 mr-2" />
                          Quantity
                        </span>
                        <span className="text-white font-medium font-mono tabular-nums">{trade.quantity}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 flex items-center">
                          <FiCalendar className="w-4 h-4 mr-2" />
                          Entry Date
                        </span>
                        <span className="text-white font-medium">
                          {new Date(trade.entryDate).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 flex items-center">
                          <FiClock className="w-4 h-4 mr-2" />
                          Entry Time
                        </span>
                        <span className="text-white font-medium">
                          {trade.entryTime || 'Not specified'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Exit Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold font-heading text-white border-b border-gray-800 pb-2">
                      Exit Details
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 flex items-center">
                          <FiDollarSign className="w-4 h-4 mr-2" />
                          Exit Price
                        </span>
                        <span className="text-white font-medium font-mono tabular-nums">
                          {trade.exitPrice ? `$${trade.exitPrice}` : 'Open'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 flex items-center">
                          <FiCalendar className="w-4 h-4 mr-2" />
                          Exit Date
                        </span>
                        <span className="text-white font-medium">
                          {trade.exitDate ? new Date(trade.exitDate).toLocaleDateString() : 'Open'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 flex items-center">
                          <FiClock className="w-4 h-4 mr-2" />
                          Exit Time
                        </span>
                        <span className="text-white font-medium">
                          {trade.exitTime || 'Open'}
                        </span>
                      </div>
                      
                      {trade.status === 'CLOSED' && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                          <span className="text-gray-400 font-medium">P&L</span>
                          <span className={`font-bold text-lg ${
                            isProfit ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {isProfit ? '+' : ''}${pnl.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Strategy & Notes */}
                <div className="space-y-4">
                  {trade.strategy && (
                    <div>
                      <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2 mb-3">
                        Strategy
                      </h3>
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <p className="text-gray-300">{trade.strategy}</p>
                      </div>
                    </div>
                  )}
                  
                  {trade.notes && (
                    <div>
                      <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2 mb-3">
                        Notes
                      </h3>
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <p className="text-gray-300">{trade.notes}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Created</p>
                    <p className="text-white font-medium">
                      {new Date(trade.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Last Updated</p>
                    <p className="text-white font-medium">
                      {new Date(trade.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Image Overlay */}
      {showFullImage && trade.image && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
          <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-4 right-4 z-10 p-3 bg-black/60 hover:bg-black/80 rounded-full transition-colors duration-200 backdrop-blur-sm cursor-pointer"
            >
              <FiX className="w-6 h-6 text-white" />
            </button>

            {/* Minimize Button */}
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-4 left-4 z-10 p-3 bg-black/60 hover:bg-black/80 rounded-full transition-colors duration-200 backdrop-blur-sm cursor-pointer"
            >
              <FiMinimize2 className="w-6 h-6 text-white" />
            </button>

            {/* Full Size Image */}
            <img
              src={trade.image?.startsWith('http') 
                ? trade.image 
                : `${API_BASE_URL}${trade.image?.startsWith('/') ? trade.image : `/uploads/trades/${trade.image}`}`
              }
              alt={`Trade ${trade.symbol} - Full Size`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Image Info Overlay */}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="flex items-center space-x-3 text-white">
                <span className="font-heading font-semibold">{trade.symbol}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {trade.type}
                </span>
                <span className="text-gray-300 text-sm">
                  {new Date(trade.entryDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Click outside to close */}
          <div 
            className="absolute inset-0 -z-10 cursor-pointer" 
            onClick={() => setShowFullImage(false)}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
          onClick={() => setDeleteConfirm(false)}
        >
          <div 
            className="bg-gray-900 rounded-lg border border-gray-800 p-6 max-w-md w-full animate-in fade-in-0 zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
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
                    <span className="font-medium text-white">{trade.symbol}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {trade.type}
                    </span>
                  </div>
                  <span className="text-gray-400 text-sm">
                    {new Date(trade.entryDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTrade}
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeModal; 