import type { LabMount } from '../../contracts.ts';
// Creation B reuses the production wizard's styles, so the step looks as it does in the app.
import '../../../src/styles.css';
import '../../../src/ui-refresh.css';
import { mountThemes } from './index.ts';
export const mount: LabMount = (host, context) => mountThemes(host, context, 'create-config');
