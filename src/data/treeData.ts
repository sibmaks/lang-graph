export type TreeNode = {
  id: string;
  label: string;
  children?: TreeNode[];
};

export const treeData: TreeNode = {
  id: 'root',
  label: 'Корень',
  children: [
    {
      id: 'child-1',
      label: 'Потомок 1',
      children: [
        { id: 'child-1-1', label: 'Потомок 1.1' },
        { id: 'child-1-2', label: 'Потомок 1.2' },
      ],
    },
    {
      id: 'child-2',
      label: 'Потомок 2',
    },
  ],
};
