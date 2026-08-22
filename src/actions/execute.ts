import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'казнить',
  description: 'Казнить radion321',
  requireTarget: true,
  onlyTargets: ['1080058929767268424'],
  customEmbed: (author, target) => ({
    description: `${author} торжественно казнит ${target}!`,
    color: 0x8b0000,
    image: 'http://77.110.101.28/cdn/other/bqJMiepPaOjd.gif',
  }),
};

export default action;
