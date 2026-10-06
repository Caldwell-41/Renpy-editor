// Injected only by explicit probes. Operates the rendered contenteditable, not a
// private editor API. Small fixture documents must be fully rendered.
window.__loomlightProbeEditor = element => {
  if (!element || element.tagName === 'TEXTAREA') return element;
  const lines = () => { if(element.querySelector('.cm-gap'))throw Error('Probe fixture exceeds rendered editor range');return [...element.querySelectorAll('.cm-line')]; };
  const offset = (node,at) => {let count=0;for(const line of lines()){if(line===node||line.contains(node)){const range=document.createRange();range.setStart(line,0);range.setEnd(node,at);return count+range.toString().length;}count+=line.textContent.length+1;}return 0;};
  const point = at => {const all=lines();for(const line of all){if(at<=line.textContent.length){const walker=document.createTreeWalker(line,4);let text;while((text=walker.nextNode())){if(at<=text.textContent.length)return [text,at];at-=text.textContent.length;}return [line,0];}at-=line.textContent.length+1;}const line=all.at(-1);return [line,line.childNodes.length];};
  return {
    get value(){return lines().map(l=>l.textContent).join('\n');},
    set value(text){element.focus();const selection=window.getSelection();selection.selectAllChildren(element);if(!document.execCommand('insertText',false,text))throw Error('Native contenteditable insert failed');},
    get readOnly(){return element.contentEditable==='false';},
    get selectionStart(){const s=window.getSelection();return Math.min(offset(s.anchorNode,s.anchorOffset),offset(s.focusNode,s.focusOffset));},
    get selectionEnd(){const s=window.getSelection();return Math.max(offset(s.anchorNode,s.anchorOffset),offset(s.focusNode,s.focusOffset));},
    setSelectionRange(from,to){element.focus();const a=point(from),b=point(to);window.getSelection().setBaseAndExtent(a[0],a[1],b[0],b[1]);document.dispatchEvent(new Event('selectionchange'));},
    focus(){element.focus();},dispatchEvent(event){return element.dispatchEvent(event);},
  };
};

// Recent-project buttons contain a date as well as their title. Match the title
// node exactly; do not accidentally select a similarly prefixed project.
window.__loomlightProbeFindButton = label => [...document.querySelectorAll('button')].find(button => {
  const text = button.classList.contains('recent-open')
    ? [...button.childNodes].filter(node => node.nodeType === 3).map(node => node.textContent).join('')
    : button.textContent;
  return text === label;
});
// Only use for reads or explicitly idempotent preference writes. Busy is a
// pre-dispatch rejection; other failures and the deadline remain failures.
window.__loomlightProbeRetryBusy = async (task, timeoutMs = 10000) => {
  const deadline = performance.now() + timeoutMs;
  for (;;) {
    try { return await task(); }
    catch (error) {
      if (error.code !== 'RUNTIME_BUSY' || performance.now() >= deadline) throw error;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
};
