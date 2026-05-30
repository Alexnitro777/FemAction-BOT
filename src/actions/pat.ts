import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'pat',
  textName: 'погладить',
  aliases: ['pat'],
  description: 'Погладить пользователя по голове',
  template: '{author} гладит {target} по голове 🫳✨',
  selfTemplate: '{author} гладит сам(а) себя по голове, какой молодец ✨',
  requireTarget: false,
  color: 0xa6e3a1,
  gifs: [
    'https://media.tenor.com/example-pat-1.gif',
    'https://media.tenor.com/example-pat-2.gif',
  ],
};

export default action;
