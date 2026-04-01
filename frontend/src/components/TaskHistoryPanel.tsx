'use client';

import { useEffect, useState } from 'react';
import { X, Package, Trash2, FolderOpen, FolderMinus, Share2, UserPlus, Download, Tag, RefreshCw, Upload } from 'lucide-react';
import api from '@/lib/axios';

interface ActivityLog {
  _id: string;
  action: string;
  details: string;
  createdAt: string;
}

interface TaskHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  refreshKey?: number;
}

const ACTION_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  product_add:         { label: 'Product Added',        icon: Package,     color: '#059669', bg: '#ECFDF5' },
  product_update:      { label: 'Product Updated',      icon: RefreshCw,   color: '#2563EB', bg: '#EFF6FF' },
  product_delete:      { label: 'Product Deleted',      icon: Trash2,      color: '#DC2626', bg: '#FEF2F2' },
  product_bulk_delete: { label: 'Bulk Delete Products', icon: Trash2,      color: '#DC2626', bg: '#FEF2F2' },
  product_bulk_import: { label: 'Products Imported',    icon: Upload,      color: '#7C3AED', bg: '#F5F3FF' },
  catalogue_create:    { label: 'Catalogue Created',    icon: FolderOpen,  color: '#D97706', bg: '#FFFBEB' },
  catalogue_delete:    { label: 'Catalogue Deleted',    icon: FolderMinus, color: '#DC2626', bg: '#FEF2F2' },
  catalogue_share:     { label: 'Catalogue Shared',     icon: Share2,      color: '#0891B2', bg: '#ECFEFF' },
  buyer_create:        { label: 'Buyer Created',        icon: UserPlus,    color: '#059669', bg: '#ECFDF5' },
  file_download:       { label: 'File Downloaded',      icon: Download,    color: '#7C3AED', bg: '#F5F3FF' },
  label_create:        { label: 'Label Created',        icon: Tag,         color: '#D97706', bg: '#FFFBEB' },
  label_download:      { label: 'Label Downloaded',     icon: Download,    color: '#D97706', bg: '#FFFBEB' },
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const groupByDate = (logs: ActivityLog[]) => {
  const groups: Record<string, ActivityLog[]> = {};
  logs.forEach(log => {
    const date = new Date(log.createdAt);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let key = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (date.toDateString() === today.toDateString()) key = 'Today';
    else if (date.toDateString() === yesterday.toDateString()) key = 'Yesterday';

    if (!groups[key]) groups[key] = [];
    groups[key].push(log);
  });
  return groups;
};

export default function TaskHistoryPanel({ isOpen, onClose, refreshKey }: TaskHistoryPanelProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api.get('/activity')
      .then(({ data }) => setLogs(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, refreshKey]);

  const grouped = groupByDate(logs);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose} />
      )}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, height: '100vh', width: '420px',
          background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
          zIndex: 50,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '18px', color: '#111827', margin: '0 0 4px 0' }}>Task History</h2>
            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>{logs.length} activities recorded</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#F3F4F6', border: 'none', borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} color="#6B7280" />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#9CA3AF' }}>Loading history...</div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <p style={{ color: '#9CA3AF', fontSize: '15px', fontWeight: 500 }}>No activity yet</p>
              <p style={{ color: '#D1D5DB', fontSize: '13px' }}>Actions like adding products, creating catalogues, etc. will appear here</p>
            </div>
          ) : (
            Object.entries(grouped).map(([dateLabel, items]) => (
              <div key={dateLabel} style={{ marginBottom: '24px' }}>
                <div style={{
                  fontSize: '11px', fontWeight: 700, color: '#9CA3AF',
                  textTransform: 'uppercase', letterSpacing: '0.8px',
                  marginBottom: '12px', padding: '0 4px',
                }}>{dateLabel}</div>
                
                <div style={{ position: 'relative' }}>
                  {/* Timeline line */}
                  <div style={{
                    position: 'absolute', left: '17px', top: '20px',
                    bottom: '20px', width: '2px', background: '#F3F4F6', zIndex: 0,
                  }} />
                  
                  {items.map(log => {
                    const config = ACTION_CONFIG[log.action] || {
                      label: log.action, icon: Package, color: '#6B7280', bg: '#F9FAFB'
                    };
                    const Icon = config.icon;
                    return (
                      <div key={log._id} style={{
                        display: 'flex', gap: '14px', marginBottom: '12px',
                        position: 'relative', zIndex: 1,
                      }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: config.bg, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', flexShrink: 0,
                          border: `2px solid ${config.color}20`,
                        }}>
                          <Icon size={16} color={config.color} />
                        </div>
                        <div style={{
                          flex: 1, background: '#F9FAFB', borderRadius: '10px',
                          padding: '10px 14px', border: '1px solid #F0F0F0',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{config.label}</span>
                            <span style={{ fontSize: '11px', color: '#9CA3AF', whiteSpace: 'nowrap', flexShrink: 0 }}>{formatTime(log.createdAt)}</span>
                          </div>
                          {log.details && (
                            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6B7280', lineHeight: '1.5' }}>{log.details}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
