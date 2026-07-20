'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut, Loader2, Eye, EyeOff, Package, Heart, MapPin, Lock, Palette } from 'lucide-react';
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

  const [tab, setTab] = useState<'profile' | 'orders' | 'wishlist' | 'addresses' | 'security' | 'custom-orders'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [customDesigns, setCustomDesigns] = useState<any[]>([]);

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
    if (tab === 'custom-orders') fetchCustomDesigns();
  }, [tab]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/ecommerce/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchWishlist = async () => {
    try {
      const res = await fetch(`${API_BASE}/ecommerce/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWishlist(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`${API_BASE}/ecommerce/addresses`, {
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

  const fetchCustomDesigns = async () => {
    try {
      const res = await fetch(`${API_BASE}/ecommerce/custom-designs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomDesigns(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching custom designs:', error);
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
            { id: 'profile', label: 'Profile', icon: <User size={16} /> },
            { id: 'orders', label: 'Orders', icon: <Package size={16} /> },
            { id: 'wishlist', label: 'Wishlist', icon: <Heart size={16} /> },
            { id: 'addresses', label: 'Addresses', icon: <MapPin size={16} /> },
            { id: 'custom-orders', label: 'Custom Orders', icon: <Palette size={16} /> },
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
            <h2 className="text-2xl font-black mb-6" style={{ color: 'var(--text-primary)' }}>Delivery Addresses</h2>
            {addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-4 rounded-lg border"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{addr.name}</h3>
                    <p style={{ color: 'var(--text-muted)' }} className="text-sm mb-1">{addr.phone}</p>
                    <p style={{ color: 'var(--text-muted)' }} className="text-sm mb-1">{addr.street}</p>
                    <p style={{ color: 'var(--text-muted)' }} className="text-sm">{addr.city}, {addr.state} {addr.pincode}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin size={48} className="mx-auto mb-4 opacity-50" style={{ color: 'var(--text-muted)' }} />
                <p style={{ color: 'var(--text-muted)' }} className="mb-4">No addresses saved yet</p>
                <Link href="/checkout" className="inline-block px-6 py-3 rounded-lg text-white font-bold" style={{ backgroundColor: 'var(--color-primary)' }}>
                  Add Address During Checkout
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Custom Orders Tab */}
        {tab === 'custom-orders' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-black mb-6" style={{ color: 'var(--text-primary)' }}>Custom Design Orders</h2>
            {customDesigns.length > 0 ? (
              <div className="grid gap-6">
                {customDesigns.map((design) => (
                  <div
                    key={design.id}
                    className="rounded-lg border p-6"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <div className="grid md:grid-cols-[200px_1fr] gap-6">
                      {design.images && design.images.length > 0 && (
                        <img src={design.images[0]} alt="Design" className="w-full h-auto rounded-lg object-cover" />
                      )}
                      <div className="flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>{design.title}</h3>
                          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{design.description}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Size:</span>
                              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{design.size}</p>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Color:</span>
                              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{design.color}</p>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Placement:</span>
                              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{design.placement}</p>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                              <p className="font-bold" style={{ color: design.status === 'APPROVED' ? 'var(--accent-primary)' : design.status === 'REJECTED' ? 'var(--text-secondary)' : 'var(--color-primary)' }}>
                                {design.status || 'PENDING'}
                              </p>
                            </div>
                          </div>
                          {design.price && (
                            <p className="mt-4 text-lg font-black" style={{ color: 'var(--color-primary)' }}>
                              ₹{design.price}
                            </p>
                          )}
                        </div>
                        <Link
                          href={`/custom-design?edit=${design.id}`}
                          className="mt-4 px-6 py-2 rounded-lg text-white font-bold text-center transition hover:opacity-90"
                          style={{ backgroundColor: 'var(--color-primary)' }}
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Palette size={48} className="mx-auto mb-4 opacity-50" style={{ color: 'var(--text-muted)' }} />
                <p style={{ color: 'var(--text-muted)' }} className="mb-4">No custom design orders yet</p>
                <Link href="/custom-design" className="inline-block px-6 py-3 rounded-lg text-white font-bold" style={{ backgroundColor: 'var(--color-primary)' }}>
                  Create a Custom Design
                </Link>
              </div>
            )}
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
