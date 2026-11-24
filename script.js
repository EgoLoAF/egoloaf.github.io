/* Progressive enhancement for the EgoLoAF project page. No media is fetched
   for an unselected task or a closed film dialog. */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Compact navigation keeps its native links available if this script fails.
  const header = $('#site-header');
  const navInstitutions = $('#nav-institutions');
  const navBrand = $('.nav-brand');
  const menuToggle = $('.menu-toggle');
  const navigation = $('#navigation');
  const setMenuOpen = (open, restoreFocus = false) => {
    if (!menuToggle || !navigation) return;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    navigation.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    if (restoreFocus) menuToggle.focus();
  };
  menuToggle?.addEventListener('click', () => {
    setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
  });
  navigation?.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenuOpen(false);
  });
  document.addEventListener('click', (event) => {
    if (menuToggle?.getAttribute('aria-expanded') === 'true' &&
        !navigation.contains(event.target) && !menuToggle.contains(event.target)) {
      setMenuOpen(false);
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(false, true);
    }
  });
  const desktopNavigation = window.matchMedia('(min-width: 1280px)');
  const closeDesktopMenu = () => {
    if (desktopNavigation.matches) setMenuOpen(false);
  };
  desktopNavigation.addEventListener('change', closeDesktopMenu);
  closeDesktopMenu();
  const updateHeader = () => {
    const scrolled = window.scrollY > 24;
    header?.classList.toggle('is-scrolled', scrolled);
    if (!navInstitutions) return;
    if (!scrolled && navInstitutions.contains(document.activeElement)) {
      navBrand?.focus({ preventScroll: true });
    }
    navInstitutions.inert = !scrolled;
    navInstitutions.setAttribute('aria-hidden', String(!scrolled));
  };
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  const heroVideo = $('#hero-video');
  const backgroundToggle = $('#background-toggle');
  const heroSection = $('.cinema-hero');
  const taskVideo = $('#task-video');
  const collectionVideo = $('#collection-video');
  const renderVideos = [$('#render-pour'), $('#render-carry')].filter(Boolean);
  const foregroundVideos = [collectionVideo, taskVideo, ...renderVideos].filter(Boolean);
  let heroUserPaused = false;
  let allowReducedMotionPlayback = false;
  let activeDialog = null;
  let heroInView = true;
  if (heroSection) {
    const rect = heroSection.getBoundingClientRect();
    heroInView = rect.bottom > 0 && rect.top < window.innerHeight;
  }
  const updateBackgroundControl = () => {
    if (!heroVideo || !backgroundToggle) return;
    const paused = heroVideo.paused;
    backgroundToggle.setAttribute('aria-pressed', String(paused));
    backgroundToggle.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');
    const label = $('span', backgroundToggle);
    if (label) label.textContent = paused ? 'Play background' : 'Pause background';
    const icon = $('svg path', backgroundToggle);
    if (icon) icon.setAttribute('d', paused ? 'm9 5 11 7-11 7z' : 'M8 5v14M16 5v14');
  };
  const playSafely = (video, onFailure = () => {}) => {
    if (!video) return;
    const playRequest = video.play();
    if (playRequest?.catch) playRequest.catch(onFailure);
  };
  const syncHeroPlayback = () => {
    if (!heroVideo) return;
    const shouldPlay = !document.hidden && heroInView && !activeDialog && !heroUserPaused &&
      !foregroundVideos.some((video) => !video.paused) &&
      (!motionPreference.matches || allowReducedMotionPlayback);
    heroVideo.autoplay = shouldPlay;
    if (shouldPlay) playSafely(heroVideo, updateBackgroundControl);
    else heroVideo.pause();
    updateBackgroundControl();
  };
  if (heroVideo) {
    heroVideo.muted = true;
    heroVideo.defaultMuted = true;
    heroVideo.loop = true;
    heroVideo.playsInline = true;
    ['play', 'pause', 'error', 'emptied'].forEach((name) => {
      heroVideo.addEventListener(name, updateBackgroundControl);
    });
  }
  backgroundToggle?.addEventListener('click', () => {
    if (!heroVideo) return;
    if (heroVideo.paused) {
      heroUserPaused = false;
      allowReducedMotionPlayback = true;
    } else {
      heroUserPaused = true;
    }
    syncHeroPlayback();
  });
  if ('IntersectionObserver' in window && heroSection) {
    const heroObserver = new IntersectionObserver(([entry]) => {
      heroInView = entry.isIntersecting;
      syncHeroPlayback();
    }, { threshold: 0.01 });
    heroObserver.observe(heroSection);
  }
  // All foreground players start manually. Only a player that was already
  // playing can resume after a viewport or document-visibility pause.
  const mediaStates = new Map();
  const isInViewport = (video) => {
    const rect = video.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight &&
      rect.right > 0 && rect.left < window.innerWidth;
  };
  foregroundVideos.forEach((video) => {
    video.autoplay = false;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    mediaStates.set(video, {
      visible: isInViewport(video),
      resumeIntent: false,
      automaticPause: false,
      switching: false,
      rate: 1,
    });
  });
  const pauseManagedVideo = (video, preserveIntent = false) => {
    const state = mediaStates.get(video);
    if (!state) return;
    if (!preserveIntent) state.resumeIntent = false;
    if (!video.paused) {
      state.automaticPause = true;
      video.pause();
    }
  };
  const pauseOtherVideos = (except = null) => {
    foregroundVideos.forEach((video) => {
      const sameRenderGroup = renderVideos.includes(except) && renderVideos.includes(video);
      if (video !== except && !sameRenderGroup) pauseManagedVideo(video);
    });
  };
  const updateManagedPlayback = (video) => {
    const state = mediaStates.get(video);
    if (!state || state.switching) return;
    if (document.hidden || !state.visible || activeDialog) {
      pauseManagedVideo(video, true);
    } else if (state.resumeIntent && video.paused && !video.ended) {
      playSafely(video);
    }
  };
  const requestVideoPlay = (video) => {
    const state = mediaStates.get(video);
    if (!state) return;
    pauseOtherVideos(video);
    state.resumeIntent = true;
    if (!document.hidden && state.visible && !activeDialog && !state.switching) {
      playSafely(video);
    }
  };
  foregroundVideos.forEach((video) => {
    const state = mediaStates.get(video);
    video.addEventListener('play', () => {
      state.resumeIntent = true;
      state.automaticPause = false;
      pauseOtherVideos(video);
      updateManagedPlayback(video);
      syncHeroPlayback();
    });
    video.addEventListener('pause', () => {
      if (!state.switching && !state.automaticPause) state.resumeIntent = false;
      state.automaticPause = false;
      syncHeroPlayback();
    });
    video.addEventListener('ended', () => {
      state.resumeIntent = false;
      syncHeroPlayback();
    });
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(([entry]) => {
        state.visible = entry.isIntersecting;
        updateManagedPlayback(video);
      }, { threshold: 0 });
      observer.observe(video);
    }
  });
  document.addEventListener('visibilitychange', () => {
    foregroundVideos.forEach(updateManagedPlayback);
    if (document.hidden) $('#modal-video')?.pause();
    syncHeroPlayback();
  });
  const setVideoRate = (video, rate) => {
    const state = mediaStates.get(video);
    if (!state || !Number.isFinite(rate) || rate <= 0) return;
    state.rate = rate;
    video.defaultPlaybackRate = rate;
    video.playbackRate = rate;
  };
  const bindVideoSpeed = (video, select, initialRate) => {
    if (!video || !select) return;
    const state = mediaStates.get(video);
    const syncSelect = () => {
      const rate = String(state.rate);
      if (!Array.from(select.options).some((option) => option.value === rate)) {
        select.add(new Option(`${rate}×`, rate));
      }
      select.value = rate;
    };
    setVideoRate(video, initialRate);
    syncSelect();
    select.addEventListener('change', () => setVideoRate(video, Number(select.value)));
    video.addEventListener('ratechange', () => {
      // Loading a new source may temporarily report its default rate.
      if (!state.switching) state.rate = video.playbackRate;
      syncSelect();
    });
    video.addEventListener('loadedmetadata', () => {
      video.playbackRate = state.rate;
      syncSelect();
    });
  };
  const bindTabs = (buttons, select) => {
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => select(button));
      button.addEventListener('keydown', (event) => {
        let next = index;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % buttons.length;
        else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = buttons.length - 1;
        else return;
        event.preventDefault();
        buttons[next].focus();
        select(buttons[next]);
      });
    });
  };

  // One native player handles all four complete official task recordings.
  const tasks = {
    box: {
      title: 'Tissue-to-Box',
      description: 'Pick up a tissue pack and place it into the box.',
      clip: 'tissue-to-box',
      rate: 2,
    },
    bin: {
      title: 'Tissue-to-Bin',
      description: 'Turn and lower the body to place the tissue pack in a low bin.',
      clip: 'tissue-to-bin',
      rate: 2,
    },
    plush: {
      title: 'Pick-Turn-Place',
      description: 'Pick up both plush toys, turn, and place them into the tray.',
      clip: 'pick-turn-place',
      rate: 2,
    },
    cabinet: {
      title: 'Tissue-to-Cabinet',
      description: 'Pick, turn, walk to the cabinet, squat to place the tissue pack inside, and close both doors.',
      clip: 'tissue-to-cabinet',
      rate: 3,
    },
  };
  const tabs = $$('.task-tab[data-task]');
  const taskTitle = $('#task-title');
  const taskDescription = $('#task-description');
  const demoStatus = $('#demo-status');
  const taskSpeed = $('#task-speed');
  let currentTask = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true')?.dataset.task || 'box';
  bindVideoSpeed(taskVideo, taskSpeed, tasks[currentTask].rate);
  const selectTask = (key, play = true) => {
    const task = tasks[key];
    if (!task || !taskVideo) return;
    const changed = currentTask !== key;
    currentTask = key;
    tabs.forEach((tab) => {
      const selected = tab.dataset.task === key;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    if (taskTitle) taskTitle.textContent = task.title;
    if (taskDescription) taskDescription.textContent = task.description;
    taskVideo.setAttribute('aria-label', `Real-world ${task.title} demonstration`);
    taskVideo.setAttribute('aria-describedby', 'task-description');
    taskVideo.loop = true;
    if (changed) {
      pauseManagedVideo(taskVideo);
      taskVideo.poster = `./assets/videos/${task.clip}.jpg`;
      taskVideo.src = `./assets/videos/${task.clip}.mp4`;
      setVideoRate(taskVideo, task.rate);
      if (taskSpeed) taskSpeed.value = String(task.rate);
      taskVideo.load();
      if (demoStatus) demoStatus.textContent = `${task.title} selected, playback ${task.rate}×.`;
    }
    if (play) requestVideoPlay(taskVideo);
  };
  bindTabs(tabs, (tab) => selectTask(tab.dataset.task));
  selectTask(currentTask, false);

  // The comparison is one synchronized composite, with timestamps and totals
  // read directly from the published collection timeline.
  if (collectionVideo) {
    let timeline = {};
    try { timeline = JSON.parse($('#collection-timeline')?.textContent || '{}'); }
    catch { /* The complete recording remains playable without its readouts. */ }
    const state = mediaStates.get(collectionVideo);
    const playButton = $('#collection-play');
    const timeDisplay = $('#collection-time');
    const durationDisplay = $('#collection-duration');
    bindVideoSpeed(collectionVideo, $('#collection-speed'), 4);
    const clockLabel = (seconds) => {
      const whole = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
      return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
    };
    const updateReadouts = () => {
      if (state.switching) return;
      const time = collectionVideo.currentTime;
      if (timeDisplay) timeDisplay.textContent = clockLabel(time);
      if (durationDisplay && Number.isFinite(collectionVideo.duration)) {
        durationDisplay.textContent = clockLabel(collectionVideo.duration);
      }
      Object.entries(timeline).forEach(([side, data]) => {
        const count = $(`#collection-${side}-count`);
        const stage = $(`#collection-${side}-stage`);
        if (count) count.textContent = String((data.completions || []).filter((at) => time >= at).length);
        const phase = (data.phases || []).filter(([at]) => time >= at).pop();
        if (stage && phase) {
          stage.textContent = collectionVideo.ended ? 'Recording finished' : phase[1];
          stage.dataset.phase = collectionVideo.ended ? 'complete' : phase[2];
        }
      });
    };
    const updateCollectionButton = () => {
      if (!playButton) return;
      const playing = !collectionVideo.paused || (state.switching && state.resumeIntent);
      playButton.textContent = playing ? 'Pause comparison' : collectionVideo.ended ? 'Replay comparison' : 'Play comparison';
      playButton.setAttribute('aria-pressed', String(playing));
      playButton.setAttribute('aria-controls', 'collection-video');
    };
    ['loadedmetadata', 'durationchange', 'timeupdate', 'seeked', 'ended'].forEach((name) => {
      collectionVideo.addEventListener(name, updateReadouts);
    });
    ['play', 'pause', 'ended', 'emptied'].forEach((name) => {
      collectionVideo.addEventListener(name, updateCollectionButton);
    });
    playButton?.addEventListener('click', () => {
      if (!collectionVideo.paused || (state.switching && state.resumeIntent)) {
        pauseManagedVideo(collectionVideo);
      } else {
        if (collectionVideo.ended) collectionVideo.currentTime = 0;
        requestVideoPlay(collectionVideo);
      }
      updateCollectionButton();
    });
    $('#collection-replay')?.addEventListener('click', () => {
      if (pendingLayoutState) pendingLayoutState.time = 0;
      else collectionVideo.currentTime = 0;
      requestVideoPlay(collectionVideo);
      updateReadouts();
      updateCollectionButton();
    });

    const portraitLayout = window.matchMedia('(max-width: 600px)');
    let pendingLayoutState = null;
    let restoreLayout = null;
    const updateCollectionOrientation = () => {
      const portrait = portraitLayout.matches;
      const stem = `./assets/videos/collection/collection-comparison${portrait ? '-portrait' : ''}`;
      const revision = collectionVideo.dataset.mediaVersion;
      const versionQuery = revision ? `?v=${encodeURIComponent(revision)}` : '';
      const source = `${stem}.mp4${versionQuery}`;
      collectionVideo.poster = `${stem}.jpg${versionQuery}`;
      collectionVideo.setAttribute('aria-label', portrait
        ? 'Synchronized data collection: robot teleoperation above, egocentric human collection below'
        : 'Synchronized data collection: robot teleoperation on the left, egocentric human collection on the right');
      const activeSource = collectionVideo.getAttribute('src') ? collectionVideo.src : collectionVideo.currentSrc;
      if (activeSource === new URL(source, document.baseURI).href) return;
      if (collectionVideo.readyState === 0 && collectionVideo.currentTime === 0 &&
          !state.resumeIntent && !pendingLayoutState) {
        // Select the initial layout without fetching metadata or starting playback.
        collectionVideo.src = source;
        return;
      }
      if (!pendingLayoutState) pendingLayoutState = { time: collectionVideo.currentTime };
      if (restoreLayout) collectionVideo.removeEventListener('loadedmetadata', restoreLayout);
      state.switching = true;
      pauseManagedVideo(collectionVideo, true);
      collectionVideo.preload = 'metadata';
      restoreLayout = () => {
        const requestedTime = pendingLayoutState.time;
        collectionVideo.currentTime = Number.isFinite(collectionVideo.duration)
          ? Math.min(requestedTime, collectionVideo.duration) : requestedTime;
        collectionVideo.playbackRate = state.rate;
        collectionVideo.preload = 'none';
        pendingLayoutState = null;
        restoreLayout = null;
        state.switching = false;
        state.automaticPause = false;
        updateReadouts();
        updateManagedPlayback(collectionVideo);
        updateCollectionButton();
      };
      collectionVideo.addEventListener('loadedmetadata', restoreLayout, { once: true });
      collectionVideo.src = source;
      collectionVideo.load();
      updateCollectionButton();
    };
    portraitLayout.addEventListener('change', updateCollectionOrientation);
    updateCollectionOrientation();
    updateReadouts();
    updateCollectionButton();
  }

  // The two converted examples form one playback group. They keep their own
  // complete timelines and can play concurrently without seeking each other.
  const renderPlayAll = $('#render-play-all');
  const updateRenderGroupControl = () => {
    if (!renderPlayAll) return;
    const playing = renderVideos.some((video) => !video.paused);
    renderPlayAll.textContent = playing ? 'Pause examples' : 'Play both examples';
    renderPlayAll.setAttribute('aria-pressed', String(playing));
    renderPlayAll.setAttribute('aria-controls', renderVideos.map((video) => video.id).join(' '));
  };
  renderPlayAll?.addEventListener('click', () => {
    if (renderVideos.some((video) => !video.paused)) {
      renderVideos.forEach((video) => pauseManagedVideo(video));
    } else {
      renderVideos.forEach(requestVideoPlay);
    }
    updateRenderGroupControl();
  });
  renderVideos.forEach((video) => {
    video.loop = true;
    const startButton = $$('[data-render-play]').find((button) => button.dataset.renderPlay === video.id);
    const updateRenderStart = () => {
      if (startButton) {
        if (!video.paused && document.activeElement === startButton) {
          video.focus({ preventScroll: true });
        }
        startButton.hidden = !video.paused;
        startButton.setAttribute('aria-controls', video.id);
      }
      updateRenderGroupControl();
    };
    startButton?.addEventListener('click', () => requestVideoPlay(video));
    ['play', 'pause', 'ended', 'emptied'].forEach((name) => {
      video.addEventListener(name, updateRenderStart);
    });
    updateRenderStart();
  });
  updateRenderGroupControl();

  const videoDialog = $('#video-dialog');
  const modalVideo = $('#modal-video');
  const figureDialog = $('#figure-dialog');
  const modalFigure = $('#modal-figure');
  const dialogTriggers = new WeakMap();
  const closeDialog = (dialog) => {
    if (!dialog?.open) return;
    if (typeof dialog.close === 'function') dialog.close();
    else {
      dialog.removeAttribute('open');
      dialog.dispatchEvent(new Event('close'));
    }
  };
  const openDialog = (dialog, trigger) => {
    if (!dialog) return false;
    if (activeDialog && activeDialog !== dialog) closeDialog(activeDialog);
    dialogTriggers.set(dialog, trigger);
    activeDialog = dialog;
    setMenuOpen(false);
    pauseOtherVideos();
    syncHeroPlayback();
    document.body.classList.add('modal-open');
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else {
        dialog.setAttribute('open', '');
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
      }
    }
    $('button', dialog)?.focus();
    return true;
  };
  [videoDialog, figureDialog].filter(Boolean).forEach((dialog) => {
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeDialog(dialog);
    });
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
    });
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDialog(dialog);
      }
      // Let the native dialog retain navigation through the video's controls.
      // Only the open-attribute fallback needs a manual focus trap.
      if (typeof dialog.showModal === 'function') return;
      if (event.key !== 'Tab') return;
      const focusable = $$('button, a[href], input, select, textarea, video[controls], [tabindex="0"]', dialog)
        .filter((element) => !element.disabled && !element.hidden);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    dialog.addEventListener('close', () => {
      if (dialog === videoDialog && modalVideo) {
        modalVideo.pause();
        modalVideo.removeAttribute('src');
        modalVideo.removeAttribute('poster');
        modalVideo.load();
      }
      if (dialog === figureDialog) modalFigure?.removeAttribute('src');
      if (activeDialog === dialog) {
        activeDialog = null;
        document.body.classList.remove('modal-open');
        syncHeroPlayback();
        const trigger = dialogTriggers.get(dialog);
        if (trigger?.isConnected) trigger.focus({ preventScroll: true });
      }
    });
  });
  $('#close-video-dialog')?.addEventListener('click', () => closeDialog(videoDialog));
  $('#close-figure-dialog')?.addEventListener('click', () => closeDialog(figureDialog));
  $$('[data-film]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      if (!videoDialog || !modalVideo) return;
      event.preventDefault();
      const title = trigger.dataset.filmTitle || 'EgoLoAF film';
      $('#video-dialog-title').textContent = title;
      modalVideo.setAttribute('aria-label', title);
      modalVideo.poster = trigger.dataset.filmPoster || '';
      modalVideo.src = trigger.dataset.film;
      modalVideo.muted = false;
      modalVideo.defaultMuted = false;
      modalVideo.playbackRate = 1;
      if (openDialog(videoDialog, trigger)) playSafely(modalVideo);
    });
  });
  $$('[data-figure]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      if (!figureDialog || !modalFigure) return;
      const title = trigger.dataset.figureTitle || 'Research figure';
      $('#figure-dialog-title').textContent = title;
      modalFigure.alt = $('img', trigger)?.alt || title;
      modalFigure.src = trigger.dataset.figure;
      openDialog(figureDialog, trigger);
    });
  });

  const copyButton = $('#copy-citation');
  const copyStatus = $('#copy-status');
  let copyResetTimer;
  copyButton?.addEventListener('click', async () => {
    const citation = $('#bibtex')?.textContent;
    if (!citation) return;
    let copied = false;
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(citation);
        copied = true;
      }
    } catch { /* Local previews can still use the selection-based fallback. */ }
    if (!copied) {
      const field = document.createElement('textarea');
      field.value = citation;
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;left:-9999px;top:0;';
      document.body.appendChild(field);
      field.select();
      try { copied = document.execCommand('copy'); } catch { copied = false; }
      field.remove();
      copyButton.focus({ preventScroll: true });
    }
    window.clearTimeout(copyResetTimer);
    copyButton.textContent = copied ? 'Copied!' : 'Select BibTeX';
    if (copyStatus) copyStatus.textContent = copied ? 'BibTeX copied to clipboard.' : 'Copy was unavailable. The BibTeX is selected; use your copy shortcut.';
    if (!copied) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents($('#bibtex'));
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    copyResetTimer = window.setTimeout(() => { copyButton.textContent = 'Copy BibTeX'; }, 2500);
  });

  // Reveal only offscreen elements. Plain HTML and reduced-motion users always
  // receive visible content, and any observer failure restores visibility.
  const revealElements = $$('.reveal');
  let revealObserver;
  const revealAll = () => {
    revealObserver?.disconnect();
    revealElements.forEach((element) => element.classList.add('is-visible'));
  };
  if ('IntersectionObserver' in window && !motionPreference.matches) {
    try {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.05, rootMargin: '0px 0px 40px 0px' });
      revealElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          element.classList.add('is-visible');
        } else {
          element.classList.add('js-reveal');
          revealObserver.observe(element);
        }
      });
    } catch { revealAll(); }
  }
  motionPreference.addEventListener('change', () => {
    allowReducedMotionPlayback = false;
    if (motionPreference.matches) revealAll();
    syncHeroPlayback();
  });
  window.addEventListener('pagehide', () => {
    heroVideo?.pause();
    foregroundVideos.forEach((video) => pauseManagedVideo(video, true));
    modalVideo?.pause();
  });
  window.addEventListener('pageshow', () => {
    foregroundVideos.forEach(updateManagedPlayback);
    syncHeroPlayback();
  });
  syncHeroPlayback();
})();
