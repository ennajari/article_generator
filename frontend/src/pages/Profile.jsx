import { useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import Layout from '../components/Layout';
import { User, Mail } from 'lucide-react';

export default function Profile() {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    fullName: user?.fullName || ''
  });

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your account information</p>
        </div>

        {/* Profile Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Account Information</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Username
              </label>
              <input
                type="text"
                disabled
                value={formData.username}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-gray-500">Username cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                disabled
                value={formData.email}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                disabled
                value={formData.fullName || 'Not provided'}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
              />
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Account Status</h3>
                  <p className="text-sm text-gray-500">
                    Role: <span className="font-medium text-gray-700">{user?.role}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Member since:{' '}
                    <span className="font-medium text-gray-700">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : 'Unknown'}
                    </span>
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Stats */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Account Overview</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="border border-gray-200 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">Last Login</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
              </dd>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">Account Type</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900 capitalize">{user?.role}</dd>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}