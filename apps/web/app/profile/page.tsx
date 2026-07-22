'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut, Loader2, Eye, EyeOff, Package, Heart, MapPin, Lock, User as UserIcon, Trash2, Plus, Check } from 'lucide-react';
import Link from 'next/link';
import { getApiBaseUrl } from '../lib/api';

const API_BASE = getApiBaseUrl();

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const changePassword = useAuthStore((state) => state.changePassword);

  const [tab, setTab] = useState<'profile' | 'orders' | 'wishlist' | 'addresses' | 'security'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    isDefault: false,
  });

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
    }
  }, [token, router]);

  useEffect(() => {
    if (tab === 'orders') fetchOrders();
    if (tab === 'wishlist') fetchWishlist();
    if (tab === 'addresses') fetchAddresses();
  }, [tab]);

  const fetchOrders = async () => {
    try {
      const url = typeof window !== 'undefined'
        ? `/api/proxy/ecommerce/orders`
        : `${API_BASE}/ecommerce/orders`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    }
  };

  const fetchWishlist = async () => {
    try {
      const url = typeof window !== 'undefined'
        ? `/api/proxy/ecommerce/wishlist`
        : `${API_BASE}/ecommerce/wishlist`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWishlist(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setWishlist([]);
    }
  };

  const fetchAddresses = async () => {
    try {
      const url = typeof window !== 'undefined'
        ? `/api/proxy/ecommerce/addresses`
        : `${API_BASE}/ecommerce/addresses`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const success = await updateProfile({
        name: formData.name,
        phone: formData.phone,
      });

      if (success) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        setIsEditing(false);
      } else {
        setMessage({ type: 'error', text: 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      setLoading(false);
      return;
    }

    try {
      const success = await changePassword(passwordData.currentPassword, passwordData.newPassword);

      if (success) {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        setIsChangingPassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: 'Failed to change password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error changing password' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setAddressForm({
      ...addressForm,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const url = typeof window !== 'undefined'
        ? `/api/proxy/ecommerce/addresses`
        : `${API_BASE}/ecommerce/addresses`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(addressForm)
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Address added successfully' });
        setIsAddingAddress(false);
        setAddressForm({
          fullName: '',
          phone: '',
          line1: '',
          line2: '',
          city: '',
          state: '',
          postalCode: '',
          isDefault: false,
        });
        fetchAddresses();
      } else {
        setMessage({ type: 'error', text: 'Failed to add address' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error adding address' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    setLoading(true);
    try {
      const url = typeof window !== 'undefined'
        ? `/api/proxy/ecommerce/addresses/${addressId}`
        : `${API_BASE}/ecommerce/addresses/${addressId}`;

      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Address deleted successfully' });
        fetchAddresses();
      } else {
        setMessage({ type: 'error', text: 'Failed to delete address' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error deleting address' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    setLoading(true);
    try {
      const url = typeof window !== 'undefined'
        ? `/api/proxy/ecommerce/addresses/${addressId}/set-default`
        : `${API_BASE}/ecommerce/addresses/${addressId}/set-default`;

      const res = await fetch(url, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Default address updated' });
        fetchAddresses();
      } else {
        setMessage({ type: 'error', text: 'Failed to set default address' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating default address' });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 font-bold mb-8 transition" style={{ color: 'var(--color-primary)' }}>
          <ArrowLeft size={18} />
          Back Home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>My Account</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your profile and preferences</p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`px-4 py-3 rounded-lg mb-6 ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b" style={{ borderColor: 'var(--border-color)' }}>
          {[
            { id: 'profile', label: 'Profile', icon: <UserIcon size={16} /> },
            { id: 'orders', label: 'Orders', icon: <Package size={16} /> },
            { id: 'wishlist', label: 'Wishlist', icon: <Heart size={16} /> },
            { id: 'addresses', label: 'Addresses', icon: <MapPin size={16} /> },
            { id: 'security', label: 'Security', icon: <Lock size={16} /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className="px-4 py-3 font-bold flex items-center gap-2 border-b-2 transition"
              style={{
                color: tab === t.id ? 'var(--color-primary)' : 'var(--text-muted)',
                borderColor: tab === t.id ? 'var(--color-primary)' : 'transparent',
              }}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="mx-auto max-w-2xl rounded-lg border p-8" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-2xl font-black mb-6" style={{ color: 'var(--text-primary)' }}>Account Information</h2>

            {!isEditing ? (
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold block mb-2" style={{ color: 'var(--text-muted)' }}>Name</label>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                </div>

                <div>
                  <label className="text-sm font-bold block mb-2" style={{ color: 'var(--text-muted)' }}>Email</label>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{user?.email}</p>
                </div>

                <div>
                  <label className="text-sm font-bold block mb-2" style={{ color: 'var(--text-muted)' }}>Phone</label>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{user?.phone || 'Not provided'}</p>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full text-white py-3 rounded-lg font-bold transition hover:opacity-90"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="text-sm font-bold block mb-2" style={{ color: 'var(--text-primary)' }}>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label className="text-sm font-bold block mb-2" style={{ color: 'var(--text-primary)' }}>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 text-white py-3 rounded-lg font-bold transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user?.name || '',
                        email: user?.email || '',
                        phone: user?.phone || '',
                      });
                    }}
                    className="flex-1 py-3 rounded-lg font-bold transition"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: `1px solid var(--border-color)` }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-black mb-6" style={{ color: 'var(--text-primary)' }}>Order History</h2>
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="block p-4 rounded-lg border transition hover:shadow-lg"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Order #{order.id?.slice(0, 8)}</p>
                        <p style={{ color: 'var(--text-muted)' }} className="text-sm">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold" style={{ color: 'var(--color-primary)' }}>₹{order.totalAmount}</p>
                        <p style={{ color: order.status === 'delivered' ? '#10b981' : 'var(--text-muted)' }} className="text-sm font-semibold">
                          {order.status}
                        </p>
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-muted)' }} className="text-sm">{order.items?.length || 0} items</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto mb-4 opacity-50" style={{ color: 'var(--text-muted)' }} />
                <p style={{ color: 'var(--text-muted)' }} className="mb-4">No orders yet</p>
                <Link href="/products" className="inline-block px-6 py-3 rounded-lg text-white font-bold" style={{ backgroundColor: 'var(--color-primary)' }}>
                  Start Shopping
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Wishlist Tab */}
        {tab === 'wishlist' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-black mb-6" style={{ color: 'var(--text-primary)' }}>Saved Items</h2>
            {wishlist.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlist.map((item) => (
                  <Link
                    key={item.id}
                    href={`/products/${item.slug}`}
                    className="p-4 rounded-lg border transition hover:shadow-lg"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <img src={item.images?.[0]?.url} alt={item.name} className="w-full h-40 object-cover rounded mb-3" />
                    <h3 className="font-bold line-clamp-2" style={{ color: 'var(--text-primary)' }}>{item.name}</h3>
                    <p className="font-bold mt-2" style={{ color: 'var(--color-primary)' }}>₹{item.price}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart size={48} className="mx-auto mb-4 opacity-50" style={{ color: 'var(--text-muted)' }} />
                <p style={{ color: 'var(--text-muted)' }} className="mb-4">No saved items yet</p>
                <Link href="/products" className="inline-block px-6 py-3 rounded-lg text-white font-bold" style={{ backgroundColor: 'var(--color-primary)' }}>
                  Browse Products
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Addresses Tab */}
        {tab === 'addresses' && (
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Delivery Addresses</h2>
              {!isAddingAddress && (
                <button
                  onClick={() => setIsAddingAddress(true)}
                  className="px-4 py-2 rounded-lg text-white font-bold flex items-center gap-2 transition hover:opacity-90"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <Plus size={18} />
                  Add Address
                </button>
              )}
            </div>

            {/* Add Address Form */}
            {isAddingAddress && (
              <form onSubmit={handleAddAddress} className="mb-8 p-6 rounded-lg border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Add New Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Full Name"
                    value={addressForm.fullName}
                    onChange={handleAddressChange}
                    required
                    className="px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={addressForm.phone}
                    onChange={handleAddressChange}
                    required
                    className="px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                  <input
                    type="text"
                    name="line1"
                    placeholder="Address Line 1"
                    value={addressForm.line1}
                    onChange={handleAddressChange}
                    required
                    className="px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 md:col-span-2"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                  <input
                    type="text"
                    name="line2"
                    placeholder="Address Line 2 (Optional)"
                    value={addressForm.line2}
                    onChange={handleAddressChange}
                    className="px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 md:col-span-2"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={addressForm.city}
                    onChange={handleAddressChange}
                    required
                    className="px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    value={addressForm.state}
                    onChange={handleAddressChange}
                    required
                    className="px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                  <input
                    type="text"
                    name="postalCode"
                    placeholder="Postal Code"
                    value={addressForm.postalCode}
                    onChange={handleAddressChange}
                    required
                    className="px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                </div>
                <label className="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={addressForm.isDefault}
                    onChange={handleAddressChange}
                    className="w-4 h-4"
                  />
                  <span style={{ color: 'var(--text-primary)' }} className="font-semibold">Set as default address</span>
                </label>
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 rounded-lg text-white font-bold transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Address'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingAddress(false);
                      setAddressForm({
                        fullName: '',
                        phone: '',
                        line1: '',
                        line2: '',
                        city: '',
                        state: '',
                        postalCode: '',
                        isDefault: false,
                      });
                    }}
                    className="flex-1 px-4 py-3 rounded-lg font-bold transition border"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Address List */}
            {addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-4 rounded-lg border relative"
                    style={{ borderColor: addr.isDefault ? 'var(--color-primary)' : 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', borderWidth: addr.isDefault ? '2px' : '1px' }}
                  >
                    {addr.isDefault && (
                      <div className="absolute top-4 right-4 px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-bold flex items-center gap-1">
                        <Check size={12} />
                        Default
                      </div>
                    )}
                    <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{addr.fullName}</h3>
                    <p style={{ color: 'var(--text-muted)' }} className="text-sm mb-1">{addr.phone}</p>
                    <p style={{ color: 'var(--text-muted)' }} className="text-sm mb-1">{addr.line1}</p>
                    {addr.line2 && <p style={{ color: 'var(--text-muted)' }} className="text-sm mb-1">{addr.line2}</p>}
                    <p style={{ color: 'var(--text-muted)' }} className="text-sm mb-4">{addr.city}, {addr.state} {addr.postalCode}</p>
                    <div className="flex gap-2">
                      {!addr.isDefault && (
                        <button
                          onClick={() => handleSetDefault(addr.id)}
                          className="flex-1 px-3 py-2 rounded text-sm font-semibold border transition hover:opacity-70"
                          style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="px-3 py-2 rounded text-sm font-semibold border transition hover:opacity-70 text-red-500"
                        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : !isAddingAddress ? (
              <div className="text-center py-12">
                <MapPin size={48} className="mx-auto mb-4 opacity-50" style={{ color: 'var(--text-muted)' }} />
                <p style={{ color: 'var(--text-muted)' }} className="mb-4">No addresses saved yet</p>
                <button
                  onClick={() => setIsAddingAddress(true)}
                  className="inline-block px-6 py-3 rounded-lg text-white font-bold"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Add Your First Address
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* Security Tab */}
        {tab === 'security' && (
          <div className="mx-auto max-w-2xl rounded-lg border p-8" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-2xl font-black mb-6" style={{ color: 'var(--text-primary)' }}>Security Settings</h2>

            {!isChangingPassword ? (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="w-full py-3 rounded-lg font-bold transition"
                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--color-primary)', border: `2px solid var(--color-primary)` }}
              >
                Change Password
              </button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="text-sm font-bold block mb-2" style={{ color: 'var(--text-primary)' }}>Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition"
                      style={{
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-3"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold block mb-2" style={{ color: 'var(--text-primary)' }}>New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition"
                      style={{
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-3"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold block mb-2" style={{ color: 'var(--text-primary)' }}>Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition"
                      style={{
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-3"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 text-white py-3 rounded-lg font-bold transition hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="flex-1 py-3 rounded-lg font-bold transition"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: `1px solid var(--border-color)` }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full mt-6 text-white py-3 rounded-lg font-bold transition hover:opacity-90 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#ef4444' }}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function User({ size }: { size: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/></svg>;
}
