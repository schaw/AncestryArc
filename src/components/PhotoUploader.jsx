import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, Upload, Link2, Users, User, ArrowUpRight, Check } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';
import { uploadFamilyPhoto } from '../firebase/storageService';

const PHOTO_SLOTS = [
  {
    key: 'avatar',
    title: '1. Self Image',
    subtitle: 'Main portrait shown on graph nodes & tree cards',
    icon: User,
    badgeColor: 'var(--primary-color)'
  },
  {
    key: 'familyAbove',
    title: '2. With Family Above',
    subtitle: 'Photo with parents, grandparents & elders',
    icon: Users,
    badgeColor: 'var(--secondary-color)'
  },
  {
    key: 'familyBelow',
    title: '3. With Family Downstream',
    subtitle: 'Photo with children, spouse & descendants',
    icon: Users,
    badgeColor: 'var(--accent-color)'
  }
];

export default function PhotoUploader({ photos = {}, onChange, disabled = false, isLoggedIn = true, personId = '' }) {
  const [activeUrlInput, setActiveUrlInput] = useState(null); // which slot is entering URL
  const [tempUrl, setTempUrl] = useState('');
  const [compressingSlot, setCompressingSlot] = useState(null);

  const fileInputRefs = {
    avatar: useRef(null),
    familyAbove: useRef(null),
    familyBelow: useRef(null)
  };

  const handleFileSelect = async (slotKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCompressingSlot(slotKey);
      // 1. Client-side compression to lightweight WebP (typically 60KB - 120KB)
      const compressedDataUrl = await compressImage(file, 800, 800, 0.82);
      
      // 2. Upload to Firebase Storage if available, else keep compressed data URL
      const finalUrl = await uploadFamilyPhoto(personId, slotKey, compressedDataUrl);

      onChange({
        ...photos,
        [slotKey]: finalUrl
      });
    } catch (err) {
      console.error('Failed to compress/upload image', err);
      alert('Could not process this image. Please try another file.');
    } finally {
      setCompressingSlot(null);
      if (fileInputRefs[slotKey].current) {
        fileInputRefs[slotKey].current.value = '';
      }
    }
  };

  const handleApplyUrl = (slotKey) => {
    if (!tempUrl.trim()) return;
    onChange({
      ...photos,
      [slotKey]: tempUrl.trim()
    });
    setTempUrl('');
    setActiveUrlInput(null);
  };

  const handleRemovePhoto = (slotKey) => {
    const updated = { ...photos };
    delete updated[slotKey];
    onChange(updated);
  };

  return (
    <div className="photo-uploader-section">
      <div className="d-flex align-center justify-between mb-2">
        <label className="form-label" style={{ marginBottom: 0 }}>
          Family Photos (Max 3 Slots)
        </label>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-hint)' }}>
          Self • Ancestors • Descendants
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px'
      }}>
        {PHOTO_SLOTS.map(slot => {
          const currentUrl = photos?.[slot.key];
          const isCompressing = compressingSlot === slot.key;
          const isEnteringUrl = activeUrlInput === slot.key;
          const SlotIcon = slot.icon;

          return (
            <div
              key={slot.key}
              style={{
                background: 'var(--background-color)',
                border: '1.5px dashed var(--border-color)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                transition: 'all 0.2s ease',
                minHeight: '140px'
              }}
            >
              {/* Header Title */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <SlotIcon size={14} color={slot.badgeColor} />
                    <span>{slot.title}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.2 }}>
                    {slot.subtitle}
                  </div>
                </div>

                {currentUrl && !disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(slot.key)}
                    className="btn btn-text"
                    style={{ padding: '4px', color: 'var(--error-color)', minWidth: 'auto' }}
                    title="Remove photo"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* Photo Display / Preview */}
              {currentUrl ? (
                <div style={{ position: 'relative', width: '100%', height: '110px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
                  <img
                    src={currentUrl}
                    alt={slot.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <a
                    href={currentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-text"
                    style={{ position: 'absolute', bottom: '4px', right: '4px', padding: '4px 6px', background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }}
                  >
                    View <ArrowUpRight size={10} />
                  </a>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 6px', textAlign: 'center', flex: 1 }}>
                  {isCompressing ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 600 }}>
                      Optimizing photo...
                    </div>
                  ) : (
                    <>
                      {!disabled ? (
                        <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
                          {/* File input (Camera/Gallery) */}
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRefs[slot.key]}
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileSelect(slot.key, e)}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRefs[slot.key].current?.click()}
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.78rem', gap: '4px', flex: 1 }}
                            title="Upload from phone or computer"
                          >
                            <Camera size={13} />
                            <span>Upload</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveUrlInput(isEnteringUrl ? null : slot.key);
                              setTempUrl('');
                            }}
                            className="btn btn-outline"
                            style={{ padding: '6px 8px', fontSize: '0.78rem' }}
                            title="Paste external Image link (ImgBB, Cloudinary, etc.)"
                          >
                            <Link2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-hint)', fontStyle: 'italic' }}>
                          No photo added
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* URL Input Dropdown if selected */}
              {isEnteringUrl && !currentUrl && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://i.ibb.co/..."
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyUrl(slot.key)}
                    className="btn btn-primary"
                    style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                  >
                    <Check size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Clean gallery view for display in SidePanel
 */
export function PhotoGalleryView({ photos = {} }) {
  if (!photos || (!photos.avatar && !photos.familyAbove && !photos.familyBelow)) {
    return null;
  }

  const items = [
    { key: 'avatar', label: 'Self', url: photos.avatar },
    { key: 'familyAbove', label: 'Family Above', url: photos.familyAbove },
    { key: 'familyBelow', label: 'Family Downstream', url: photos.familyBelow }
  ].filter(i => Boolean(i.url));

  if (items.length === 0) return null;

  return (
    <div style={{ margin: '14px 0' }}>
      <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px' }}>Photos</label>
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {items.map(item => (
          <a
            key={item.key}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: 'relative',
              width: '85px',
              height: '85px',
              borderRadius: '8px',
              overflow: 'hidden',
              flexShrink: 0,
              border: '1.5px solid var(--border-color)',
              boxShadow: 'var(--elevation-1)'
            }}
            title={`View ${item.label}`}
          >
            <img src={item.url} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(0,0,0,0.65)',
              color: '#fff',
              fontSize: '0.62rem',
              fontWeight: 600,
              textAlign: 'center',
              padding: '2px 0',
              backdropFilter: 'blur(4px)'
            }}>
              {item.label}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
