import type { LabMount } from '../../contracts.ts';
import { mountStory } from './workspace.ts';
export const mount: LabMount = (host, context) => mountStory(host, context, 'manuscript');
