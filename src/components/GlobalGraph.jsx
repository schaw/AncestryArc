import React, { useRef, useEffect, useState, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { User, Users, MapPin, Calendar, Sparkles } from 'lucide-react';
import { useAuth } from '../firebase/authContext';
import { getMaskedName } from '../utils/masking';
import { SocialLinkBadges } from './SocialLinksEditor';

const getInitials = (name) => {
  if (!name) return '?';
  return name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export default function GlobalGraph({ people, onNodeClick, viewMode = 'web' }) {
  const { user } = useAuth();
  const isLoggedIn = Boolean(user);
  const containerRef = useRef();
  const graphRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isDark, setIsDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight || 600
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (graphRef.current) {
      if (viewMode === 'web') {
        // Strong repulsion to spread nodes out with ample breathing room
        graphRef.current.d3Force('charge').strength(-500);
        graphRef.current.d3Force('link').distance(80);
      } else {
        graphRef.current.d3Force('charge').strength(-250);
        graphRef.current.d3Force('link').distance(55);
      }
    }
  }, [people, viewMode]);

  const graphData = useMemo(() => {
    const getChildrenCount = (id) => {
      return people.filter(p => p.parents && (p.parents.primaryMother === id || p.parents.primaryFather === id || p.parents.others?.some(o => o.id === id))).length;
    };

    const nodes = people.map(p => {
      let img = null;
      const photoUrl = p.photos?.avatar || p.customFields?.find(f => 
        f.key.toLowerCase().includes('image') || 
        f.key.toLowerCase().includes('photo') || 
        f.key.toLowerCase() === 'avatar'
      )?.value;

      if (photoUrl) {
        img = new Image();
        img.src = photoUrl;
      }

      const rawName = p.displayName?.trim() ? p.displayName.trim() : p.name;
      const displayLabel = rawName;

      return {
        id: p.id,
        name: p.name,
        displayName: p.displayName,
        nickname: p.nickname,
        displayLabel,
        dob: p.dob,
        ancestralVillage: p.ancestralVillage,
        socialLinks: p.socialLinks || [],
        initials: getInitials(rawName),
        img: img,
        childrenCount: getChildrenCount(p.id),
        val: 1.5
      };
    });

    const unionNodes = {};
    const links = [];
    
    people.forEach(p => {
      if (!p.parents) return;
      
      const mom = p.parents.primaryMother;
      const dad = p.parents.primaryFather;
      
      if (mom && dad) {
        const unionId = `u-${[mom, dad].sort().join('-')}`;
        if (!unionNodes[unionId]) {
          unionNodes[unionId] = { id: unionId, isUnion: true, val: 0.1 };
          links.push({ source: mom, target: unionId, type: 'union' });
          links.push({ source: dad, target: unionId, type: 'union' });
        }
        links.push({ source: unionId, target: p.id, type: 'solid' });
      } else if (mom) {
        links.push({ source: mom, target: p.id, type: 'solid' });
      } else if (dad) {
        links.push({ source: dad, target: p.id, type: 'solid' });
      }

      if (p.parents.others) {
        p.parents.others.forEach(other => {
          links.push({ source: other.id, target: p.id, type: 'dotted' });
        });
      }
    });

    return { nodes: [...nodes, ...Object.values(unionNodes)], links };
  }, [people]);

  const drawNode = (node, ctx, globalScale) => {
    if (!node || !Number.isFinite(node.x) || !Number.isFinite(node.y) || !Number.isFinite(globalScale) || globalScale <= 0) return;

    if (node.isUnion) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 3, 0, 2 * Math.PI, false);
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)';
      ctx.fill();
      return;
    }

    // Increased base size from 12 to 18 for high visibility and easy hovering
    const size = 18;
    
    // Draw subtle glow if hovered
    const isHovered = hoveredNode && hoveredNode.id === node.id;
    if (isHovered) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 5, 0, 2 * Math.PI, false);
      ctx.fillStyle = isDark ? 'rgba(167, 139, 250, 0.4)' : 'rgba(124, 58, 237, 0.25)';
      ctx.fill();
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.closePath();
    ctx.clip();

    if (node.img && node.img.complete) {
      ctx.drawImage(node.img, node.x - size, node.y - size, size * 2, size * 2);
    } else {
      ctx.fillStyle = isHovered ? '#8b5cf6' : (isDark ? '#7c3aed' : '#6d28d9');
      ctx.fill();
      
      // Initials inside circle
      ctx.fillStyle = '#ffffff';
      const fontSize = 12;
      ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.initials, node.x, node.y + 0.5);
    }
    
    ctx.restore();
    
    // Stroke ring
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.strokeStyle = isHovered ? '#f472b6' : (isDark ? '#a78bfa' : '#7c3aed');
    ctx.lineWidth = (isHovered ? 2.5 : 1.8) / globalScale;
    ctx.stroke();

    // Children count badge
    if (node.childrenCount > 0) {
      const badgeRadius = 5.5;
      const badgeX = node.x + size * 0.707;
      const badgeY = node.y - size * 0.707;
      
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeRadius, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#f472b6';
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${badgeRadius * 1.4}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.childrenCount.toString(), badgeX, badgeY + 0.5);
    }

    // Direct Canvas Name Label (Always legible, prioritizes Display Name, shows initials only if guest)
    const label = node.displayLabel || '';
    if (!label) return;
    const labelFontSize = Math.max(9, 11 / Math.sqrt(globalScale));
    ctx.font = `600 ${labelFontSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Label background pill
    const textWidth = ctx.measureText(label).width;
    const paddingX = 4;
    const pillY = node.y + size + 4;
    ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.88)';
    ctx.fillRect(node.x - textWidth / 2 - paddingX, pillY - 1, textWidth + paddingX * 2, labelFontSize + 3);

    // Label text
    ctx.fillStyle = isDark ? '#f1f5f9' : '#1e293b';
    ctx.fillText(label, node.x, pillY);

    // Nickname
    if (node.nickname) {
      const nickText = `(${node.nickname})`;
      const nickFontSize = Math.max(8, 9 / Math.sqrt(globalScale));
      ctx.font = `500 ${nickFontSize}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = isDark ? '#a78bfa' : '#7c3aed';
      ctx.fillText(nickText, node.x, pillY + labelFontSize + 3);
    }
  };

  const handleMouseMove = (e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  return (
    <div 
      ref={containerRef} 
      onMouseMove={handleMouseMove}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
    >
      <ForceGraph2D
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        dagMode={viewMode === 'generational' ? 'td' : viewMode === 'radial' ? 'radialout' : null}
        dagLevelDistance={viewMode === 'generational' ? 100 : viewMode === 'radial' ? 120 : null}
        nodeCanvasObject={drawNode}
        nodeRelSize={9}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkLineDash={link => link.type === 'dotted' ? [3, 3] : null}
        linkColor={link => link.type === 'dotted' ? (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)') : (isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.65)')}
        onNodeHover={(node) => {
          if (node && !node.isUnion) {
            setHoveredNode(node);
          } else {
            setHoveredNode(null);
          }
        }}
        onNodeClick={node => {
          if (!node.isUnion) {
            if (graphRef.current && Number.isFinite(node.x) && Number.isFinite(node.y)) {
              graphRef.current.centerAt(node.x, node.y, 500);
              graphRef.current.zoom(2.5, 500);
            }
            onNodeClick(node.id);
          }
        }}
        onBackgroundClick={() => {
          if (graphRef.current) {
            graphRef.current.zoomToFit(500, 35);
          }
        }}
        backgroundColor={isDark ? '#0f172a' : '#f8fafc'}
        cooldownTicks={50}
        onEngineStop={() => {
          // Balanced zoom-to-fit: padding 35 prevents excessive zoom-out
          if (graphRef.current) graphRef.current.zoomToFit(300, 35);
        }}
      />

      {/* Zero-Latency Instant Floating Hover Card */}
      {hoveredNode && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(mousePos.x + 16, dimensions.width - 240),
            top: Math.min(mousePos.y + 16, dimensions.height - 180),
            pointerEvents: 'none',
            background: 'var(--surface-glass)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '14px',
            border: '1.5px solid var(--border-color)',
            boxShadow: 'var(--elevation-3)',
            padding: '12px 16px',
            minWidth: '220px',
            maxWidth: '280px',
            zIndex: 100,
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{ 
              width: '28px', 
              height: '28px', 
              borderRadius: '50%', 
              background: 'var(--gradient-primary)', 
              color: '#fff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700 
            }}>
              {hoveredNode.initials}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {hoveredNode.displayLabel}
              </div>
              {hoveredNode.nickname && (
                <div style={{ fontSize: '0.78rem', color: 'var(--primary-color)', fontWeight: 600 }}>
                  "{hoveredNode.nickname}"
                </div>
              )}
            </div>
          </div>

          {hoveredNode.displayName && hoveredNode.displayName !== hoveredNode.name && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Full: {hoveredNode.name}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
            {hoveredNode.dob && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} color="var(--primary-color)" />
                <span>Born: {hoveredNode.dob}</span>
              </div>
            )}
            {hoveredNode.ancestralVillage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={13} color="var(--secondary-color)" />
                <span>Village: {hoveredNode.ancestralVillage}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={13} color="var(--accent-color)" />
              <span>{hoveredNode.childrenCount} {hoveredNode.childrenCount === 1 ? 'Child' : 'Children'}</span>
            </div>

            {hoveredNode.socialLinks && hoveredNode.socialLinks.length > 0 && (
              <div style={{ marginTop: '4px' }}>
                <SocialLinkBadges links={hoveredNode.socialLinks} isLoggedIn={true} />
              </div>
            )}
          </div>

          <div style={{ marginTop: '8px', fontSize: '0.7rem', color: 'var(--text-hint)', fontStyle: 'italic', textAlign: 'center' }}>
            Click node to focus lineage tree
          </div>
        </div>
      )}
    </div>
  );
}
