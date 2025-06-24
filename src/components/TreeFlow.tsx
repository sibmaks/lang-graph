import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, { Background, Controls, Edge, Node, Position, } from 'reactflow';
import 'reactflow/dist/style.css';

import { treeData, TreeNode } from '../data/treeData';
import { getLang, Language, messages } from '../i18n';
import LanguageSwitcher from './LanguageSwitcher';

type ExpandedMap = Record<string, boolean>;

const TreeFlow = () => {
  const [expanded, setExpanded] = useState<ExpandedMap>({ root: true });
  const [lang, setLang] = useState<Language>(getLang());

  const t = messages[lang];

  const handleExpand = useCallback((e: CustomEvent<string>) => {
    const id = e.detail;
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  useEffect(() => {
    window.addEventListener('expand-node', handleExpand as EventListener);
    return () => {
      window.removeEventListener('expand-node', handleExpand as EventListener);
    };
  }, [handleExpand]);

  const generateElements = (
    node: TreeNode,
    parentId: string | null = null,
    level = 0,
    xOffset = 0
  ): { nodes: Node[]; edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const label = (
      <div>
        {node.label}{' '}
        {node.children && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(
                new CustomEvent('expand-node', { detail: node.id })
              );
            }}
          >
            {expanded[node.id] ? '−' : '+'}
          </button>
        )}
      </div>
    );

    const currentNode: Node = {
      id: node.id,
      data: { label },
      position: { x: xOffset, y: level * 100 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };

    nodes.push(currentNode);

    if (parentId) {
      edges.push({
        id: `${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
      });
    }

    if (expanded[node.id] && node.children) {
      node.children.forEach((child, index) => {
        const childElements = generateElements(
          child,
          node.id,
          level + 1,
          xOffset + index * 200
        );
        nodes.push(...childElements.nodes);
        edges.push(...childElements.edges);
      });
    }

    return { nodes, edges };
  };

  const { nodes, edges } = generateElements({
    ...treeData,
    label: t.root,
  });

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <LanguageSwitcher onChange={setLang} />
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default TreeFlow;
