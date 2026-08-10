import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'погладить',
  description: 'Погладить пользователя по головке.',
  template: '{author} гладит {target} по головке.',
  requireTarget: true,
  color: 0xa6e3a1,
};

export default action;
