import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'зажать',
  description: 'Зажать в ляшках няшку',
  template: '{author} крепко зажал в ляшках {target}.',
  requireTarget: true,
  color: 0xffc0cb,
};

export default action;
