import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'поцеловать',
  textName: 'поцеловать',
  aliases: ['kiss'],
  description: 'Поцеловать пользователя',
  template: '{author} нежно поцеловал(а) {target}.',
  selfTemplate: '{author} посылает воздушный поцелуй всем вокруг.',
  requireTarget: false,
  color: 0xff5e8a,
};

export default action;
