import '../../../src/styles.css';
import '../../../src/ui-refresh.css';
import { mountStudy, type Variant } from './study.ts';
const params = new URLSearchParams(location.search);
const variant = params.get('variant')?.replace('-v1','') as Variant ?? 'inspector';
const host = document.querySelector<HTMLElement>('#preview')!;
void mountStudy(host, { state: params.get('state') ?? 'button', theme: 'dark' }, ['inspector','focus','table'].includes(variant) ? variant : 'inspector');
