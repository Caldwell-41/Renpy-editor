const paths: Record<string,string> = {
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM10 2h4l1 3 3 2 3 1v4l-3 1-2 3-1 3h-4l-1-3-3-2-3-1v-4l3-1 2-3Z',
  panel: 'M3 4h18v16H3zM9 4v16m6-10-3 2 3 2',
  panelOpen: 'M3 4h18v16H3zM9 4v16m3-10 3 2-3 2',
  story: 'M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1Zm0 0v15',
  source: 'm8 6-6 6 6 6m8-12 6 6-6 6m-3-16-2 20',
  branches: 'M12 5v5M5 18v-5h14v5M12 10v3M10 1h4v4h-4zM3 18h4v4H3zM17 18h4v4h-4z',
  characters: 'M16 21v-3a5 5 0 0 0-10 0v3M11 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm7 0a4 4 0 0 1 0 8m1 3a5 5 0 0 1 3 4v3',
  plus: "M12 5v14M5 12h14",
  back: "m14 5-7 7 7 7M7 12h14",
  lorebook: "M4 3h16v18H4zM8 3v18M12 7h5M12 11h5",
  assets: 'M3 3h18v18H3zM3 17l5-6 5 6 3-4 5 6M15 7h.01',
  variables: 'M8 3H5v6l-2 3 2 3v6h3m8-18h3v6l2 3-2 3v6h-3',
};
export function icon(name: string): SVGSVGElement {
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.classList.add('navigation-icon');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
  const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[name]??paths.story!);path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.5');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');svg.append(path);return svg;
}
