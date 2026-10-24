import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { ArrowLeft } from 'lucide-react';
import SidePanelEdit from './SidePanelEdit';

const getInitials = (name) => {
  if (!name) return '?';
  return name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const CustomPersonNode = ({ data }) => {
  const isRoot = data.isRoot;
  // If display name is present, show that instead of full name
  const primaryName = data.displayName?.trim() ? data.displayName.trim() : data.name;

  // Subtitle: only show nickname, birth year, or village. Never show "Lineage Member"
  let subtitle = null;
  if (data.nickname?.trim()) {
    subtitle = `"${data.nickname.trim()}"`;
  } else if (data.dob?.trim()) {
    subtitle = `b. ${data.dob.trim().slice(0, 4)}`;
  } else if (data.ancestralVillage?.trim()) {
    subtitle = data.ancestralVillage.trim();
  }

  return (
    <div style={{ 
      width: '160px',
      height: '56px',
      background: 'var(--surface-color)',
      borderRadius: '12px',
      border: isRoot ? '2px solid #f472b6' : '1.5px solid var(--border-color)',
      boxShadow: isRoot ? '0 4px 16px rgba(244, 114, 182, 0.35)' : 'var(--elevation-2)',
      display: 'flex',
      alignItems: 'center',
      padding: '6px 10px',
      gap: '8px',
      cursor: 'pointer',
      position: 'relative',
      transition: 'all 0.15s ease',
      boxSizing: 'border-box'
    }}>
      {/* Avatar / Initials Circle */}
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: data.img ? 'transparent' : (isRoot ? 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)' : 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)'),
        backgroundImage: data.img ? `url(${data.img})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '13px',
        fontWeight: '700',
        flexShrink: 0,
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
      }}>
        {!data.img && data.initials}
      </div>

      {/* Details (Name + Subtitle if present) */}
      <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, minWidth: 0 }}>
        <div style={{ 
          fontSize: subtitle ? '12.5px' : '13.5px', 
          fontWeight: '700', 
          color: 'var(--text-primary)', 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          lineHeight: 1.2
        }} title={primaryName}>
          {primaryName}
        </div>
        
        {subtitle && (
          <div style={{ 
            fontSize: '10.5px', 
            color: data.nickname ? 'var(--primary-color)' : 'var(--text-secondary)', 
            fontWeight: data.nickname ? '600' : '400',
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            marginTop: '2px'
          }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Children count badge */}
      {data.childrenCount > 0 && (
        <div style={{
          position: 'absolute',
          top: -6,
          right: -6,
          background: '#f472b6',
          color: '#fff',
          borderRadius: '50%',
          width: '18px',
          height: '18px',
          fontSize: '10px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1.5px solid var(--surface-color)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }} title={`${data.childrenCount} children`}>
          {data.childrenCount}
        </div>
      )}

      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    </div>
  );
};

const CustomUnionNode = () => {
  return (
    <div style={{ width: 10, height: 10, background: 'var(--text-hint)', borderRadius: '50%', border: '2px solid var(--surface-color)', margin: '15px', position: 'relative' }}>
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    </div>
  );
};

const nodeTypes = {
  person: CustomPersonNode,
  union: CustomUnionNode
};

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, ranksep: 55, nodesep: 35 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: node.type === 'union' ? 20 : 165, 
      height: node.type === 'union' ? 20 : 60 
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = 'top';
    node.sourcePosition = 'bottom';
    
    // Shift center to top-left
    node.position = {
      x: nodeWithPosition.x - (node.type === 'union' ? 10 : 82),
      y: nodeWithPosition.y - (node.type === 'union' ? 10 : 28),
    };
    return node;
  });

  return { nodes, edges };
};

export default function LineageTree({ people, rootId, onBack, onNodeClick, onUpdate, onDelete, currentUser }) {
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rfInstance, setRfInstance] = useState(null);

  useEffect(() => {
    if (rfInstance && nodes.length > 0) {
      setTimeout(() => {
        rfInstance.fitView({ padding: 0.12, duration: 600 });
      }, 50);
    }
  }, [nodes, rfInstance]);

  useEffect(() => {
    setSelectedDetails(people.find(p => p.id === rootId) || null);
  }, [rootId, people]);

  useEffect(() => {
    let relatedIds = new Set();
    
    if (!rootId) {
      people.forEach(p => relatedIds.add(p.id));
    } else {
      relatedIds.add(rootId);
      
      const getParents = (id) => {
        const p = people.find(x => x.id === id);
        if (!p || !p.parents) return [];
        return [p.parents.primaryMother, p.parents.primaryFather, ...(p.parents.others?.map(o => o.id) || [])].filter(Boolean);
      };
      
      const getChildren = (id) => {
        return people.filter(p => {
          if (!p.parents) return false;
          return p.parents.primaryMother === id || p.parents.primaryFather === id || p.parents.others?.some(o => o.id === id);
        }).map(p => p.id);
      };

      // 1 Level Up (Parents)
      const parents = getParents(rootId);
      parents.forEach(p => relatedIds.add(p));
      
      // 2 Levels Up (Grandparents)
      parents.forEach(p => getParents(p).forEach(gp => relatedIds.add(gp)));
      
      // Siblings (Children of Parents)
      parents.forEach(p => getChildren(p).forEach(sib => relatedIds.add(sib)));
      
      // 1 Level Down (Children)
      const children = getChildren(rootId);
      children.forEach(c => relatedIds.add(c));
      
      // 2 Levels Down (Grandchildren)
      children.forEach(c => getChildren(c).forEach(gc => relatedIds.add(gc)));

      // Spouses & Co-parents
      const coParents = new Set();
      children.forEach(c => {
        const p = people.find(x => x.id === c);
        if (p && p.parents) {
          if (p.parents.primaryMother && p.parents.primaryMother !== rootId) coParents.add(p.parents.primaryMother);
          if (p.parents.primaryFather && p.parents.primaryFather !== rootId) coParents.add(p.parents.primaryFather);
        }
      });
      coParents.forEach(cp => relatedIds.add(cp));
    }

    // Pull in Spouses / Co-parents to ensure horizontal partners are visible!
    Array.from(relatedIds).forEach(id => {
      const p = people.find(x => x.id === id);
      if (p) {
        if (p.spouse && p.spouse.trim() !== '') {
          relatedIds.add(p.spouse.trim());
        }
        if (p.parents) {
           if (p.parents.primaryMother) relatedIds.add(p.parents.primaryMother);
           if (p.parents.primaryFather) relatedIds.add(p.parents.primaryFather);
        }
      }
    });

    const subsetPeople = people.filter(p => relatedIds.has(p.id));

    const initialNodes = [];
    const initialEdges = [];

    const getChildrenCount = (id) => {
      return people.filter(p => p.parents && (p.parents.primaryMother === id || p.parents.primaryFather === id || p.parents.others?.some(o => o.id === id))).length;
    };

    subsetPeople.forEach(p => {
      const imgField = p.customFields?.find(f => 
        f.key.toLowerCase().includes('image') || f.key.toLowerCase().includes('photo') || f.key.toLowerCase() === 'avatar'
      );

      initialNodes.push({
        id: p.id,
        type: 'person',
        data: {
          name: p.name,
          displayName: p.displayName,
          nickname: p.nickname,
          dob: p.dob,
          ancestralVillage: p.ancestralVillage,
          initials: getInitials(p.displayName || p.name),
          isRoot: p.id === rootId,
          childrenCount: getChildrenCount(p.id),
          img: imgField ? imgField.value : null
        },
        position: { x: 0, y: 0 }
      });
    });

    const unionNodes = {};
    
    subsetPeople.forEach(p => {
      if (!p.parents) return;
      const mom = p.parents.primaryMother;
      const dad = p.parents.primaryFather;

      const addLink = (source, target, isDotted) => {
        if (relatedIds.has(source) && relatedIds.has(target)) {
          initialEdges.push({ 
            id: `e-${source}-${target}`, 
            source, 
            target, 
            type: 'smoothstep',
            animated: isDotted,
            style: { stroke: isDotted ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.6)', strokeWidth: 2, strokeDasharray: isDotted ? '5,5' : 'none' }
          });
        }
      };

      if (mom && dad && relatedIds.has(mom) && relatedIds.has(dad)) {
        const unionId = `u-${[mom, dad].sort().join('-')}`;
        if (!unionNodes[unionId]) {
          unionNodes[unionId] = true;
          initialNodes.push({ id: unionId, type: 'union', data: {}, position: { x: 0, y: 0 } });
          
          // Edges from parents to union
          initialEdges.push({ id: `e-${mom}-${unionId}`, source: mom, target: unionId, type: 'smoothstep', style: { stroke: 'rgba(0,0,0,0.6)', strokeWidth: 2 } });
          initialEdges.push({ id: `e-${dad}-${unionId}`, source: dad, target: unionId, type: 'smoothstep', style: { stroke: 'rgba(0,0,0,0.6)', strokeWidth: 2 } });
        }
        // Edge from union to child
        initialEdges.push({ id: `e-${unionId}-${p.id}`, source: unionId, target: p.id, type: 'smoothstep', style: { stroke: 'rgba(0,0,0,0.6)', strokeWidth: 2 } });
      } else {
        if (mom) addLink(mom, p.id, false);
        if (dad) addLink(dad, p.id, false);
      }

      if (p.parents && p.parents.others) {
        p.parents.others.forEach(other => {
          addLink(other.id, p.id, true);
        });
      }
    });

    // Pass 2: Add pink dashed unions for explicit spouses that don't have children yet
    subsetPeople.forEach(p => {
      if (p.spouse && relatedIds.has(p.spouse.trim())) {
        const spouseId = p.spouse.trim();
        const unionId = `u-${[p.id, spouseId].sort().join('-')}`;
        
        if (!unionNodes[unionId]) {
          unionNodes[unionId] = true;
          initialNodes.push({ id: unionId, type: 'union', data: {}, position: { x: 0, y: 0 } });
          
          initialEdges.push({ 
            id: `e-spouse-${p.id}-${unionId}`, 
            source: p.id, 
            target: unionId, 
            type: 'smoothstep', 
            style: { stroke: '#ff4081', strokeWidth: 2, strokeDasharray: '5,5' } 
          });
          initialEdges.push({ 
            id: `e-spouse-${spouseId}-${unionId}`, 
            source: spouseId, 
            target: unionId, 
            type: 'smoothstep', 
            style: { stroke: '#ff4081', strokeWidth: 2, strokeDasharray: '5,5' } 
          });
        }
      }
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [people, rootId, setNodes, setEdges]);

  const onNodeClickInternal = (_, node) => {
    if (node.type === 'union') return;
    const person = people.find(p => p.id === node.id);
    setSelectedDetails(person);
    onNodeClick(node.id);

    // Zoom into the clicked node
    if (rfInstance && node.position) {
      rfInstance.setCenter(node.position.x + 80, node.position.y + 28, { zoom: 1.15, duration: 600 });
    }
  };

  const onPaneClick = () => {
    // Close side panel when clicking on empty space
    setSelectedDetails(null);
    // Zoom back out to fit the entire tree
    if (rfInstance) {
      rfInstance.fitView({ padding: 0.12, duration: 600 });
    }
  };

  const handleSave = (updatedPerson) => {
    onUpdate(updatedPerson);
    setSelectedDetails(updatedPerson);
  };

  const handleDelete = (id) => {
    onDelete(id);
    setSelectedDetails(null);
    onBack(); 
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--background-color)' }}>
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
        <button 
          onClick={onBack} 
          className="btn btn-outline" 
          style={{ 
            backgroundColor: 'var(--surface-color)', 
            boxShadow: 'var(--elevation-2)',
            padding: '8px 16px',
            fontSize: '0.85rem',
            borderColor: 'var(--border-color)'
          }}
        >
          <ArrowLeft size={16} /> Back to Global Web
        </button>
      </div>

      <ReactFlow 
        nodes={nodes} 
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickInternal}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        onInit={setRfInstance}
        minZoom={0.15}
        maxZoom={2.5}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        attributionPosition="bottom-left"
      >
        <Background color="var(--text-hint)" gap={20} size={1} />
        <Controls />
        <MiniMap zoomable pannable nodeColor={(n) => n.type === 'union' ? '#94a3b8' : (n.data?.isRoot ? '#f472b6' : '#7c3aed')} />
      </ReactFlow>

      {selectedDetails && (
        <SidePanelEdit 
          people={people}
          person={selectedDetails} 
          onSave={handleSave}
          onDiscard={() => setSelectedDetails(null)}
          onDelete={handleDelete}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
