import { VideoFeed } from './VideoFeed.js';

function injectNavArrows() {
  const navArrows = document.createElement('div');
  navArrows.id = 'nav-arrows';
  navArrows.innerHTML = `
    <button id="btn-up" aria-label="Previous video"><i class="bi bi-chevron-up"></i></button>
    <button id="btn-down" aria-label="Next video"><i class="bi bi-chevron-down"></i></button>
  `;
  document.getElementById('app').appendChild(navArrows);
}

async function init() {
  const res = await fetch('/api/videos');
  const videos = await res.json();

  if (!videos.length) {
    document.getElementById('feed').innerHTML =
        '<p style="color:#fff;text-align:center;margin-top:40vh">No videos found in /videos folder</p>';
    return;
  }

  injectNavArrows();
  new VideoFeed(document.getElementById('feed'), videos);
}

init();
