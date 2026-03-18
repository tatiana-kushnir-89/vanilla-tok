export class VideoItem {
  constructor(data, index) {
    this.data = data;
    this.index = index;
    this._muted = true;
    this._pausedByUser = false;
    this._rafId = null;
    this._isUnloaded = false;

    this.element = this._createElement();
    this._bindEvents();
  }

  // DOM
  _createElement() {
    const item = document.createElement('div');
    item.className = 'video-item';
    item.dataset.index = this.index;

    this._video = document.createElement('video');
    this._video.src = this.data.src;
    this._video.loop = true;
    this._video.muted = true;
    this._video.playsInline = true;
    this._video.preload = 'none';

    this._tapArea = document.createElement('div');
    this._tapArea.className = 'video-tap-area';

    this._playIcon = document.createElement('i');
    this._playIcon.className = 'bi bi-play-fill play-icon';

    this._muteBtn = document.createElement('button');
    this._muteBtn.className = 'mute-btn';
    this._muteBtn.setAttribute('aria-label', 'Toggle mute');
    this._muteBtn.innerHTML = '<i class="bi bi-volume-mute-fill"></i>';

    const info = document.createElement('div');
    info.className = 'video-info';
    info.innerHTML = `
      <span class="author">${this.data.author}</span>
      <span class="title">${this.data.title}</span>
    `;

    const progressWrapper = document.createElement('div');
    progressWrapper.className = 'progress-bar-wrapper';
    this._progressFill = document.createElement('div');
    this._progressFill.className = 'progress-bar-fill';
    progressWrapper.appendChild(this._progressFill);

    item.append(
        this._video,
        this._tapArea,
        this._playIcon,
        this._muteBtn,
        info,
        progressWrapper
    );

    return item;
  }

  _bindEvents() {
    this._tapArea.addEventListener('click', () => this.togglePlay());
    this._muteBtn.addEventListener('click', (e) => { e.stopPropagation(); this.toggleMute(); });
  }

  //Playback
  play() {
    if (this._pausedByUser) return;
    this.reload();
    this._video.play().catch(() => {});
    this._startProgressLoop();
  }

  pause() {
    this._video.pause();
    this._stopProgressLoop();
  }

  togglePlay() {
    if (this._video.paused) {
      this._pausedByUser = false;
      this._video.play();
      this._hidePlayIcon();
      this._startProgressLoop();
    } else {
      this._pausedByUser = true;
      this._video.pause();
      this._showPlayIcon();
      this._stopProgressLoop();
    }
  }

  toggleMute() {
    this._muted = !this._muted;
    this._video.muted = this._muted;
    this._muteBtn.innerHTML = this._muted
        ? '<i class="bi bi-volume-mute-fill"></i>'
        : '<i class="bi bi-volume-up-fill"></i>';
  }

  setMuted(muted) {
    this._muted = muted;
    this._video.muted = muted;
    this._muteBtn.innerHTML = muted
        ? '<i class="bi bi-volume-mute-fill"></i>'
        : '<i class="bi bi-volume-up-fill"></i>';
  }

  unload() {
    if (this._isUnloaded) return;
    this.pause();
    this._video.removeAttribute('src');
    this._video.load();
    this._isUnloaded = true;
  }

  reload() {
    if (!this._isUnloaded) return;
    this._video.src = this.data.src;
    this._video.preload = 'none';
    this._isUnloaded = false;
  }

  //Progress bar via rAF
  _startProgressLoop() {
    this._stopProgressLoop();
    const tick = () => {
      if (this._video.duration) {
        const pct = (this._video.currentTime / this._video.duration) * 100;
        this._progressFill.style.width = `${pct}%`;
      }
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  _stopProgressLoop() {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  // UI хедперы
  _showPlayIcon() { this._playIcon.classList.add('visible'); }
  _hidePlayIcon() { this._playIcon.classList.remove('visible'); }
}
