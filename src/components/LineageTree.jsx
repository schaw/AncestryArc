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
  const size = data.isRoot ? 60 : 50;
  return (
    <div style={{ 
      background: data.img ? 'transparent' : (data.isRoot ? '#ff4081' : '#6200ea'), 
      color: '#fff',
      borderRadius: '50%', 
      width: size, 
      height: size, 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      border: `2px solid ${data.isRoot ? '#ff4081' : '#6200ea'}`,
      position: 'relative',
      boxShadow: 'var(--elevation-2)',
      cursor: 'pointer',
      backgroundImage: data.img ? `url(${data.img})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      {!data.img && <span style={{ fontSize: size * 0.4, fontWeight: '500' }}>{data.initials}</span>}
      
      {data.childrenCount > 0 && (
        <div style={{
          position: 'absolute', top: -5, right: -5, background: '#ff4081', color: 'white',
          borderRadius: '50%', width: 20, height: 20, fontSize: 11, fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px solid white'
        }}>
          {data.childrenCount}
        </div>
      )}
      <div style={{ 
        position: 'absolute', bottom: -24, color: 'var(--text-primary)', fontSize: 12, fontWeight: '500', whiteSpace: 'nowrap',
        background: 'rgba(255,255,255,0.8)', padding: '2px 6px', borderRadius: '4px'
      }}>
        {data.name}
      </div>
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    </div>
  );
};

const CustomUnionNode = () => {
  return (
    <div style={{ width: 10, height: 10, background: 'rgba(0,0,0,0.4)', borderRadius: '50%', border: '2px solid white', margin: '15px', position: 'relative' }}>
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    </div>
  );
};

const nodeTypes = {
  person: CustomPersonNode,
  union: CustomUnionNode
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction, ranksep: 80, nodesep: 60 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: node.type === 'union' ? 40 : 80, height: node.type === 'union' ? 40 : 80 });
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
      x: nodeWithPosition.x - (node.type === 'union' ? 20 : 40),
      y: nodeWithPosition.y - (node.type === 'union' ? 20 : 40),
    };
    return node;
  });

  return { nodes, edges };
};

export default function LineageTree({ people, rootId, onBack, onNodeClick, onUpdate, onDelete, currentUser }) {
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    setSelectedDetails(people.find(p => p.id === rootId) || null);
  }, [rootId, people]);

  useEffect(() => {
    const relatedIds = new Set([rootId]);
    
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
          initials: getInitials(p.name),
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
    <div style={{ height: 'calc(100vh - 150px)', position: 'relative', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--background-color)' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
        <button onClick={onBack} className="btn btn-outline" style={{ backgroundColor: 'var(--surface-color)', boxShadow: 'var(--elevation-2)' }}>
          <ArrowLeft size={18} /> Back to Global Web
        </button>
      </div>

      <ReactFlow 
        nodes={nodes} 
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickInternal}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#ccc" gap={16} />
        <Controls />
        <MiniMap zoomable pannable nodeColor={(n) => n.type === 'union' ? '#000' : (n.data?.isRoot ? '#ff4081' : '#6200ea')} />
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
