import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  MiniMap,
  Node,
  OnEdgesChange,
  OnNodesChange,
  Panel
} from 'reactflow';

import { rootNodeId, treeData, TreeNode } from '../data/treeData';
import { getLang, Language } from '../i18n';
import LanguageSwitcher from './LanguageSwitcher';
import { Button, ButtonGroup, Col, Container, Row } from 'react-bootstrap';
import {
  MaterialSymbolsKeyboardArrowDownRounded,
  MaterialSymbolsKeyboardArrowUpRounded,
  MaterialSymbolsSearchRounded
} from '../icons';
import { SuggestiveInput } from '@sibdevtools/frontend-common';

type ExpandedMap = Record<string, boolean>;
type NodePosition = { x: number; y: number };
type PositionMap = Record<string, NodePosition>;

const findTreeNode = (node: TreeNode, id: string): TreeNode | null => {
  if (node.id === id) return node;
  if (node.children) {
    for (const childId in node.children) {
      const child = node.children[childId];
      const found = findTreeNode(child, id);
      if (found) return found;
    }
  }
  return null;
};

interface NodeData {
  caption: { en: string; ru: string },
  label: string;
}

const TreeFlow = () => {
  const [expanded, setExpanded] = useState<ExpandedMap>({ root: true });
  const [lang, setLang] = useState<Language>(getLang());
  const [nodes, setNodes] = useState<Node<NodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [searchLanguages, setSearchLanguages] = useState<{ key: string, value: string }[]>([]);
  const nodePositionsRef = useRef<PositionMap>({});
  const initialPositionsCalculated = useRef(false);
  const langRef = useRef(lang);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    langRef.current = lang;

    const languages: { key: string, value: string }[] = [];

    const collectLangs = (nodeId: string, node: TreeNode) => {
      languages.push({
        key: nodeId,
        value: node.label[lang]
      });
      for (let [childId, child] of Object.entries(node.children ?? {})) {
        collectLangs(childId, child);
      }
    };

    collectLangs(rootNodeId, treeData);
    setSearchLanguages(languages);
  }, [lang]);

  const generateLabel = useCallback((nodeId: string, node: TreeNode): React.ReactNode => {
    const hasChildren = node.children && Object.keys(node.children).length > 0;
    return (
      <Container fluid className="p-0" style={{ width: '100%' }}>
        <Row className="d-flex align-items-center flex-wrap" style={{ margin: 0 }}>
          <Col xs={hasChildren ? 8 : 12} className="p-0" style={{
            wordBreak: 'break-word'
          }}>
            {node.label[langRef.current]}
          </Col>
          {hasChildren && (
            <Col xs={4} className="p-0" style={{ flexShrink: 0 }}>
              <Button
                variant="outline-secondary"
                size="sm"
                className="ms-1"
                style={{ minWidth: '32px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(
                    new CustomEvent('expand-node', { detail: nodeId })
                  );
                }}
              >
                {expanded[nodeId] ?
                  <MaterialSymbolsKeyboardArrowDownRounded width={16} height={16} /> :
                  <MaterialSymbolsKeyboardArrowUpRounded width={16} height={16} />
                }
              </Button>
            </Col>
          )}
        </Row>
      </Container>
    );
  }, [expanded]);

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

  // === WIDTH CALCULATION ===
  const subtreeWidth = useCallback((node: TreeNode): number => {
    if (!expanded[node.id] || !node.children || Object.keys(node.children).length === 0) {
      return 1;
    }
    return Object.values(node.children).reduce(
      (acc, child) => acc + subtreeWidth(child),
      0
    );
  }, [expanded]);

  // === POSITION + ELEMENT GENERATION ===
  const generateElements = useCallback((
    node: TreeNode,
    parentId: string | null = null,
    level = 0,
    xStart = 0
  ): { nodes: Node[]; edges: Edge[]; width: number } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const nodeWidth = 200;
    const nodeHeight = 120;

    const children = node.children ?? {};
    const hasChildren = expanded[node.id] && Object.keys(children).length > 0;

    let currentSubtreeWidth = 1;

    if (hasChildren) {
      currentSubtreeWidth = Object.values(children)
        .map(child => subtreeWidth(child))
        .reduce((a, b) => a + b, 0);
    }

    const totalWidthPx = currentSubtreeWidth * nodeWidth;
    const nodeX = xStart + totalWidthPx / 2 - nodeWidth / 2;
    const nodeY = level * nodeHeight;

    nodePositionsRef.current[node.id] = { x: nodeX, y: nodeY };

    const currentNode: Node = {
      id: node.id,
      data: {
        caption: node.label,
        label: generateLabel(node.id, node)
      },
      position: { x: nodeX, y: nodeY },
      type: parentId === null ? 'input' : (hasChildren ? undefined : 'output'),
    };

    nodes.push(currentNode);

    if (parentId) {
      edges.push({
        id: `${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
      });
    }

    if (hasChildren) {
      let childXStart = xStart;
      for (const child of Object.values(children)) {
        const childSubtreeWidth = subtreeWidth(child);
        const childWidthPx = childSubtreeWidth * nodeWidth;

        const childElements = generateElements(
          child,
          node.id,
          level + 1,
          childXStart
        );

        nodes.push(...childElements.nodes);
        edges.push(...childElements.edges);

        childXStart += childWidthPx;
      }
    }

    return { nodes, edges, width: currentSubtreeWidth };
  }, [expanded, generateLabel, subtreeWidth]);

  const onNodesChange: OnNodesChange = (changes) => {
    setNodes((nds) => {
      const updatedNodes = applyNodeChanges(changes, nds);
      changes.forEach(change => {
        if (change.type === 'position' && change.dragging && change.position) {
          const nodeId = change.id;
          nodePositionsRef.current[nodeId] = change.position;
        }
      });
      return updatedNodes;
    });
  };

  const onEdgesChange: OnEdgesChange = (changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  };

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = generateElements(treeData);
    setEdges(newEdges);
    setNodes(newNodes);
    initialPositionsCalculated.current = true;
  }, [generateElements]);

  useEffect(() => {
    if (!initialPositionsCalculated.current) return;
    setNodes(prevNodes =>
      prevNodes.map(node => {
        const treeNode = findTreeNode(treeData, node.id);
        if (!treeNode) return node;

        return {
          ...node,
          data: {
            ...node.data,
            caption: treeNode.label,
            label: generateLabel(node.id, treeNode)
          }
        } as Node<NodeData>;
      })
    );
  }, [lang, generateLabel]);

  const findPathToNode = (node: TreeNode, targetId: string): string[] | null => {
    if (node.id === targetId) return [node.id];

    for (const child of Object.values(node.children ?? {})) {
      const childPath = findPathToNode(child, targetId);
      if (childPath) {
        return [node.id, ...childPath];
      }
    }

    return null;
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        nodesConnectable={false}
        nodesDraggable={true}
      >
        <Background variant={BackgroundVariant.Lines} />
        <Controls />
        <MiniMap />
        <Panel position={'top-left'}>
          <ButtonGroup>
            <SuggestiveInput
              suggestions={searchLanguages}
              maxSuggestions={5}
              mode="strict"
              onChange={it => setSelectedKey(it.key!)}
              required={true}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (!selectedKey) return;
                const path = findPathToNode(treeData, selectedKey)?.slice(0, -1);
                if (!path) return;
                const expandedUpdate: ExpandedMap = {};
                for (const id of path) {
                  expandedUpdate[id] = true;
                }
                setExpanded(prev => ({ ...prev, ...expandedUpdate }));
              }}
            >
              <MaterialSymbolsSearchRounded />
            </Button>
          </ButtonGroup>
        </Panel>
        <Panel position={'top-right'}>
          <LanguageSwitcher onChange={setLang} />
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default TreeFlow;
