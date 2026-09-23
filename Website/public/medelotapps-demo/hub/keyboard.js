/* ============================================================
   On-screen keyboard.

   The table has no physical keyboard, so any text input needs one
   drawn on the glass — the same thing OmniTapps provides. Kept
   generic (attach it to any <input>) rather than baked into the
   Stamboom search, because the Personen search needs it too.

   window.attachKeyboard(inputEl, { onInput, onSubmit })
   ============================================================ */
(function () {
  // The layout is declared in hub/product.json, not here. A Dutch QWERTY with
  // an "ij" key and a Limburg accent row is exactly right for one museum in
  // Limburg and wrong for everyone else. Key labels come from the string
  // tables, like all other interface copy.
  const DEFAULT_LAYOUT = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', '-'],
  ];

  function layout() {
    const config = (window.PRODUCT && window.PRODUCT.keyboard) || {};
    return {
      rows: (config.rows && config.rows.length) ? config.rows : DEFAULT_LAYOUT,
      accents: config.accents || [],
    };
  }

  // The panel is appended to #stage, not to the view that asked for it, so that
  // it lands inside the scaled design canvas. That also means hub.js's render()
  // cannot clear it away with the rest of the screen: render() empties #home and
  // #components, and the keyboard is in neither. Left alone it outlived the
  // screen it belonged to and — at z-index 90, above the header, the detail
  // overlay and everything else — swallowed every tap on whatever came next,
  // which looked exactly like the table having frozen.
  //
  // Only one keyboard can be open at a time, so one module-level handle is
  // enough for whoever tears a screen down to close it.
  let openKeyboard = null;
  window.closeKeyboard = function closeKeyboard() {
    if (openKeyboard) openKeyboard();
  };

  function el(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  }

  window.attachKeyboard = function attachKeyboard(input, options) {
    const opts = options || {};
    let panel = null;
    let accentsOpen = false;

    // The real keyboard must never appear on the kiosk, and the caret must
    // never be placed by the OS IME — we drive the value ourselves.
    input.setAttribute('readonly', 'readonly');
    input.setAttribute('inputmode', 'none');
    input.setAttribute('autocomplete', 'off');

    function emit() {
      input.dispatchEvent(new Event('input', { bubbles: true }));
      if (opts.onInput) opts.onInput(input.value);
    }

    function type(char) {
      input.value += char;
      emit();
    }

    function backspace() {
      input.value = input.value.slice(0, -1);
      emit();
    }

    function clear() {
      input.value = '';
      emit();
    }

    function close() {
      if (!panel) return;
      panel.remove();
      panel = null;
      input.classList.remove('kb-active');
      if (openKeyboard === close) openKeyboard = null;
    }

    function keyButton(label, kind, onTap) {
      const key = el(`<button class="kb-key ${kind || ''}">${label}</button>`);
      // pointerdown, not click: on a touch table the response should land
      // under the finger immediately rather than 300ms later.
      key.addEventListener('pointerdown', e => {
        e.preventDefault();
        key.classList.add('down');
        onTap();
      });
      const up = () => key.classList.remove('down');
      key.addEventListener('pointerup', up);
      key.addEventListener('pointercancel', up);
      key.addEventListener('pointerleave', up);
      return key;
    }

    function open() {
      if (panel) return;
      panel = el('<div class="kb-panel"></div>');
      input.classList.add('kb-active');

      const { rows: rowSpec, accents } = layout();
      const rows = el('<div class="kb-rows"></div>');

      rowSpec.forEach((row, i) => {
        const rowEl = el('<div class="kb-row"></div>');
        row.forEach(char => rowEl.appendChild(keyButton(char, '', () => type(char))));
        if (i === rowSpec.length - 1) {
          rowEl.appendChild(keyButton(iconSvg('backspace'), 'kb-wide kb-fn', backspace));
        }
        rows.appendChild(rowEl);
      });

      const accentRow = el('<div class="kb-row kb-accents"></div>');
      accents.forEach(char => accentRow.appendChild(keyButton(char, '', () => type(char))));
      accentRow.style.display = 'none';

      const bottom = el('<div class="kb-row kb-bottom"></div>');
      if (accents.length) {
        bottom.appendChild(keyButton(
          `á<span>${window.escapeHtml(window.ui('keyboard.accents'))}</span>`, 'kb-fn kb-wide', () => {
            accentsOpen = !accentsOpen;
            accentRow.style.display = accentsOpen ? '' : 'none';
          }));
      }
      bottom.appendChild(keyButton(window.escapeHtml(window.ui('keyboard.space')), 'kb-space', () => type(' ')));
      bottom.appendChild(keyButton(window.escapeHtml(window.ui('keyboard.clear')), 'kb-fn kb-wide', clear));
      bottom.appendChild(keyButton(window.escapeHtml(window.ui('keyboard.done')), 'kb-done kb-wide', () => {
        close();
        if (opts.onSubmit) opts.onSubmit(input.value);
      }));

      rows.appendChild(accentRow);
      rows.appendChild(bottom);
      panel.appendChild(rows);

      // Anchored to the stage, not the document, so it lands inside the scaled
      // design canvas rather than at real-screen coordinates.
      if (openKeyboard && openKeyboard !== close) openKeyboard();
      openKeyboard = close;
      (document.getElementById('stage') || document.body).appendChild(panel);
      panel.animate([{ opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 180, easing: 'ease-out' });
    }

    input.addEventListener('pointerdown', e => { e.preventDefault(); open(); });
    input.addEventListener('focus', open);

    return { open, close, clear, isOpen: () => !!panel };
  };
})();
