import { VideoItem } from './VideoItem.js';

const KEEP_LOADED = 3; //количество предзагруженных слайдов

export class VideoFeed {
  constructor(container, videosData) {
    this._container = container;
    this._items = videosData.map((data, i) => new VideoItem(data, i));
    this._currentIndex = 0;
    this._globalMuted = true;

    this._init();
  }

  _init() {
    this._items.forEach((item) => this._container.appendChild(item.element));
    this._setupObserver();
    this._setupKeyboard();
    this._setupNavArrows();
  }

  // IntersectionObserver
  _setupObserver() {
    this._observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const index = parseInt(entry.target.dataset.index, 10);
            const item = this._items[index];

            if (entry.isIntersecting) {
              this._currentIndex = index;
              item.reload();
              item.play();
              this._schedulePreload(index);
              this._virtualizeAround(index);
            } else {
              item.pause();
            }
          });
        },
        { root: this._container, threshold: 0.75 }
    );

    this._items.forEach((item) => this._observer.observe(item.element));
  }

  //requestIdleCallback — подгрузка соседних слайдов
  _schedulePreload(currentIndex) {
    const preload = () => {
      [-1, 1].forEach((offset) => {
        const neighbour = this._items[currentIndex + offset];
        if (neighbour) neighbour.reload();
      });
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(preload, { timeout: 1000 });
    } else {
      setTimeout(preload, 200);
    }
  }

  // DOM virtualization
  _virtualizeAround(currentIndex) {
    this._items.forEach((item, i) => {
      if (Math.abs(i - currentIndex) > KEEP_LOADED) {
        item.unload();
      }
    });
  }

  //Keyboard nav
  _setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'j') this.scrollNext();
      if (e.key === 'ArrowUp'   || e.key === 'k') this.scrollPrev();
      if (e.key === 'm') this._toggleGlobalMute();
    });
  }

  // nav arrows
  _setupNavArrows() {
    const wrapper = document.getElementById('nav-arrows');
    if (!wrapper) return;
    wrapper.querySelector('#btn-up').addEventListener('click', () => this.scrollPrev());
    wrapper.querySelector('#btn-down').addEventListener('click', () => this.scrollNext());
  }

  // Scroll хелперы
  scrollNext() {
    const next = this._currentIndex + 1;
    if (next < this._items.length) this._scrollTo(next);
  }

  scrollPrev() {
    const prev = this._currentIndex - 1;
    if (prev >= 0) this._scrollTo(prev);
  }

  _scrollTo(index) {
    this._items[index].element.scrollIntoView({ behavior: 'smooth' });
  }

  // Global mute
  _toggleGlobalMute() {
    this._globalMuted = !this._globalMuted;
    this._items.forEach((item) => item.setMuted(this._globalMuted));
  }
}
