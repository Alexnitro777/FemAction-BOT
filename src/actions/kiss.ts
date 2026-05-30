import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'kiss',
  textName: 'поцеловать',
  aliases: ['kiss'],
  description: 'Поцеловать пользователя',
  template: '{author} нежно поцеловал(а) {target}.',
  selfTemplate: '{author} посылает воздушный поцелуй всем вокруг.',
  requireTarget: false,
  color: 0xff5e8a,
  gifs: [
    'https://media.tenor.com/example-kiss-1.gif',
    'https://media.tenor.com/example-kiss-2.gif',
  ],
};

export default action;
