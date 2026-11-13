import type { LabMount } from '../../contracts.ts';
import { mountStatus } from './index.ts';
export const mount: LabMount = (host, context) => mountStatus(host, context, 'header-v2');
