/** Read-only presentation; exact metadata remains separately inspectable. */
const names:Record<string,string>={title:"Name",aliases:"Aliases",description:"Description",appearanceNotes:"Appearance notes",personality:"Personality",motivations:"Motivations",background:"Background",relationships:"Relationships",speakingStyle:"Speaking style",exampleDialogue:"Example dialogue",text:"Text",category:"Category",subject:"Subject",tags:"Tags",knowledgeNotes:"Knowledge and spoiler notes",knowledge:"Knowledge",scope:"Applies to",provenance:"Where these notes came from",citations:"Supporting references",links:"Story links",linkedCharacterId:"Game character",linkedLoreIds:"Linked lore",kind:"Type",type:"Type",notes:"Notes",sceneIds:"Scenes",recordId:"Reference",revisionId:"Saved revision",supportingReadSet:"Supporting saved material"};
export function referenceFieldName(key:string):string{return names[key]??key.replace(/([a-z])([A-Z])/g,"$1 $2");}
export function referenceValue(value:unknown):string {
 if(value===null||value===undefined)return "None";
 if(typeof value==="string")return value||"None";
 if(typeof value!=="object")return String(value);
 if(Array.isArray(value))return value.length?value.map(referenceValue).join("\n"):"None";
 const scope=value as {type?:unknown;sceneIds?:unknown};if(scope.type==="project")return "Whole project";if(scope.type==="scenes")return `Selected Scenes: ${referenceValue(scope.sceneIds)}`;
 return Object.entries(value).map(([key,item])=>`${referenceFieldName(key)}: ${key==="type"&&item==="project"?"Whole project":key==="kind"&&item==="userAuthored"?"Written by me":referenceValue(item)}`).join("\n")||"None";
}
export function referenceComparison(label:string,before:unknown,after:unknown):HTMLElement {
 const section=document.createElement("section");section.className="reference-comparison";
 const title=document.createElement("h4");title.textContent=label;section.append(title);
 const columns=document.createElement("div");columns.className="review-columns";
 for(const [heading,value] of [["Current approved text",before],["Proposed text",after]]){const panel=document.createElement("section"),name=document.createElement("h5"),text=document.createElement("p");name.textContent=String(heading);text.textContent=referenceValue(value);text.className="review-prose";panel.append(name,text);columns.append(panel);}
 section.append(columns);return section;
}
