import React, { useRef, useEffect, useState, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const getInitials = (name) => {
  if (!name) return '?';
  return name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export default function GlobalGraph({ people, onNodeClick, viewMode = 'web' }) {
  const containerRef = useRef();
  const graphRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight || 600
      });
    }
  }, []);

  useEffect(() => {
    if (graphRef.current) {
      // Adjust forces based on viewMode
      if (viewMode === 'web') {
        // Strong repulsion to untangle intersecting lines
        graphRef.current.d3Force('charge').strength(-300);
        // Larger distance to give nodes room to breathe
        graphRef.current.d3Force('link').distance(50);
      } else {
        graphRef.current.d3Force('charge').strength(-150);
        graphRef.current.d3Force('link').distance(40);
      }
    }
  }, [people, viewMode]);

  const graphData = useMemo(() => {
    const getChildrenCount = (id) => {
      return people.filter(p => p.parents && (p.parents.primaryMother === id || p.parents.primaryFather === id || p.parents.others?.some(o => o.id === id))).length;
    };

    const nodes = people.map(p => {
      const imgField = p.customFields?.find(f => 
        f.key.toLowerCase().includes('image') || 
        f.key.toLowerCase().includes('photo') || 
        f.key.toLowerCase() === 'avatar'
      );
      
      let img = null;
      if (imgField && imgField.value) {
        img = new Image();
        img.src = imgField.value;
      }

      return {
        id: p.id,
        name: p.name,
        initials: getInitials(p.name),
        img: img,
        childrenCount: getChildrenCount(p.id),
        val: 1
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
    if (node.isUnion) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 2, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fill();
      return;
    }

    const size = 12; // Base radius of the node
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.closePath();
    ctx.clip(); // Clip everything to a circle

    if (node.img && node.img.complete) {
      // Draw the user's image
      ctx.drawImage(node.img, node.x - size, node.y - size, size * 2, size * 2);
    } else {
      // Draw background circle for initials
      ctx.fillStyle = '#6200ea'; // var(--primary-color) fallback
      ctx.fill();
      
      // Draw initials text
      ctx.fillStyle = '#ffffff'; // var(--on-primary) fallback
      const fontSize = 10;
      ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.initials, node.x, node.y + 1); // +1 tweak for visual vertical alignment
    }
    
    ctx.restore();
    
    // Draw stroke around the circle to make it pop
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.strokeStyle = '#6200ea';
    ctx.lineWidth = 1.5 / globalScale;
    ctx.stroke();

    if (node.childrenCount > 0) {
      const badgeRadius = 4;
      const badgeX = node.x + size * 0.707;
      const badgeY = node.y - size * 0.707;
      
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeRadius, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#ff4081';
      ctx.fill();
      
      ctx.fillStyle = '#fff';
      ctx.font = `${badgeRadius * 1.5}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.childrenCount.toString(), badgeX, badgeY + 0.5);
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: 'calc(100vh - 150px)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
      <ForceGraph2D
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        dagMode={viewMode === 'generational' ? 'td' : viewMode === 'radial' ? 'radialout' : null}
        dagLevelDistance={viewMode === 'generational' ? 80 : viewMode === 'radial' ? 100 : null}
        nodeLabel={(node) => node.isUnion ? '' : node.name}
        nodeCanvasObject={drawNode}
        nodeRelSize={6}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        linkLineDash={link => link.type === 'dotted' ? [2, 2] : null}
        linkColor={link => link.type === 'dotted' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.8)'}
        onNodeClick={node => {
          if (!node.isUnion) onNodeClick(node.id);
        }}
        backgroundColor="var(--surface-color)"
        cooldownTicks={40}
        onEngineStop={() => {
          if (graphRef.current) graphRef.current.zoomToFit(200, 120);
        }}
      />
    </div>
  );
}
