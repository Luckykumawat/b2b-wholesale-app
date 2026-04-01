'use client';

import { useEffect, useState } from 'react';
import { X, User, Mail, Phone, Building2, Calendar } from 'lucide-react';
import api from '@/lib/axios';

interface ProfileData {
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  createdAt?: string;
  role: string;
}

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfilePanel({ isOpen, onClose }: ProfilePanelProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api.get('/auth/me')
      .then(({ data }) => setProfile(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const getRoleBadgeColor = (role: string) => {
    if (role === 'superadmin') return '#7C3AED';
    if (role === 'admin') return '#059669';
    return '#6B7280';
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: '380px',
          background: '#fff',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
          zIndex: 50,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontWeight: 700, fontSize: '18px', color: '#111827', margin: 0 }}>My Profile</h2>
          <button
            onClick={onClose}
            style={{ background: '#F3F4F6', border: 'none', borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} color="#6B7280" />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#9CA3AF' }}>Loading...</div>
          ) : profile ? (
            <>
              {/* Avatar + Name + Role */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '16px', boxShadow: '0 4px 16px rgba(5,150,105,0.3)',
                }}>
                  <User size={36} color="#fff" />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '20px', color: '#111827', margin: '0 0 8px 0' }}>{profile.name}</h3>
                <span style={{
                  background: getRoleBadgeColor(profile.role),
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                }}>
                  {profile.role}
                </span>
              </div>

              {/* Fields */}
              {[
                { icon: Mail, label: 'Email', value: profile.email },
                { icon: Phone, label: 'Phone', value: profile.phone || '—' },
                { icon: Building2, label: 'Company Name', value: profile.companyName || '—' },
                { icon: Calendar, label: 'Account Created', value: formatDate(profile.createdAt) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '14px',
                  padding: '16px', background: '#F9FAFB', borderRadius: '12px',
                  marginBottom: '12px',
                }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#E5F9F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color="#059669" />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
                    <div style={{ fontSize: '15px', color: '#111827', fontWeight: 500 }}>{value}</div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#9CA3AF', marginTop: '80px' }}>Failed to load profile</div>
          )}
        </div>
      </div>
    </>
  );
}
