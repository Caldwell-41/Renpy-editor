import type { LabMount } from '../../contracts.ts';
import { mountStudy } from './refined-study.ts';
export const mount: LabMount = (host, context) => mountStudy(host, context, 'inspector');
