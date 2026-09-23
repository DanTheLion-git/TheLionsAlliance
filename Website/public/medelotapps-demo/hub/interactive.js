/* ============================================================
   Drag / pinch-scale / corner-drag-rotate gesture handling for
   the timeline's scattered "leaves" detail view.

   - Drag the body of a card: move it.
   - Pinch with two fingers on the card: scale it.
   - Drag one of the four corner handles: rotate it around its
     own center (replacing OmniTapps' small scale/rotate handle).
   - A tap (press+release with negligible movement) opens the
     full viewer instead of being treated as a drag.
   ============================================================ */
(function () {
  const TAP_MOVE_THRESHOLD = 6; // px

  /**
   * Angle in radians from an element's centre to a pointer, in real screen
   * pixels. Rotation is scale-invariant, so unlike drag deltas this needs no
   * division by the ancestor scale — which is exactly why it's safe to share
   * between the leaf-card corner rotate and the Tradities jaarwiel.
   */
  window.pointerAngle = function pointerAngle(element, clientX, clientY) {
    const r = element.getBoundingClientRect();
    return Math.atan2(clientY - (r.top + r.height / 2), clientX - (r.left + r.width / 2));
  };

  window.makeInteractiveCard = function (cardEl, state, onTap) {
    const pointers = new Map(); // pointerId -> {role:'body'|'corner', x, y}
    let bodyDragId = null;
    let dragStart = null; // {px,py,startX,startY}
    let pinchIds = null;
    let pinchStartDist = null;
    let pinchStartScale = null;
    let rotateId = null;
    let rotateStartAngle = 0;
    let rotateStartRotation = 0;
    let totalMove = 0;

    function apply() {
      cardEl.style.transform = `translate(${state.x}px, ${state.y}px) rotate(${state.rotation}deg) scale(${state.scale})`;
    }

    function bodyPointerIds() {
      return [...pointers].filter(([, v]) => v.role === 'body').map(([id]) => id);
    }

    // state.x/y live in the design canvas's own coordinate space, which is
    // itself scaled to fit the real screen (see #stage in hub.js — 1x only
    // on an actual 4K display, 0.5x on a 1920-wide one, etc). Pointer events
    // report real screen pixels, so drag deltas must be divided by that
    // cumulative ancestor scale or the card lags behind the finger.
    // cardEl's own offsetParent (.leaves-canvas) is unrotated and unscaled
    // by itself, so the ratio of its rendered rect to its layout size is
    // exactly that ancestor scale factor.
    function ancestorScale() {
      const parent = cardEl.offsetParent;
      if (!parent || !parent.offsetWidth) return 1;
      return parent.getBoundingClientRect().width / parent.offsetWidth;
    }

    // Our own bookkeeping (`pointers`, bodyDragId, rotateId, pinchIds) only
    // updates when pointerup/pointercancel/lostpointercapture actually reach
    // us. On real touch hardware a release can be reported late relative to
    // the next touch-down in the same spot, so a fast lift-and-regrab can
    // start its pointerdown while the previous pointer is still sitting in
    // our map — turning what should be a fresh single-finger drag into a
    // (mis-detected) 2-finger pinch. `hasPointerCapture` is the browser's own
    // ground truth for "is this pointerId still actually captured here",
    // so use it to evict anything we think is live but isn't, before
    // deciding whether a new touch is a drag or the second finger of a pinch.
    function pruneStalePointers() {
      for (const id of [...pointers.keys()]) {
        if (cardEl.hasPointerCapture(id)) continue;
        pointers.delete(id);
        if (bodyDragId === id) { bodyDragId = null; dragStart = null; }
        if (rotateId === id) rotateId = null;
        if (pinchIds && pinchIds.includes(id)) pinchIds = null;
      }
    }

    cardEl.addEventListener('pointerdown', (e) => {
      // A control drawn on top of the card (the video scrubber, its play and
      // sound buttons) opts out by carrying `.no-drag`. Without this the very
      // first touch on a scrubber is captured by the card and becomes a drag,
      // so the control can never receive the move — the same class of problem
      // as the jaarwiel's silently-unclickable markers. Bail before capturing
      // anything, and let the event reach the control and bubble on to the
      // hub's idle reset as normal.
      if (e.target.closest('.no-drag')) return;

      pruneStalePointers();
      cardEl.setPointerCapture(e.pointerId);

      // Whatever was touched last stays on top of the others — re-appending
      // an existing child moves it to the end of its parent, which is also
      // the end of paint order for normal (non-z-indexed) siblings. Skip the
      // reorder when it's already last: re-inserting an in-place child is a
      // no-op for stacking, but some engines still run a remove+insert cycle
      // for it, which can silently drop the pointer capture we just set on
      // this very touch a moment ago — most noticeable as a corner rotate
      // that stops tracking within a second, since the corner hit-zone is
      // small enough that losing capture immediately loses the gesture.
      if (cardEl.parentNode.lastElementChild !== cardEl) {
        cardEl.parentNode.appendChild(cardEl);
      }

      const isCorner = e.target.classList.contains('corner-handle');

      if (isCorner) {
        rotateId = e.pointerId;
        rotateStartAngle = window.pointerAngle(cardEl, e.clientX, e.clientY);
        rotateStartRotation = state.rotation;
        pointers.set(e.pointerId, { role: 'corner', x: e.clientX, y: e.clientY });
      } else {
        pointers.set(e.pointerId, { role: 'body', x: e.clientX, y: e.clientY });
        const bodyIds = bodyPointerIds();
        if (bodyIds.length === 1) {
          bodyDragId = e.pointerId;
          dragStart = { px: e.clientX, py: e.clientY, startX: state.x, startY: state.y };
          totalMove = 0;
        } else if (bodyIds.length === 2) {
          pinchIds = bodyIds;
          const p1 = pointers.get(pinchIds[0]), p2 = pointers.get(pinchIds[1]);
          pinchStartDist = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
          pinchStartScale = state.scale;
          bodyDragId = null;
        }
      }
      cardEl.classList.add('active-gesture');
      e.stopPropagation();
    });

    cardEl.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      const rec = pointers.get(e.pointerId);
      pointers.set(e.pointerId, { role: rec.role, x: e.clientX, y: e.clientY });

      if (rotateId === e.pointerId) {
        const angle = window.pointerAngle(cardEl, e.clientX, e.clientY);
        state.rotation = rotateStartRotation + (angle - rotateStartAngle) * 180 / Math.PI;
        apply();
        return;
      }

      if (pinchIds) {
        const p1 = pointers.get(pinchIds[0]), p2 = pointers.get(pinchIds[1]);
        if (p1 && p2) {
          const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
          state.scale = Math.max(0.3, Math.min(3.5, pinchStartScale * (dist / pinchStartDist)));
          apply();
        }
        return;
      }

      if (bodyDragId === e.pointerId && dragStart) {
        const screenDx = e.clientX - dragStart.px, screenDy = e.clientY - dragStart.py;
        totalMove = Math.max(totalMove, Math.hypot(screenDx, screenDy));
        const s = ancestorScale();
        state.x = dragStart.startX + screenDx / s;
        state.y = dragStart.startY + screenDy / s;
        apply();
      }
    });

    function endPointer(e) {
      if (!pointers.has(e.pointerId)) return;
      const wasBodyDrag = bodyDragId === e.pointerId;
      const wasTapCandidate = wasBodyDrag && totalMove < TAP_MOVE_THRESHOLD && !pinchIds;
      pointers.delete(e.pointerId);
      if (rotateId === e.pointerId) rotateId = null;

      if (pinchIds && pinchIds.includes(e.pointerId)) {
        pinchIds = null;
        const remaining = bodyPointerIds();
        if (remaining.length === 1) {
          const id = remaining[0], p = pointers.get(id);
          bodyDragId = id;
          dragStart = { px: p.x, py: p.y, startX: state.x, startY: state.y };
          totalMove = 0;
        } else {
          bodyDragId = null;
        }
      } else if (wasBodyDrag) {
        bodyDragId = null;
        dragStart = null;
      }

      if (pointers.size === 0) cardEl.classList.remove('active-gesture');
      if (wasTapCandidate && onTap) onTap();
    }
    cardEl.addEventListener('pointerup', endPointer);
    cardEl.addEventListener('pointercancel', endPointer);
    // Belt-and-suspenders: if capture is ever released without a matching
    // pointerup/pointercancel reaching us (seen on some touch stacks), this
    // still fires and prevents a stale pointer from wedging the gesture
    // state — otherwise the next single-finger touch reads as a 2-finger
    // pinch against a dead point, and the card never drags again.
    cardEl.addEventListener('lostpointercapture', endPointer);

    // Caller controls the first apply() — e.g. to run an entrance animation
    // from an origin pose before settling into `state`'s resting pose.
    return { apply };
  };
})();
