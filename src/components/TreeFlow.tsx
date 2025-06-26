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

const findTreeNode = (nodeId: string, node: TreeNode, id: string): TreeNode | null => {
  if (nodeId === id) return node;
  if (node.children) {
    for (const childId in node.children) {
      const child = node.children[childId];
      const found = findTreeNode(childId, child, id);
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

    collectLangs(rootNodeId, treeData)
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

  const generateElements = useCallback((
    nodeId: string,
    node: TreeNode,
    parentId: string | null = null,
    level = 0,
    xOffset = 0
  ): { nodes: Node[]; edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const hasChildren = node.children && Object.keys(node.children).length > 0;

    const savedPosition = nodePositionsRef.current[nodeId];
    const position = savedPosition || { x: xOffset, y: level * 120 };

    const currentNode: Node = {
      id: nodeId,
      data: {
        caption: node.label,
        label: generateLabel(nodeId, node)
      },
      position,
      type: parentId === null ? 'input' : (hasChildren ? undefined : 'output'),
    };

    nodes.push(currentNode);

    if (!savedPosition) {
      nodePositionsRef.current[nodeId] = position;
    }

    if (parentId) {
      edges.push({
        id: `${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
      });
    }

    if (expanded[nodeId] && hasChildren) {
      const children = node.children ?? {};
      const childrenCount = Object.keys(children).length;
      const totalWidth = childrenCount * 200;
      const startX = xOffset - totalWidth / 2 + 100;

      Object.entries(children).forEach(([childId, child], index) => {
        const childX = startX + index * 200;
        const childElements = generateElements(
          childId,
          child,
          nodeId,
          level + 1,
          childX
        );
        nodes.push(...childElements.nodes);
        edges.push(...childElements.edges);
      });
    }

    return { nodes, edges };
  }, [expanded, generateLabel]);

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
    const elements = generateElements(rootNodeId, treeData);
    setEdges(elements.edges);

    if (!initialPositionsCalculated.current) {
      setNodes(elements.nodes);
      initialPositionsCalculated.current = true;
    } else {
      setNodes(prevNodes => {
        const existingNodesMap = new Map(prevNodes.map(node => [node.id, node]));

        return elements.nodes.map(newNode => {
          const existingNode = existingNodesMap.get(newNode.id);
          return existingNode
            ? { ...existingNode, data: newNode.data }
            : newNode;
        });
      });
    }
  }, [generateElements]);

  useEffect(() => {
    if (!initialPositionsCalculated.current) return;

    setNodes(prevNodes =>
      prevNodes.map(node => {
        const treeNode = findTreeNode(rootNodeId, treeData, node.id);
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
              onChange={it => console.log(it)}
              required={true}
            />
            <Button variant={'primary'} size={'sm'}>
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
