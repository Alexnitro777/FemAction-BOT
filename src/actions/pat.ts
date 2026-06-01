import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'pat',
  textName: 'погладить',
  aliases: ['pat'],
  description: 'Погладить пользователя по головке.',
  template: '{author} гладит {target} по головке.',
  selfTemplate: '{author} гладит сам(а) себя по головке, какой(ая) молодец.',
  requireTarget: false,
  color: 0xa6e3a1,
};

export default action;
