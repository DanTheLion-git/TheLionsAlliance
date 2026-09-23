/* ============================================================
   A YouTube film that behaves like a <video> element.

   WHY THIS EXISTS
   ---------------
   On the touch table every film is a file in the content folder, and
   storyplayer.js drives it through the ordinary media element API:
   .play(), .paused, .muted, .currentTime, .duration, and the play /
   pause / loadedmetadata / timeupdate events. That is the right design
   for a kiosk with no guaranteed network.

   The public web demo cannot use it. Its three films are National
   Geographic's, and the only lawful way to show somebody else's film is
   their player — YouTube's iframe, with its branding and its counters
   intact. Downloading the mp4s and serving them from our own origin
   would be re-hosting, on a page that sells a product.

   WHAT IT DOES
   ------------
   Returns a DOM element that *is* a <video> as far as storyplayer.js is
   concerned: same properties, same events, backed by the YouTube IFrame
   API. So the player keeps its own transport bar, its own chapter ticks
   and its own muted-by-default rule, and the two lines that changed in
   storyplayer.js are a null check and a constructor call.

   Keep it that way. The moment this file starts needing storyplayer.js
   to know about YouTube, the demo has stopped demonstrating the product.
   ============================================================ */
(function () {
  const API_SRC = 'https://www.youtube.com/iframe_api';
  let apiReady = null;

  function loadApi() {
    if (apiReady) return apiReady;
    apiReady = new Promise((resolve, reject) => {
      if (window.YT && window.YT.Player) return resolve(window.YT);
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof previous === 'function') { try { previous(); } catch (e) { /* not ours */ } }
        resolve(window.YT);
      };
      const s = document.createElement('script');
      s.src = API_SRC;
      s.onerror = () => reject(new Error('YouTube IFrame API failed to load'));
      document.head.appendChild(s);
      setTimeout(() => reject(new Error('YouTube IFrame API timed out')), 15000);
    });
    return apiReady;
  }

  let seq = 0;

  /**
   * @param {string} videoId  the YouTube id
   * @param {object} opts     { poster, onError }
   * @returns {HTMLElement}   an element carrying the media-element surface
   */
  window.makeYouTubeVideo = function (videoId, opts) {
    opts = opts || {};
    const host = document.createElement('div');
    host.className = 'sp-video sp-video--yt';

    const mount = document.createElement('div');
    mount.id = 'yt-mount-' + (++seq);
    host.appendChild(mount);

    // Shown until the API answers, so the frame is never an empty black box.
    if (opts.poster) {
      host.style.backgroundImage = `url("${opts.poster}")`;
      host.classList.add('is-loading');
    }

    let player = null;
    let duration = 0;
    let paused = true;
    let muted = true;
    let pending = null;   // a seek asked for before the player existed
    let ticker = 0;

    const listeners = new Map();
    function on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    }
    function off(type, fn) {
      const set = listeners.get(type);
      if (set) set.delete(fn);
    }
    function emit(type) {
      const set = listeners.get(type);
      if (!set) return;
      set.forEach(fn => { try { fn({ type, target: host }); } catch (e) { console.error(e); } });
    }

    // storyplayer.js binds with addEventListener and never removes, but honour
    // both halves anyway — a half-implemented interface is how shims rot.
    host.addEventListener = function (type, fn) { on(type, fn); };
    host.removeEventListener = function (type, fn) { off(type, fn); };

    Object.defineProperties(host, {
      paused:   { get: () => paused },
      duration: { get: () => duration },
      currentTime: {
        get: () => (player && player.getCurrentTime) ? player.getCurrentTime() : 0,
        set: (t) => {
          if (player && player.seekTo) player.seekTo(t, true);
          else pending = t;
        },
      },
      muted: {
        get: () => muted,
        set: (v) => {
          muted = !!v;
          if (!player) return;
          if (muted) player.mute(); else player.unMute();
        },
      },
      // The real element exposes these; nothing in the player reads them today,
      // but a future caller that does should not get undefined.
      ended:  { get: () => !!player && player.getPlayerState && player.getPlayerState() === 0 },
      volume: { get: () => (player && player.getVolume ? player.getVolume() / 100 : 1), set: () => {} },
    });

    host.play = function () {
      if (player && player.playVideo) player.playVideo();
      else pendingPlay = true;
    };
    host.pause = function () {
      if (player && player.pauseVideo) player.pauseVideo();
      else pendingPlay = false;
    };
    let pendingPlay = false;

    // timeupdate has no equivalent event on the IFrame API, so it is polled.
    // 4/second matches what a <video> emits closely enough for a scrubber and
    // for the chapter-follow logic, and costs nothing measurable.
    function startTicker() {
      if (ticker) return;
      ticker = setInterval(() => emit('timeupdate'), 250);
    }
    function stopTicker() {
      clearInterval(ticker);
      ticker = 0;
    }

    loadApi().then(YT => {
      player = new YT.Player(mount.id, {
        videoId,
        // `origin` and `enablejsapi` are what the IFrame API documentation asks
        // for, and leaving them out is why the first build sat on a spinner:
        // the player loads, then will not start because it cannot verify who
        // is driving it.
        playerVars: {
          playsinline: 1,
          modestbranding: 1,
          rel: 0,             // no unrelated videos at the end
          iv_load_policy: 3,  // no annotations over a museum exhibit
          controls: 0,        // the product's own transport drives it
          disablekb: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            host.classList.remove('is-loading');
            duration = player.getDuration() || 0;
            if (muted) player.mute(); else player.unMute();
            if (pending != null) { player.seekTo(pending, true); pending = null; }
            emit('loadedmetadata');
            if (pendingPlay) player.playVideo();
          },
          onStateChange: (e) => {
            // 1 playing · 2 paused · 0 ended · 3 buffering
            if (!duration && player.getDuration) {
              duration = player.getDuration() || 0;
              if (duration) emit('loadedmetadata');
            }
            if (e.data === 1) {
              paused = false; emit('play'); startTicker();
            } else if (e.data === 2) {
              paused = true; emit('pause'); stopTicker();
            } else if (e.data === 0) {
              paused = true; emit('pause'); emit('ended'); stopTicker();
            }
          },
          onError: () => {
            host.classList.add('is-error');
            stopTicker();
            if (typeof opts.onError === 'function') opts.onError();
          },
        },
      });
    }).catch(err => {
      console.warn('[youtube]', err.message);
      host.classList.add('is-error');
      if (typeof opts.onError === 'function') opts.onError();
    });

    // Leaving the story must stop the sound, and the player is inside a
    // detached subtree by then, so nothing else will.
    host.destroy = function () {
      stopTicker();
      try { if (player && player.destroy) player.destroy(); } catch (e) { /* already gone */ }
    };

    return host;
  };
})();
