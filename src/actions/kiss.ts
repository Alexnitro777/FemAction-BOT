import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'поцеловать',
  description: 'Поцеловать няшку',
  template: '{author} нежно поцеловал {target}.',
  requireTarget: true,
  color: 0xff5e8a,
};

export default action;
