/* ============================================================
   Video controls for the timeline's leaf cards.

   The archive films sit on cards that are dragged, pinched and
   rotated, so `<video controls>` is not an option: the native
   chrome cannot rotate with the card, sizes itself in real screen
   pixels rather than the design canvas's, and eats the pointer
   events the card's own gestures need.

   The shape is the one a visitor already knows from Reels and
   TikTok — tap the picture to play or pause, a scrub line along
   the bottom edge, a speaker to bring the sound in.

   Nothing plays by itself. A year canvas can land several films at
   once, and several soundless films all running at the same time
   read as a wall of flicker rather than as things you could watch.
   A card therefore arrives showing its own first frame under a play
   button, and starts when someone asks it to.

   While a film is paused the bar stays up — the visitor is looking
   at a still picture and needs to see how to start it. Once it is
   running the bar clears away after four seconds so the film is not
   permanently half covered, and the next tap brings it back rather
   than stopping the film, the way every phone does it.

   Everything interactive carries `.no-drag`, which is what tells
   `makeInteractiveCard` to keep its hands off the gesture (see
   interactive.js) — otherwise the first touch on the scrubber
   would be captured by the card and start dragging it instead.

   window.attachVideoControls(mediaEl, src) -> { video, togglePlay }
   ============================================================ */
(function () {
  const REVEAL_MS = 4000;   // how long the full bar stays out after a touch

  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function fmt(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60);
    return m + ':' + String(Math.floor(seconds % 60)).padStart(2, '0');
  }

  window.attachVideoControls = function attachVideoControls(mediaEl, src, opts) {
    opts = opts || {};
    // Muted is the right museum default — a room where every card that lands
    // starts talking is unusable. Sound arrives only when someone asks for it.
    // No `autoplay` and no `loop`: a film starts because a visitor tapped it,
    // and reaching the end is a real end, which is also what hands the table's
    // idle timer back its job (see anyMediaPlaying in hub.js).
    const video = el('<video src="' + src + '" muted playsinline preload="metadata"></video>');
    mediaEl.appendChild(video);

    const ui = el(`<div class="vc js-dispose">
      <div class="vc-flash"></div>
      <button class="vc-bigplay no-drag"></button>
      <div class="vc-bar no-drag">
        <button class="vc-btn vc-play"></button>
        <div class="vc-time vc-elapsed">0:00</div>
        <div class="vc-track">
          <div class="vc-mark vc-mark-a"></div>
          <div class="vc-mark vc-mark-b"></div>
          <div class="vc-rail"><div class="vc-fill"></div></div>
          <div class="vc-knob"></div>
        </div>
        <div class="vc-time vc-duration">0:00</div>
        <button class="vc-btn vc-mute"></button>
      </div>
    </div>`);
    mediaEl.appendChild(ui);

    const flashEl = ui.querySelector('.vc-flash');
    const bigPlayBtn = ui.querySelector('.vc-bigplay');
    const playBtn = ui.querySelector('.vc-play');
    const muteBtn = ui.querySelector('.vc-mute');
    const elapsedEl = ui.querySelector('.vc-elapsed');
    const durationEl = ui.querySelector('.vc-duration');
    const track = ui.querySelector('.vc-track');
    const fill = ui.querySelector('.vc-fill');
    const knob = ui.querySelector('.vc-knob');
    const markA = ui.querySelector('.vc-mark-a');
    const markB = ui.querySelector('.vc-mark-b');

    // ---------- reveal / collapse ----------
    let revealTimer = null;
    function reveal() {
      ui.classList.add('is-revealed');
      clearTimeout(revealTimer);
      // A paused film keeps its controls up indefinitely: there is nothing to
      // look past, and hiding the only affordance for starting it would leave a
      // card that looks like a photograph and behaves like nothing. Only a
      // running film clears them away.
      if (video.paused) return;
      revealTimer = setTimeout(() => ui.classList.remove('is-revealed'), REVEAL_MS);
    }

    // What the card hands a tap to (see makeInteractiveCard in interactive.js).
    // Hidden controls mean the visitor cannot see what a tap would do, so the
    // first one only brings them back — stopping a film because someone reached
    // for the scrub bar is the wrong answer. With the bar up it means what it
    // has always meant. A paused film always has its bar up, so tapping a
    // stopped film starts it in one touch.
    function tap() {
      if (!video.paused && !ui.classList.contains('is-revealed')) { reveal(); return; }
      togglePlay();
    }

    // ---------- where along the rail is that finger? ----------
    // The card is rotated and scaled, and sits inside the CSS-scaled #stage,
    // so a bounding rect on the rail is an axis-aligned box drawn *around* a
    // tilted line — its left and width are not the line's ends, and scrubbing
    // off them lands progressively further from the finger the more the card
    // is turned. Two zero-size markers at the rail's ends give those two
    // points exactly under any transform (a degenerate box's rect *is* the
    // transformed point), and projecting the finger onto the segment between
    // them is then plain geometry that needs to know nothing about the
    // transforms stacked above it.
    function fractionAt(clientX, clientY) {
      const a = markA.getBoundingClientRect();
      const b = markB.getBoundingClientRect();
      const vx = b.left - a.left, vy = b.top - a.top;
      const len2 = vx * vx + vy * vy;
      if (!len2) return 0;
      const t = ((clientX - a.left) * vx + (clientY - a.top) * vy) / len2;
      return Math.max(0, Math.min(1, t));
    }

    // ---------- painting ----------
    function paint(fraction) {
      const f = Number.isFinite(fraction)
        ? fraction
        : (video.duration ? video.currentTime / video.duration : 0);
      const clamped = Math.max(0, Math.min(1, f));
      const pct = (clamped * 100).toFixed(3) + '%';
      fill.style.width = pct;
      knob.style.left = pct;
      elapsedEl.textContent = fmt(video.duration ? clamped * video.duration : 0);
    }

    function syncPlay() {
      playBtn.innerHTML = iconSvg(video.paused ? 'play' : 'pause');
      ui.classList.toggle('is-paused', video.paused);
    }
    bigPlayBtn.innerHTML = iconSvg('play');
    bigPlayBtn.addEventListener('click', togglePlay);

    function syncMute() {
      muteBtn.innerHTML = iconSvg(video.muted ? 'soundOff' : 'sound');
      ui.classList.toggle('is-muted', video.muted);
    }

    function flash(name) {
      flashEl.innerHTML = iconSvg(name);
      flashEl.classList.remove('is-on');
      void flashEl.offsetWidth;          // restart the animation
      flashEl.classList.add('is-on');
    }

    // ---------- play / pause ----------
    function togglePlay() {
      const willPlay = video.paused;
      if (willPlay) video.play().catch(() => { /* a film the table can't decode */ });
      else video.pause();
      flash(willPlay ? 'play' : 'pause');
      reveal();
    }

    playBtn.addEventListener('click', togglePlay);

    // ---------- sound ----------
    muteBtn.addEventListener('click', () => {
      const unmuting = video.muted;
      if (unmuting) {
        // One table, several cards, one room: bringing this film's sound in
        // silences every other film rather than adding to them.
        document.querySelectorAll('video').forEach(v => { if (v !== video) v.muted = true; });
      }
      video.muted = !unmuting;
      reveal();
    });

    // ---------- scrubbing ----------
    let scrubId = null;
    let resumeAfterScrub = false;

    function seekTo(fraction) {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = fraction * video.duration;
      }
      paint(fraction);
    }

    track.addEventListener('pointerdown', (e) => {
      scrubId = e.pointerId;
      track.setPointerCapture(e.pointerId);
      ui.classList.add('is-scrubbing');
      resumeAfterScrub = !video.paused;
      video.pause();
      seekTo(fractionAt(e.clientX, e.clientY));
      reveal();
    });

    track.addEventListener('pointermove', (e) => {
      if (scrubId !== e.pointerId) return;
      seekTo(fractionAt(e.clientX, e.clientY));
      reveal();
    });

    function endScrub(e) {
      if (scrubId !== e.pointerId) return;
      scrubId = null;
      ui.classList.remove('is-scrubbing');
      if (resumeAfterScrub) video.play().catch(() => {});
      syncPlay();
      reveal();
    }
    track.addEventListener('pointerup', endScrub);
    track.addEventListener('pointercancel', endScrub);
    track.addEventListener('lostpointercapture', endScrub);

    // ---------- video -> UI ----------
    video.addEventListener('timeupdate', () => { if (scrubId === null) paint(); });
    video.addEventListener('play', () => { syncPlay(); reveal(); });
    video.addEventListener('pause', () => { syncPlay(); reveal(); });
    // `ended` does not fire `pause`, and this is exactly the moment the bar has
    // to come back: the film has stopped and the card needs to offer it again.
    video.addEventListener('ended', () => { syncPlay(); reveal(); });
    video.addEventListener('volumechange', syncMute);
    // ---------- first frame and true shape ----------
    // Nothing autoplays now, and a <video> that has never decoded a frame paints
    // black — on a scatter of photographs that reads as a broken card rather
    // than as a film waiting to be tapped. Seeking a hair off zero forces one
    // real frame out of the decoder. Strictly once: doing it again after the
    // visitor has started the film would rewind them.
    let posterDone = false;
    function showFirstFrame() {
      if (posterDone || !video.paused) return;
      posterDone = true;
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      try { video.currentTime = Math.min(0.1, video.duration / 20); } catch (err) { /* not seekable */ }
    }

    // The card carrying this film was sized from `item.width`/`item.height`,
    // which the scanner only fills in for a still image — a film therefore lands
    // on the 800x600 default whatever shape it really is, and gets cropped to
    // fit. The file itself is the only thing that knows, and it knows here.
    // Reported once; the card then resizes about its own centre (resizeLeaf).
    let aspectDone = false;
    function reportAspect() {
      if (aspectDone) return;
      const w = video.videoWidth, h = video.videoHeight;
      if (!w || !h) return;
      aspectDone = true;
      if (typeof opts.onAspect === 'function') opts.onAspect(w / h);
    }

    video.addEventListener('loadedmetadata', () => {
      durationEl.textContent = fmt(video.duration);
      reportAspect();
      showFirstFrame();
      paint();
    });
    // Belt and braces: a file reporting no dimensions at metadata time usually
    // has them by the time it has an actual frame decoded.
    video.addEventListener('loadeddata', reportAspect);

    // A film the table cannot decode (H.264 4:2:2 is the one that turns up in
    // this archive) fires `error` and never plays. Say so on the card rather
    // than leaving a black rectangle with a dead play button.
    video.addEventListener('error', () => {
      if (ui.querySelector('.vc-error')) return;
      ui.classList.add('is-broken');
      const message = window.ui('video.cannotPlay');
      ui.insertAdjacentHTML('beforeend', '<div class="vc-error">' + message + '</div>');
    });

    ui.addEventListener('view-dispose', () => {
      clearTimeout(revealTimer);
      try { video.pause(); } catch (err) { /* already detached */ }
    });

    syncPlay();
    syncMute();
    durationEl.textContent = fmt(video.duration);
    paint(0);
    reveal();

    return { video, togglePlay, tap };
  };
})();
