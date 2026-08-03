'use client';

import { useState } from 'react';
import { Mail, Send, Users, Gift, MessageSquare, FileText } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';

export default function EmailManagementPage() {
  const [activeTab, setActiveTab] = useState<'broadcast' | 'promotional' | 'review' | 'invite' | 'message' | 'subscribers' | 'stats'>('broadcast');

  return (
    <ProtectedRoute>
      <DashboardLayout title="Email Management" subtitle="Send emails to customers">
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto border-b border-black/10">
            <TabButton
              active={activeTab === 'broadcast'}
              onClick={() => setActiveTab('broadcast')}
              icon={<Users size={18} />}
              label="Broadcast"
            />
            <TabButton
              active={activeTab === 'promotional'}
              onClick={() => setActiveTab('promotional')}
              icon={<Gift size={18} />}
              label="Promotional"
            />
            <TabButton
              active={activeTab === 'review'}
              onClick={() => setActiveTab('review')}
              icon={<MessageSquare size={18} />}
              label="Review Request"
            />
            <TabButton
              active={activeTab === 'invite'}
              onClick={() => setActiveTab('invite')}
              icon={<Mail size={18} />}
              label="Invite"
            />
            <TabButton
              active={activeTab === 'message'}
              onClick={() => setActiveTab('message')}
              icon={<FileText size={18} />}
              label="Custom Message"
            />
            <TabButton
              active={activeTab === 'subscribers'}
              onClick={() => setActiveTab('subscribers')}
              icon={<Users size={18} />}
              label="Subscribers"
            />
            <TabButton
              active={activeTab === 'stats'}
              onClick={() => setActiveTab('stats')}
              icon={<Send size={18} />}
              label="Statistics"
            />
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg border border-black/10 p-6">
            {activeTab === 'broadcast' && <BroadcastForm />}
            {activeTab === 'promotional' && <PromotionalForm />}
            {activeTab === 'review' && <ReviewRequestForm />}
            {activeTab === 'invite' && <InviteForm />}
            {activeTab === 'message' && <CustomMessageForm />}
            {activeTab === 'subscribers' && <SubscribersPanel />}
            {activeTab === 'stats' && <EmailStats />}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition font-bold whitespace-nowrap ${
        active ? 'border-coral text-coral' : 'border-transparent text-black/60 hover:text-black'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function BroadcastForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result: any = await apiService.sendBroadcast({
        title: String(formData.get('title') || ''),
        subject: String(formData.get('subject') || ''),
        message: String(formData.get('message') || '')
      });
      setMessage(`✅ Email sent to ${result.sent} users (${result.failed} failed)`);
      if (e.currentTarget) e.currentTarget.reset();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-bold">Send Broadcast Message to All Users</h3>

      <div>
        <label className="block text-sm font-bold mb-2">Title</label>
        <input
          type="text"
          name="title"
          placeholder="e.g., Summer Sale Announcement"
          required
          className="w-full px-4 py-2 border border-black/10 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-bold mb-2">Subject Line</label>
        <input
          type="text"
          name="subject"
          placeholder="Email subject line"
          required
          className="w-full px-4 py-2 border border-black/10 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-bold mb-2">Message (supports line breaks)</label>
        <textarea
          name="message"
          placeholder="Your message content..."
          rows={6}
          required
          className="w-full px-4 py-2 border border-black/10 rounded-lg"
        />
      </div>

      {message && <p className="text-sm font-bold text-coral">{message}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-coral text-white px-6 py-2 rounded-lg font-bold hover:bg-coral/90 disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send to All Users'}
      </button>
    </form>
  );
}

function PromotionalForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result: any = await apiService.sendPromotional({
        title: String(formData.get('title') || ''),
        message: String(formData.get('message') || ''),
        promoCode: String(formData.get('promoCode') || ''),
        discount: parseInt(formData.get('discount') as string) || 0
      });
      setMessage(`✅ Promotional email sent to ${result.sent} users`);
      if (e.currentTarget) e.currentTarget.reset();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-bold">Send Promotional Email</h3>

      <div>
        <label className="block text-sm font-bold mb-2">Offer Title</label>
        <input
          type="text"
          name="title"
          placeholder="e.g., 20% OFF Summer Collection"
          required
          className="w-full px-4 py-2 border border-black/10 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-bold mb-2">Message</label>
        <textarea
          name="message"
          placeholder="Describe your promotional offer..."
          rows={4}
          required
          className="w-full px-4 py-2 border border-black/10 rounded-lg"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold mb-2">Promo Code</label>
          <input
            type="text"
            name="promoCode"
            placeholder="e.g., SUMMER20"
            className="w-full px-4 py-2 border border-black/10 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">Discount %</label>
          <input
            type="number"
            name="discount"
            placeholder="20"
            min="0"
            max="100"
            className="w-full px-4 py-2 border border-black/10 rounded-lg"
          />
        </div>
      </div>

      {message && <p className="text-sm font-bold text-coral">{message}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-coral text-white px-6 py-2 rounded-lg font-bold hover:bg-coral/90 disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send Promotional Email'}
      </button>
    </form>
  );
}

function ReviewRequestForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      await apiService.sendReviewRequest(String(formData.get('orderId') || ''), String(formData.get('customMessage') || ''));
      setMessage('✅ Review request email sent!');
      if (e.currentTarget) e.currentTarget.reset();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-bold">Send Review Request Email</h3>

      <div>
        <label className="block text-sm font-bold mb-2">Order ID</label>
        <input
          type="text"
          name="orderId"
          placeholder="Enter order ID"
          required
          className="w-full px-4 py-2 border border-black/10 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-bold mb-2">Custom Message (Optional)</label>
        <textarea
          name="customMessage"
          placeholder="Leave blank to use default message..."
          rows={3}
          className="w-full px-4 py-2 border border-black/10 rounded-lg"
        />
      </div>

      {message && <p className="text-sm font-bold text-coral">{message}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-coral text-white px-6 py-2 rounded-lg font-bold hover:bg-coral/90 disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send Review Request'}
      </button>
    </form>
  );
}

function InviteForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      await apiService.sendInvite({
        email: String(formData.get('email') || ''),
        message: String(formData.get('message') || '')
      });

      setMessage('✅ Invite email sent!');
      if (e.currentTarget) e.currentTarget.reset();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-bold">Send Invite Email</h3>

      <div>
        <label className="block text-sm font-bold mb-2">Email Address</label>
        <input
          type="email"
          name="email"
          placeholder="friend@example.com"
          required
          className="w-full px-4 py-2 border border-black/10 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-bold mb-2">Personal Message (Optional)</label>
        <textarea
          name="message"
          placeholder="Add a personal note..."
          rows={3}
          className="w-full px-4 py-2 border border-black/10 rounded-lg"
        />
      </div>

      {message && <p className="text-sm font-bold text-coral">{message}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-coral text-white px-6 py-2 rounded-lg font-bold hover:bg-coral/90 disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send Invite'}
      </button>
    </form>
  );
}

function CustomMessageForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      await apiService.sendCustomUserMessage({
        userId: String(formData.get('userId') || ''),
        subject: String(formData.get('subject') || ''),
        message: String(formData.get('message') || '')
      });

      setMessage('✅ Message sent to user!');
      if (e.currentTarget) e.currentTarget.reset();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-bold">Send Custom Message to User</h3>

      <div>
        <label className="block text-sm font-bold mb-2">User ID</label>
        <input
          type="text"
          name="userId"
          placeholder="Enter user ID"
          required
          className="w-full px-4 py-2 border border-black/10 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-bold mb-2">Subject</label>
        <input
          type="text"
          name="subject"
          placeholder="Email subject"
          required
          className="w-full px-4 py-2 border border-black/10 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-bold mb-2">Message</label>
        <textarea
          name="message"
          placeholder="Your message..."
          rows={4}
          required
          className="w-full px-4 py-2 border border-black/10 rounded-lg"
        />
      </div>

      {message && <p className="text-sm font-bold text-coral">{message}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-coral text-white px-6 py-2 rounded-lg font-bold hover:bg-coral/90 disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}

function EmailStats() {
  const { data, loading, error } = useFetch<any>(() => apiService.getEmailStats(), { skip: false });
  const stats = data || {};

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Email Statistics</h3>
      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Estimated Emails Sent" value={loading ? '...' : String(stats.estimatedEmailsSent || 0)} />
        <StatCard label="Total Users" value={loading ? '...' : String(stats.totalUsers || 0)} />
        <StatCard label="Active Subscribers" value={loading ? '...' : String(stats.activeSubscribers || 0)} />
        <StatCard label="Invoices Sent" value={loading ? '...' : String(stats.invoicesSent || 0)} />
      </div>

      <div className="bg-black/5 p-4 rounded-lg">
        <p className="text-sm text-black/60">
          Broadcast and promotional emails are sent to registered users plus active newsletter subscribers, deduped by email.
        </p>
      </div>
    </div>
  );
}

function SubscribersPanel() {
  const { data: statsData, loading: statsLoading } = useFetch<any>(() => apiService.getNewsletterStats(), { skip: false });
  const { data, loading, error } = useFetch<any>(() => apiService.getNewsletterSubscribers(false), { skip: false });
  const subscribers = Array.isArray(data) ? data : [];
  const stats = statsData || {};

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold">Newsletter Subscribers</h3>
        <p className="mt-1 text-sm text-black/60">
          These people joined from the storefront footer and receive new drops, restocks, and promotional campaigns.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Subscribers" value={statsLoading ? '...' : String(stats.total || 0)} />
        <StatCard label="Active" value={statsLoading ? '...' : String(stats.active || 0)} />
        <StatCard label="Unsubscribed" value={statsLoading ? '...' : String(stats.unsubscribed || 0)} />
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-lg border border-black/10">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Subscribed</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6 text-black/60" colSpan={4}>Loading subscribers...</td></tr>
            ) : subscribers.length === 0 ? (
              <tr><td className="px-4 py-6 text-black/60" colSpan={4}>No subscribers yet.</td></tr>
            ) : (
              subscribers.map((subscriber: any) => (
                <tr key={subscriber.id} className="border-t border-black/10">
                  <td className="px-4 py-3 font-bold">{subscriber.email}</td>
                  <td className="px-4 py-3 text-black/60">{subscriber.source || 'footer'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-1 text-xs font-black ${subscriber.isActive ? 'bg-green-100 text-green-700' : 'bg-black/10 text-black/60'}`}>
                      {subscriber.isActive ? 'Active' : 'Unsubscribed'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-black/60">{subscriber.subscribedAt ? new Date(subscriber.subscribedAt).toLocaleDateString('en-IN') : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: any) {
  return (
    <div className="bg-gradient-to-br from-coral/10 to-mint/10 p-4 rounded-lg border border-black/10">
      <p className="text-sm font-bold text-black/60 mb-2">{label}</p>
      <p className="text-3xl font-black text-coral">{value}</p>
    </div>
  );
}
