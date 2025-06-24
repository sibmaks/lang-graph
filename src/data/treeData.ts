export type TreeNode = {
  id: string;
  label: { en: string; ru: string };
  children?: TreeNode[];
};

export const treeData: TreeNode = {
  id: 'root',
  label: { en: 'Root', ru: 'Корень' },
  children: [
    {
      id: 'child-1',
      label: { en: 'Child 1', ru: 'Потомок 1' },
      children: [
        {
          id: 'child-1-1',
          label: { en: 'Child 1.1', ru: 'Потомок 1.1' },
        },
        {
          id: 'child-1-2',
          label: { en: 'Child 1.2', ru: 'Потомок 1.2' },
        },
      ],
    },
    {
      id: 'child-2',
      label: { en: 'Child 2', ru: 'Потомок 2' },
    },
  ],
};
