import type { LabMount } from '../../contracts.ts';
import { mountGameUi } from './index.ts';
export const mount: LabMount = (host, context) => mountGameUi(host, context, 'click');
