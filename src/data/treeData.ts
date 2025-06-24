export type TreeNode = {
  label: { en: string; ru: string };
  type: 'language' | 'family';
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

export const treeData: TreeNode = {
  type: 'language',
  label: { en: 'Proto lang', ru: 'Прото язык' },
  appeared: {
    type: 'IN',
    step: 'MILLENNIUM',
    from: 13,
    to: 14,
    era: 'BC'
  },
  children: {
    'nostratic-langs-family': {
      type: 'family',
      label: { en: 'Nostratic languages', ru: 'Ностратические языки' },
      appeared: {
        type: 'IN',
        step: 'MILLENNIUM',
        from: 10,
        to: 11,
        era: 'BC'
      }
    },
    'dene-caucasian-family': {
      type: 'family',
      label: { en: 'Dene–Caucasian languages', ru: 'Сино-кавказские языки' },
      appeared: {
        type: 'FROM',
        step: 'MILLENNIUM',
        from: 9,
        era: 'BC'
      }
    },
    'afroasiatic-family': {
      type: 'family',
      label: { en: 'Afroasiatic languages', ru: 'Афразийские языки' },
      appeared: {
        type: 'IN',
        step: 'MILLENNIUM',
        from: 10,
        to: 11,
        era: 'BC'
      }
    }
  }
};
