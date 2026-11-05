import '../../../src/styles.css';
import '../../../src/ui-refresh.css';
import { mountStudy } from './refined-study.ts';
void mountStudy(document.querySelector<HTMLElement>('#preview')!, {state:new URLSearchParams(location.search).get('state')??'button',theme:'dark'},'inspector');
