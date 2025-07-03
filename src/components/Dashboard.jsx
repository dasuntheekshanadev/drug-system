import { useState, useEffect, useRef } from 'react';
import { getDashboard, addConsumption, updateConsumption, deleteConsumption } from '../api';
import Chart from 'chart.js/auto';

function Dashboard({ token }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [consumptionForm, setConsumptionForm] = useState({
    drugs: [{ type: 'cigarettes', brand: 'dunhill', unit: null, quantity: '', price: '' }]
  });
  const [editingEntry, setEditingEntry] = useState(null);
  const [error, setError] = useState('');
  const weeklyChartRef = useRef(null);
  const monthlyChartRef = useRef(null);
  const weeklyChartInstance = useRef(null);
  const monthlyChartInstance = useRef(null);

  useEffect(() => {
    fetchDashboard();
    return () => {
      if (weeklyChartInstance.current) weeklyChartInstance.current.destroy();
      if (monthlyChartInstance.current) monthlyChartInstance.current.destroy();
    };
  }, []);

  useEffect(() => {
    if (dashboardData) {
      createCharts();
    }
  }, [dashboardData]);

  const fetchDashboard = async () => {
    try {
      const data = await getDashboard(token);
      setDashboardData(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch dashboard data');
    }
  };

  const createCharts = () => {
    if (weeklyChartInstance.current) weeklyChartInstance.current.destroy();
    if (monthlyChartInstance.current) monthlyChartInstance.current.destroy();

    const weeklyCtx = weeklyChartRef.current.getContext('2d');
    const monthlyCtx = monthlyChartRef.current.getContext('2d');

    const chartColors = {
      quantity: {
        background: 'rgba(59, 130, 246, 0.8)',
        border: 'rgb(59, 130, 246)',
        gradient: 'linear-gradient(45deg, #3B82F6, #1E40AF)'
      },
      cost: {
        background: 'rgba(16, 185, 129, 0.8)',
        border: 'rgb(16, 185, 129)',
        gradient: 'linear-gradient(45deg, #10B981, #047857)'
      }
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            padding: 20,
            font: {
              size: 14,
              weight: 'bold'
            },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 12 },
          cornerRadius: 8,
          padding: 12
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Value',
            font: { size: 14, weight: 'bold' }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Drug Type',
            font: { size: 14, weight: 'bold' }
          },
          grid: {
            display: false
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    };

    weeklyChartInstance.current = new Chart(weeklyCtx, {
      type: 'bar',
      data: {
        labels: Object.keys(dashboardData.weeklyStats).map(drug => drug.charAt(0).toUpperCase() + drug.slice(1)),
        datasets: [
          {
            label: 'Quantity',
            data: Object.values(dashboardData.weeklyStats).map(stat => stat.quantity),
            backgroundColor: chartColors.quantity.background,
            borderColor: chartColors.quantity.border,
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false
          },
          {
            label: 'Cost (LKR)',
            data: Object.values(dashboardData.weeklyStats).map(stat => stat.cost),
            backgroundColor: chartColors.cost.background,
            borderColor: chartColors.cost.border,
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false
          }
        ]
      },
      options: chartOptions
    });

    monthlyChartInstance.current = new Chart(monthlyCtx, {
      type: 'bar',
      data: {
        labels: Object.keys(dashboardData.monthlyStats).map(drug => drug.charAt(0).toUpperCase() + drug.slice(1)),
        datasets: [
          {
            label: 'Quantity',
            data: Object.values(dashboardData.monthlyStats).map(stat => stat.quantity),
            backgroundColor: chartColors.quantity.background,
            borderColor: chartColors.quantity.border,
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false
          },
          {
            label: 'Cost (LKR)',
            data: Object.values(dashboardData.monthlyStats).map(stat => stat.cost),
            backgroundColor: chartColors.cost.background,
            borderColor: chartColors.cost.border,
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false
          }
        ]
      },
      options: chartOptions
    });
  };

  const handleAddDrug = () => {
    setConsumptionForm({
      drugs: [...consumptionForm.drugs, { type: 'cigarettes', brand: 'dunhill', unit: null, quantity: '', price: '' }]
    });
  };

  const handleDrugChange = (index, field, value) => {
    const newDrugs = [...consumptionForm.drugs];
    if (field === 'type') {
      newDrugs[index] = {
        ...newDrugs[index],
        type: value,
        brand: value === 'cigarettes' ? 'dunhill' : null,
        unit: value === 'cannabis' ? 'grams' : null
      };
    } else {
      newDrugs[index][field] = value;
    }
    setConsumptionForm({ drugs: newDrugs });
  };

  const handleSubmitConsumption = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const cleanedDrugs = consumptionForm.drugs.map(drug => ({
        type: drug.type,
        brand: drug.brand,
        unit: drug.unit,
        quantity: parseInt(drug.quantity) || 0,
        price: parseFloat(drug.price) || 0
      }));
      if (editingEntry) {
        await updateConsumption(token, editingEntry._id, { drugs: cleanedDrugs });
        setEditingEntry(null);
      } else {
        await addConsumption(token, { drugs: cleanedDrugs });
      }
      setConsumptionForm({ drugs: [{ type: 'cigarettes', brand: 'dunhill', unit: null, quantity: '', price: '' }] });
      fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save consumption');
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setConsumptionForm({ drugs: entry.drugs.map(drug => ({
      ...drug,
      quantity: drug.quantity.toString(),
      price: drug.price.toString()
    })) });
  };

  const handleDelete = async (entryId) => {
    try {
      await deleteConsumption(token, entryId);
      fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete consumption');
    }
  };

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-xl text-gray-700 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 text-lg">Track your consumption and manage your habits</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 animate-pulse">
            <p className="text-red-600 text-center font-medium">{error}</p>
          </div>
        )}
        
        {/* User Profile */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl mb-8 border border-gray-100 transform hover:scale-105 transition-all duration-300">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative">
              <img
                src={dashboardData.user.profilePicture || 'https://via.placeholder.com/100'}
                alt="Profile"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-gradient-to-r from-blue-400 to-purple-400 shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">{dashboardData.user.username}</h2>
              <p className="text-gray-600 text-sm sm:text-base">Track your consumption in LKR</p>
              <div className="mt-2 inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Active User
              </div>
            </div>
          </div>
        </div>

        {/* Consumption Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
              {editingEntry ? '✏️ Edit Consumption' : '➕ Add Consumption'}
            </h2>
            {editingEntry && (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                Editing Mode
              </span>
            )}
          </div>
          
          <div className="space-y-6">
            {consumptionForm.drugs.map((drug, index) => (
              <div key={index} className="bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                    <select
                      value={drug.type}
                      onChange={(e) => handleDrugChange(index, 'type', e.target.value)}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
                    >
                      <option value="cigarettes">🚬 Cigarettes</option>
                      <option value="cannabis">🌿 Cannabis</option>
                      <option value="beer">🍺 Beer</option>
                      <option value="arrack">🥃 Arrack</option>
                    </select>
                  </div>
                  
                  {drug.type === 'cigarettes' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Brand</label>
                      <select
                        value={drug.brand}
                        onChange={(e) => handleDrugChange(index, 'brand', e.target.value)}
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
                      >
                        <option value="dunhill">Dunhill</option>
                        <option value="gold leaf">Gold Leaf</option>
                        <option value="gold leaf short">Gold Leaf Short</option>
                        <option value="foreign cigarette">Foreign Cigarette</option>
                      </select>
                    </div>
                  )}
                  
                  {drug.type === 'cannabis' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Unit</label>
                      <select
                        value={drug.unit}
                        onChange={(e) => handleDrugChange(index, 'unit', e.target.value)}
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
                      >
                        <option value="grams">Grams</option>
                        <option value="pieces">Pieces</option>
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                    <input
                      type="number"
                      value={drug.quantity}
                      onChange={(e) => handleDrugChange(index, 'quantity', e.target.value)}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      placeholder="Enter quantity"
                      required
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price (LKR)</label>
                    <input
                      type="number"
                      value={drug.price}
                      onChange={(e) => handleDrugChange(index, 'price', e.target.value)}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      placeholder="Enter price"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={handleAddDrug}
                className="flex-1 sm:flex-none bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                ➕ Add Drug
              </button>
              <button
                type="button"
                onClick={handleSubmitConsumption}
                className="flex-1 sm:flex-none bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                {editingEntry ? '✅ Update' : '💾 Save'}
              </button>
              {editingEntry && (
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="flex-1 sm:flex-none bg-gray-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  ❌ Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats with Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 mb-8">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-100">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 flex items-center">
              📊 Weekly Stats
            </h2>
            <div className="h-64 sm:h-80 mb-6">
              <canvas ref={weeklyChartRef}></canvas>
            </div>
            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl">
              {Object.entries(dashboardData.weeklyStats).map(([drug, stats]) => (
                <div key={drug} className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm">
                  <span className="capitalize font-semibold text-gray-700">{drug}</span>
                  <div className="text-right">
                    <div className="text-blue-600 font-bold">{stats.quantity} units</div>
                    <div className="text-green-600 font-bold">₨{stats.cost.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-100">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 flex items-center">
              📈 Monthly Stats
            </h2>
            <div className="h-64 sm:h-80 mb-6">
              <canvas ref={monthlyChartRef}></canvas>
            </div>
            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl">
              {Object.entries(dashboardData.monthlyStats).map(([drug, stats]) => (
                <div key={drug} className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm">
                  <span className="capitalize font-semibold text-gray-700">{drug}</span>
                  <div className="text-right">
                    <div className="text-blue-600 font-bold">{stats.quantity} units</div>
                    <div className="text-green-600 font-bold">₨{stats.cost.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Consumption History */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl mb-8 border border-gray-100">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 flex items-center">
            📋 Consumption History
          </h2>
          <div className="space-y-4">
            {dashboardData.consumptionHistory.map((entry) => (
              <div key={entry._id} className="bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-200 hover:bg-gray-100 transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                  <p className="text-gray-600 font-medium text-sm sm:text-base">
                    📅 {new Date(entry.date).toLocaleString()}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-xl font-semibold hover:from-yellow-500 hover:to-orange-500 transform hover:scale-105 transition-all duration-200 shadow-md text-sm"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry._id)}
                      className="bg-gradient-to-r from-red-400 to-pink-400 text-white px-4 py-2 rounded-xl font-semibold hover:from-red-500 hover:to-pink-500 transform hover:scale-105 transition-all duration-200 shadow-md text-sm"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {entry.drugs.map((drug, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="capitalize font-semibold text-gray-800 text-sm sm:text-base">
                            {drug.type}
                            {drug.brand ? ` (${drug.brand})` : ''}
                            {drug.unit ? ` (${drug.unit})` : ''}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-blue-600 font-bold text-sm">
                            {drug.quantity} {drug.unit || 'units'}
                          </div>
                          <div className="text-green-600 font-bold text-sm">
                            ₨{drug.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Other Users' Stats */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-100">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 flex items-center">
            👥 Community Stats
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {dashboardData.otherUsersStats.map((user, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 sm:p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={user.profilePicture || 'https://via.placeholder.com/50'}
                      alt={user.username}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-3 border-white shadow-lg"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm sm:text-base">{user.username}</p>
                    <div className="mt-1 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Units:</span>
                        <span className="text-blue-600 font-bold text-xs">{user.totalConsumption}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Spent:</span>
                        <span className="text-green-600 font-bold text-xs">₨{user.totalSpent.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;