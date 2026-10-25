import React from 'react';
import { Plus, Trash2, Globe, Mail, MessageCircle, ExternalLink, Share2 } from 'lucide-react';

export const SOCIAL_PLATFORMS = [
  { id: 'Instagram', name: 'Instagram', placeholder: '@username or URL', prefix: 'https://instagram.com/' },
  { id: 'Gmail / Email', name: 'Gmail / Email', placeholder: 'user@gmail.com', prefix: 'mailto:' },
  { id: 'WhatsApp', name: 'WhatsApp', placeholder: '+1 234 567 8900', prefix: 'https://wa.me/' },
  { id: 'Facebook', name: 'Facebook', placeholder: 'username or URL', prefix: 'https://facebook.com/' },
  { id: 'LinkedIn', name: 'LinkedIn', placeholder: 'in/username or URL', prefix: 'https://linkedin.com/in/' },
  { id: 'X / Twitter', name: 'X / Twitter', placeholder: '@handle or URL', prefix: 'https://x.com/' },
  { id: 'Telegram', name: 'Telegram', placeholder: '@username or URL', prefix: 'https://t.me/' },
  { id: 'TikTok', name: 'TikTok', placeholder: '@username or URL', prefix: 'https://tiktok.com/@' },
  { id: 'Other', name: 'Other', placeholder: 'https://...', prefix: '' },
];

export function getPlatformLink(platform, value) {
  if (!value) return '';
  const val = value.trim();
  if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('mailto:')) {
    return val;
  }
  const cleanVal = val.replace(/^@/, '');
  switch (platform) {
    case 'Instagram':
      return `https://instagram.com/${cleanVal}`;
    case 'Gmail / Email':
      return `mailto:${val}`;
    case 'WhatsApp':
      return `https://wa.me/${val.replace(/[^0-9]/g, '')}`;
    case 'Facebook':
      return `https://facebook.com/${cleanVal}`;
    case 'LinkedIn':
      return cleanVal.includes('linkedin.com') ? `https://${cleanVal}` : `https://linkedin.com/in/${cleanVal}`;
    case 'X / Twitter':
      return `https://x.com/${cleanVal}`;
    case 'Telegram':
      return `https://t.me/${cleanVal}`;
    case 'TikTok':
      return `https://tiktok.com/@${cleanVal}`;
    default:
      return val.startsWith('http') ? val : `https://${val}`;
  }
}

export default function SocialLinksEditor({ links = [], onChange, disabled = false, isLoggedIn = true }) {
  const handleAdd = () => {
    const newLink = {
      id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      platform: 'Instagram',
      url: ''
    };
    onChange([...links, newLink]);
  };

  const handleUpdate = (index, field, value) => {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleRemove = (index) => {
    onChange(links.filter((_, i) => i !== index));
  };

  return (
    <div className="social-links-container">
      <div className="d-flex align-center justify-between mb-2">
        <label className="form-label" style={{ marginBottom: 0 }}>Social & Communication Links</label>
        {!disabled && (
          <button
            type="button"
            onClick={handleAdd}
            className="btn btn-outline"
            style={{ padding: '4px 10px', fontSize: '0.78rem', gap: '4px' }}
          >
            <Plus size={14} /> Add Link
          </button>
        )}
      </div>

      {links.length === 0 && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-hint)', fontStyle: 'italic', padding: '6px 0' }}>
          No social links added yet.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {links.map((link, index) => {
          const href = getPlatformLink(link.platform, link.url);
          const platformInfo = SOCIAL_PLATFORMS.find(p => p.id === link.platform) || SOCIAL_PLATFORMS[0];

          return (
            <div 
              key={link.id || index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--background-color)',
                padding: '6px 8px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                flexWrap: 'wrap'
              }}
            >
              {/* Platform Selector */}
              <select
                className="form-control"
                value={link.platform}
                onChange={(e) => handleUpdate(index, 'platform', e.target.value)}
                disabled={disabled}
                style={{ 
                  width: '130px', 
                  flexShrink: 0, 
                  padding: '6px 8px', 
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--surface-color)'
                }}
              >
                {SOCIAL_PLATFORMS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              {/* URL / Handle Input */}
              <input
                type="text"
                className="form-control"
                placeholder={platformInfo.placeholder}
                value={link.url || ''}
                onChange={(e) => handleUpdate(index, 'url', e.target.value)}
                disabled={disabled}
                style={{ flex: 1, minWidth: '130px', padding: '6px 10px', fontSize: '0.85rem' }}
              />

              {/* Quick View / Test Link */}
              {link.url && (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-text"
                  style={{ padding: '6px', color: 'var(--primary-color)' }}
                  title={`Open ${link.platform}`}
                >
                  <ExternalLink size={15} />
                </a>
              )}

              {/* Remove Button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="btn btn-text"
                  style={{ padding: '6px', color: 'var(--error-color)' }}
                  title="Remove link"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Display badges for filled social links (used in SidePanel preview and cards)
 */
export function SocialLinkBadges({ links = [], isLoggedIn = true }) {
  if (!links || links.length === 0) return null;

  const validLinks = links.filter(l => l.url && l.url.trim() !== '');
  if (validLinks.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
      {validLinks.map((link, idx) => {
        const href = getPlatformLink(link.platform, link.url);
        return (
          <a
            key={link.id || idx}
            href={isLoggedIn ? href : '#'}
            target={isLoggedIn ? "_blank" : "_self"}
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!isLoggedIn) e.preventDefault();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary-color)',
              border: '1px solid var(--border-color)',
              textDecoration: 'none',
              transition: 'all 0.15s ease'
            }}
            title={isLoggedIn ? `${link.platform}: ${link.url}` : 'Sign in to view link'}
          >
            <span>{link.platform}</span>
            {isLoggedIn && <ExternalLink size={11} />}
          </a>
        );
      })}
    </div>
  );
}
