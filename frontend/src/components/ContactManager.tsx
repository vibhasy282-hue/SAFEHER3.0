'use client';

import { useState, useEffect } from 'react';
import { contactAPI } from '@/lib/api';
import { Contact } from '@/types';
import { UserPlus, Phone, Mail, Shield, Trash2, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function ContactManager() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', relationship: 'family', isGuardian: false, notifyMethods: { sms: true, email: true, call: false } });

  useEffect(() => {
    loadContacts();
  }, []);

  const isOfflineGuest = () => {
    if (typeof window === 'undefined') return true;
    const token = localStorage.getItem('token');
    return !token || token === 'offline-guest-token';
  };

  const loadContacts = async () => {
    if (isOfflineGuest()) {
      setIsGuestMode(true);
      return;
    }
    try {
      const res = await contactAPI.getAll();
      setContacts(res.data.contacts || []);
    } catch (e) {
      // Silent fail for offline mode
      setContacts([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOfflineGuest()) {
      toast.error('Sign in to save contacts');
      return;
    }
    try {
      await contactAPI.create(formData);
      setFormData({ name: '', phone: '', email: '', relationship: 'family', isGuardian: false, notifyMethods: { sms: true, email: true, call: false } });
      setShowForm(false);
      loadContacts();
      toast.success('Contact added');
    } catch (e) {
      toast.error('Failed to add contact');
    }
  };

  const handleDelete = async (id: string) => {
    if (isOfflineGuest()) return;
    try {
      await contactAPI.delete(id);
      loadContacts();
      toast.success('Contact removed');
    } catch (e) {
      toast.error('Failed to remove contact');
    }
  };

  return (
    <div className="glass rounded-2xl p-6 border border-white/5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-safeher-primary/20">
            <Shield className="w-5 h-5 text-safeher-primary" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Emergency Contacts</h3>
            <p className="text-xs text-safeher-muted">{contacts.length} contacts configured</p>
          </div>
        </div>
        {!isGuestMode && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="p-2 rounded-lg bg-safeher-primary/20 text-safeher-primary hover:bg-safeher-primary/30 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        )}
      </div>

      {isGuestMode ? (
        <div className="text-center py-8 flex flex-col items-center gap-2">
          <Shield className="w-12 h-12 mb-1 opacity-20" />
          <p className="font-medium text-white/40">Guest Mode</p>
          <p className="text-xs text-safeher-muted max-w-[220px] leading-relaxed">
            Log in to add emergency contacts. They'll be notified automatically during an SOS alert.
          </p>
        </div>
      ) : (
        <>
          <AnimatePresence>
            {showForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmit}
                className="mb-4 space-y-3 overflow-hidden"
              >
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-safeher-muted focus:outline-none focus:border-safeher-primary"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-safeher-muted focus:outline-none focus:border-safeher-primary"
                  required
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-safeher-muted focus:outline-none focus:border-safeher-primary"
                />
                <label className="flex items-center space-x-2 text-sm text-safeher-muted">
                  <input
                    type="checkbox"
                    checked={formData.isGuardian}
                    onChange={e => setFormData({ ...formData, isGuardian: e.target.checked })}
                    className="rounded border-white/20 bg-white/5"
                  />
                  <span>Set as guardian</span>
                </label>
                <div className="flex items-center space-x-4 text-sm text-safeher-muted">
                  <label className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={formData.notifyMethods.sms}
                      onChange={e => setFormData({ ...formData, notifyMethods: { ...formData.notifyMethods, sms: e.target.checked } })}
                      className="rounded border-white/20 bg-white/5"
                    />
                    <span>SMS</span>
                  </label>
                  <label className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={formData.notifyMethods.email}
                      onChange={e => setFormData({ ...formData, notifyMethods: { ...formData.notifyMethods, email: e.target.checked } })}
                      className="rounded border-white/20 bg-white/5"
                    />
                    <span>Email</span>
                  </label>
                  <label className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={formData.notifyMethods.call}
                      onChange={e => setFormData({ ...formData, notifyMethods: { ...formData.notifyMethods, call: e.target.checked } })}
                      className="rounded border-white/20 bg-white/5"
                    />
                    <span>Call</span>
                  </label>
                </div>
                <button type="submit" className="w-full py-2 bg-safeher-primary text-white rounded-lg hover:bg-safeher-primary/90 transition-colors">
                  Add Contact
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-hide">
            {contacts.length === 0 ? (
              <div className="text-center py-6 text-safeher-muted flex flex-col items-center">
                <UserPlus className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">No contacts yet — add one above</p>
              </div>
            ) : contacts.map((contact, i) => (
              <motion.div
                key={contact._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${contact.isGuardian ? 'bg-safeher-primary/20' : 'bg-white/10'}`}>
                    <span className="text-sm font-bold text-white">{contact.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white flex items-center space-x-1">
                      {contact.name}
                      {contact.isPrimary && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-safeher-muted">
                      <span className="flex items-center space-x-1"><Phone className="w-3 h-3" /><span>{contact.phone}</span></span>
                      {contact.email && <span className="flex items-center space-x-1"><Mail className="w-3 h-3" /><span>{contact.email}</span></span>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(contact._id)}
                  className="p-2 rounded-lg hover:bg-safeher-danger/20 text-safeher-muted hover:text-safeher-danger transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
