import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'казнить',
  description: 'Казнить няшку',
  template: '{author} торжественно казнит {target}!',
  requireTarget: true,
  color: 0x8b0000,
};

export default action;
