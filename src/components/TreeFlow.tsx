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
import 'reactflow/dist/style.css';

import { treeData, TreeNode } from '../data/treeData';
import { getLang, Language } from '../i18n';
import LanguageSwitcher from './LanguageSwitcher';
import { Button, Col, Container, Row } from 'react-bootstrap';
import { MaterialSymbolsKeyboardArrowDownRounded, MaterialSymbolsKeyboardArrowUpRounded } from '../icons';

type ExpandedMap = Record<string, boolean>;
type NodePosition = { x: number; y: number };
type PositionMap = Record<string, NodePosition>;

const TreeFlow = () => {
  const [expanded, setExpanded] = useState<ExpandedMap>({ root: true });
  const [lang, setLang] = useState<Language>(getLang());
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const nodePositionsRef = useRef<PositionMap>({});
  const initialPositionsCalculated = useRef(false);

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
    node: TreeNode,
    parentId: string | null = null,
    level = 0,
    xOffset = 0
  ): { nodes: Node[]; edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const hasChildren = node.children && node.children.length > 0;
    const label = (
      <Container fluid={true}>
        <Row>
          <Col xs={hasChildren ? 8 : 12} className={'m-auto'}>
            {node.label[lang]}
          </Col>
          {hasChildren && (
            <Col xs={4}>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(
                    new CustomEvent('expand-node', { detail: node.id })
                  );
                }}
              >
                {expanded[node.id] ? <MaterialSymbolsKeyboardArrowDownRounded width={16} height={16} /> :
                  <MaterialSymbolsKeyboardArrowUpRounded width={16} height={16} />}
              </Button>
            </Col>
          )}
        </Row>
      </Container>
    );

    const savedPosition = nodePositionsRef.current[node.id];
    const position = savedPosition || { x: xOffset, y: level * 120 };

    const currentNode: Node = {
      id: node.id,
      data: { label },
      position,
      type: parentId === null ? 'input' : (hasChildren ? undefined : 'output'),
    };

    nodes.push(currentNode);

    if (!savedPosition) {
      nodePositionsRef.current[node.id] = position;
    }

    if (parentId) {
      edges.push({
        id: `${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
      });
    }

    if (expanded[node.id] && hasChildren) {
      const childrenCount = node.children!.length;
      const totalWidth = childrenCount * 200;
      const startX = xOffset - totalWidth / 2 + 100;

      node.children!.forEach((child, index) => {
        const childX = startX + index * 200;
        const childElements = generateElements(
          child,
          node.id,
          level + 1,
          childX
        );
        nodes.push(...childElements.nodes);
        edges.push(...childElements.edges);
      });
    }

    return { nodes, edges };
  }, [expanded, lang]);

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
    if (!initialPositionsCalculated.current) {
      const elements = generateElements(treeData);
      setNodes(elements.nodes);
      setEdges(elements.edges);
      initialPositionsCalculated.current = true;
    } else {
      setNodes(prevNodes => {
        const existingNodesMap = new Map(prevNodes.map(node => [node.id, node]));
        const newElements = generateElements(treeData);

        return newElements.nodes.map(newNode => {
          const existingNode = existingNodesMap.get(newNode.id);
          return existingNode
            ? { ...existingNode, data: newNode.data }
            : newNode;
        });
      });

      setEdges(generateElements(treeData).edges);
    }
  }, [generateElements]);

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
        <Panel position={'top-right'}>
          <LanguageSwitcher onChange={setLang} />
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default TreeFlow;
