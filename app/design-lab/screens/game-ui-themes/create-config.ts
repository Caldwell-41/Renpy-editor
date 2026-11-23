import type { LabMount } from '../../contracts.ts';
import { mountThemes } from './index.ts';
export const mount: LabMount = (host, context) => mountThemes(host, context, 'create-config');
