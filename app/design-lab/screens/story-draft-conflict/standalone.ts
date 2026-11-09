import '../../../src/styles.css';
import { mountConflict, type Variant } from './index.ts';
const query = new URLSearchParams(location.search);
const variant: Variant = query.get('variant') === 'compact' ? 'compact' : 'inline';
const host = document.querySelector<HTMLElement>('#preview')!;
mountConflict(host, { state: query.get('state') ?? 'conflict', theme: 'dark' }, variant);
host.dataset.ready = 'true';
