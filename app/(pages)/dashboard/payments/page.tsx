'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PaymentStats {
  totalEarnings: number;
  pendingEarnings: number;
  completedBookings: number;
  currency: string;
}

interface AccountStatus {
  hasAccount?: boolean;
  isFullyOnboarded?: boolean;
  accountStatus?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  onboardingCompleted?: boolean;
  detailsSubmitted?: boolean;
}

interface Transaction {
  _id: string;
  date: string;
  bookingNumber: string;
  status: string;
  currency: string;
  amount: number;
}

export default function ProfessionalPaymentsDashboard() {
  const router = useRouter();
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [checkingAccount, setCheckingAccount] = useState(true);
  const [stats, setStats] = useState<PaymentStats>({
    totalEarnings: 0,
    pendingEarnings: 0,
    completedBookings: 0,
    currency: 'EUR',
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

  useEffect(() => {
    loadPaymentData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPaymentData = async () => {
    try {
      // Load Stripe account status
      const accountResponse = await fetch(`${API_URL}/api/stripe/connect/account-status`, {
        credentials: 'include',
      });

      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        if (accountData.success) {
          setAccountStatus(accountData.data);
        }
      }
    } catch (err) {
      console.error('Error loading account status:', err);
    } finally {
      setCheckingAccount(false);
    }

    // Try to load stats (optional - won't break if endpoint doesn't exist)
    try {
      const statsResponse = await fetch(`${API_URL}/api/professional/payment-stats`, {
        credentials: 'include',
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }
    } catch {
      // Stats endpoint doesn't exist yet - that's fine
      console.log('Stats endpoint not available yet');
    }

    // Try to load transactions (optional)
    try {
      const transactionsResponse = await fetch(`${API_URL}/api/professional/transactions?limit=10`, {
        credentials: 'include',
      });

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        if (transactionsData.success) {
          setRecentTransactions(transactionsData.data);
        }
      }
    } catch {
      // Transactions endpoint doesn't exist yet - that's fine
      console.log('Transactions endpoint not available yet');
    }
  };

  const handleSetupStripe = () => {
    router.push('/professional/stripe/setup');
  };

  const handleOpenDashboard = async () => {
    try {
      const response = await fetch('/api/stripe/connect/dashboard-link', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Error opening dashboard:', err);
    }
  };

  if (checkingAccount) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Determine if Stripe is connected
  const hasAccount = accountStatus?.hasAccount || false;
  const isFullyOnboarded = accountStatus?.isFullyOnboarded || false;
  const needsSetup = !hasAccount || !isFullyOnboarded;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600 mt-1">Manage your Stripe account and view earnings</p>
      </div>

      {/* Stripe Account Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Stripe Account</h2>
          {isFullyOnboarded && (
            <button
              onClick={handleOpenDashboard}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Open Dashboard →
            </button>
          )}
        </div>

        {needsSetup ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <svg className="h-6 w-6 text-blue-600 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-blue-900 font-semibold mb-1">
                  {!hasAccount ? 'Connect Your Stripe Account' : 'Complete Your Stripe Setup'}
                </h3>
                <p className="text-blue-800 text-sm mb-4">
                  {!hasAccount
                    ? 'You need to connect your Stripe account to receive payments from customers. This only takes a few minutes.'
                    : 'Your Stripe account setup is incomplete. Complete it to start receiving payments.'
                  }
                </p>
                <button
                  onClick={handleSetupStripe}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium"
                >
                  {!hasAccount ? 'Connect Stripe Account' : 'Complete Setup'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Account Active</h3>
                <p className="text-gray-600 text-sm">Your account is ready to receive payments</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-lg font-semibold text-gray-900 mt-1 capitalize">
                  {accountStatus?.accountStatus || 'Active'}
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">Charges</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {accountStatus?.chargesEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">Payouts</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {accountStatus?.payoutsEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Earnings Summary - Only show if connected */}
      {isFullyOnboarded && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm">Total Earnings</p>
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {stats.currency} {stats.totalEarnings.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                From {stats.completedBookings} completed bookings
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm">Pending Earnings</p>
                <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {stats.currency} {stats.pendingEarnings.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                From active bookings
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm">Completed Jobs</p>
                <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {stats.completedBookings}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                All time
              </p>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Transactions</h2>

            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="mt-2 text-gray-600">No transactions yet</p>
                <p className="text-sm text-gray-500">Transactions will appear here once you complete bookings</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Booking
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentTransactions.map((transaction) => (
                      <tr key={transaction._id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          #{transaction.bookingNumber}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                          {transaction.currency} {transaction.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
