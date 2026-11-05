import type { LabMount } from '../../contracts.ts';
import { mountStudy } from './study.ts';
export const mount: LabMount = (host, context) => mountStudy(host, context, 'shot-reel');
