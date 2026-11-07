// Line icons for beat types, drawn to match src/icons.ts (24px grid, 1.5 stroke).
const paths: Record<string, string> = {
  dialogue: 'M4 5h16v11H9l-5 4zM8 9h8M8 12h5',
  narration: 'M4 6h16M4 10h16M4 14h12M4 18h8',
  background: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M16 9h.01',
  showCharacter: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21v-2a6 6 0 0 1 11-3M18 14v6M15 17h6',
  hideCharacter: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21v-2a6 6 0 0 1 11-3M15 17h6',
  changeAppearance: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01',
  placement: 'M12 4v16M4 12h16M7 9l-3 3 3 3M17 9l3 3-3 3',
  transition: 'M3 5h18v14H3zM12 5v14M12 9l4-4M12 15l9-9M12 19l9-9',
  playMusic: 'M9 18V6l11-2v12M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  stopMusic: 'M9 18V6l11-2v6M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM14 14h7v7h-7z',
  playSfx: 'M4 9h4l5-4v14l-5-4H4zM17 9a4 4 0 0 1 0 6M19.5 6.5a8 8 0 0 1 0 11',
  choice: 'M4 6h3M4 12h3M4 18h3M10 6h10M10 12h10M10 18h10',
  condition: 'M6 3v7a4 4 0 0 0 4 4h4a4 4 0 0 1 4 4v3M6 21v-8M18 3v4M15 6l3-3 3 3',
  call: 'M4 12h11M11 8l4 4-4 4M20 5v14',
  jump: 'M4 17c0-6 4-10 10-10h6M16 3l4 4-4 4',
  return: 'M20 7v6a4 4 0 0 1-4 4H5M9 13l-4 4 4 4',
  setVariable: 'M8 3H6a2 2 0 0 0-2 2v4l-2 3 2 3v4a2 2 0 0 0 2 2h2M16 3h2a2 2 0 0 1 2 2v4l2 3-2 3v4a2 2 0 0 1-2 2h-2M9 10h6M9 14h6',
  showScreen: 'M3 4h18v13H3zM8 21h8M12 17v4',
  hideScreen: 'M3 4h18v13H3zM8 21h8M12 17v4M9 8l6 6M15 8l-6 6',
  callScreen: 'M3 4h18v13H3zM8 21h8M12 17v4M8 10h8M8 13h5',
  customCode: 'M6 11V8a6 6 0 0 1 12 0v3M4 11h16v10H4zM12 15v2',
  music: 'M9 18V6l11-2v12M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4',
  close: 'M6 6l12 12M18 6 6 18',
  continue: 'M12 4v14M6 12l6 6 6-6',
  loop: 'M4 12a8 8 0 0 1 14-5.3M20 4v5h-5M20 12a8 8 0 0 1-14 5.3M4 20v-5h5',
  open: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
};

export function beatIcon(name: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('sc-icon'); svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(svg.namespaceURI, 'path');
  path.setAttribute('d', paths[name] ?? paths.narration!); path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.5'); path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round');
  svg.append(path); return svg;
}
