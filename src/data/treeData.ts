import localizations from './localizations.json';
import languages from './languages.json';

export type TreeNode = {
  id: string;
  label: { en: string; ru: string };
  type: 'language' | 'family' | 'group';
  appeared?: Appeared;
  children?: Record<string, TreeNode>;
};

export interface Appeared {
  type: 'IN' | 'FROM';
  step: 'MILLENNIUM';
  from: number;
  to?: number;
  era: 'BC' | 'AC';
}

function createNode(id: string): TreeNode {
  const langData = languages[id as keyof typeof languages];
  const locData = localizations[id as keyof typeof localizations];

  const node: TreeNode = {
    id: id,
    label: {
      en: locData.eng,
      ru: locData.rus
    },
    type: langData.type as 'language' | 'family' | 'group',
  };

  if ('appeared' in langData) {
    node.appeared = { ...langData.appeared } as Appeared;
  }

  return node;
}

const childrenMap: Record<string, string[]> = {};

Object.entries(languages).forEach(([id, data]) => {
  if ('parent' in data) {
    if (!childrenMap[data.parent]) {
      childrenMap[data.parent] = [];
    }
    childrenMap[data.parent].push(id);
  }
});

function buildTree(parentId: string): Record<string, TreeNode> {
  const children: Record<string, TreeNode> = {};
  const childIds = childrenMap[parentId] || [];

  for (const childId of childIds) {
    const node = createNode(childId);
    const grandchildren = buildTree(childId);

    if (Object.keys(grandchildren).length > 0) {
      node.children = grandchildren;
    }

    children[childId] = node;
  }

  return children;
}

export const rootNodeId = 'proto-language'
export const treeData: TreeNode = {
  ...createNode(rootNodeId),
  children: buildTree(rootNodeId)
};
