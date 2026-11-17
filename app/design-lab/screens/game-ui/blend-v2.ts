// Layout B after its approval as blend-v1. The lab pins that source, so later revisions mount here.
import type { LabMount } from '../../contracts.ts';
import { mountGameUi } from './index.ts';
export const mount: LabMount = (host, context) => mountGameUi(host, context, 'blend');
