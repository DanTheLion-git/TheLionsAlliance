/* Icon set — ported from the design source's Icon.jsx (same viewBox/stroke settings) */
(function () {
  const PATHS = {
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M21 17l-5-5-9 9"/>',
    mic: '<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    map: '<path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>',
    building: '<path d="M5 21V5l7-2 7 2v16M5 21h14M9 9h2M13 9h2M9 13h2M13 13h2M9 17h2M13 17h2"/>',
    film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
    mask: '<path d="M4 8c0-2 2-3 4-3 1.5 0 3 .5 4 1.5C13 5.5 14.5 5 16 5c2 0 4 1 4 3v2c0 5-4 9-8 9s-8-4-8-9V8z"/><circle cx="9" cy="11" r="1" fill="currentColor"/><circle cx="15" cy="11" r="1" fill="currentColor"/>',
    puzzle: '<path d="M10 3h4v3a2 2 0 1 0 4 0V9h3v4h-3a2 2 0 1 0 0 4h3v3h-4v-3a2 2 0 1 0-4 0v3H7v-4a2 2 0 1 0-4 0H3V9h3v0a2 2 0 1 0 0-3V3h4z"/>',
    speech: '<path d="M20 4H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h3v4l5-4h8a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z"/><path d="M8 9h8M8 12.5h5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    home: '<path d="M3 12l9-8 9 8v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1v-9z"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    play: '<path d="M7 5v14l12-7z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M8 5v14M16 5v14" stroke-width="3"/>',
    chevronR: '<path d="M9 6l6 6-6 6"/>',
    chevronL: '<path d="M15 6l-6 6 6 6"/>',
    swipe: '<path d="M9 11V5a2 2 0 1 1 4 0v6"/><path d="M13 11V8a2 2 0 1 1 4 0v6c0 4-3 7-7 7-4 0-7-3-7-7v-1l3-3 2 2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    backspace: '<path d="M21 5H9L3 12l6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z"/><path d="M18 9l-6 6M12 9l6 6"/>',
    tree: '<path d="M12 22v-6M12 16l-6-3M12 16l6-3"/><circle cx="12" cy="4" r="2.5"/><circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="12" r="2.5"/><path d="M12 6.5V9M10.4 10.6L6.8 10M13.6 10.6l3.6-.6"/>',
    sound: '<path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>',
    soundOff: '<path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M17 10l4 4M21 10l-4 4"/>',
    rotate: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/>',
    cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
  };

  window.iconSvg = function (name, extraAttrs) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extraAttrs || ''}>${PATHS[name] || ''}</svg>`;
  };
})();
