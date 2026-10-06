import { observeProgress } from "./bridge.ts";
/** Stable region for one in-flight native request. No timer-derived progress. */
export function operationProgress(host: HTMLElement, operation: "sdk.install" | "project.create", withGit = false): { dispose: () => void; fail: (message: string) => void } {
  const stages: [string,string][] = operation === "sdk.install" ? [["download","Download SDK"],["verify","Verify download"],["install","Install SDK"]] : [["prepare","Prepare project files"],["generate","Generate game"],...(withGit ? [["git","Initialize local Git"] as [string,string]] : []),["validate","Validate with Ren’Py"],["finalise","Finalise project"],["open","Open project"]];
  const panel=document.createElement("section");panel.className="operation-panel";panel.ariaLabel=operation==="sdk.install"?"SDK installation progress":"Project creation progress";
  const bar=document.createElement("progress");bar.className="operation-progress";bar.ariaLabel="Operation progress";
  const label=document.createElement("p");label.role="status";label.ariaLive="polite";label.textContent="Starting…";
  const bytes=document.createElement("p");bytes.className="muted progress-bytes";bytes.textContent=" ";
  const list=document.createElement("ol");list.className="progress-list";
  stages.forEach(([,name])=>{const row=document.createElement("li");row.textContent=name;row.dataset.state="pending";list.append(row);});panel.append(label,bar,bytes,list);host.append(panel);
  const dispose=observeProgress((name,update)=>{
    if(name!==operation || !panel.isConnected)return;
    const index=stages.findIndex(([id])=>id===update.stage);if(index<0)return;
    [...list.children].forEach((row,i)=>(row as HTMLElement).dataset.state=i<index?"complete":i===index?"active":"pending");
    const title=stages[index]![1];if(label.textContent!==title)label.textContent=title;
    if(update.stage==="download"&&update.bytes!=null){
      bytes.textContent=update.total ? `${(update.bytes/1048576).toFixed(1)} MB of ${(update.total/1048576).toFixed(1)} MB · ${Math.min(100,Math.floor(update.bytes/update.total*100))}%` : `${(update.bytes/1048576).toFixed(1)} MB downloaded`;
      if(update.total){bar.max=update.total;bar.value=Math.min(update.bytes,update.total);}else bar.removeAttribute("value");
    }else{bar.removeAttribute("value");bytes.textContent=" ";}
  });
  return {dispose,fail:message=>{dispose();label.textContent=message;label.role="alert";panel.dataset.failed="true";bar.hidden=true;}};
}
