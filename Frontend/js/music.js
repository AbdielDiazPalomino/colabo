/* =============================================
   COLABO — music.js
   Floating Lofi & Custom URL Music Player Widget
   ============================================= */

(function () {
  // Styles for the music widget (Self-encapsulated CSS injected on load)
  const styles = `
    .music-widget-wrap {
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 999;
      font-family: 'DM Sans', sans-serif;
    }
    .music-btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(30, 30, 36, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      color: #9898a8;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 1.2rem;
    }
    .music-btn:hover {
      transform: scale(1.08);
      border-color: rgba(255, 255, 255, 0.2);
      color: #f0f0f4;
    }
    .music-btn.playing {
      animation: musicSpin 6s linear infinite;
      border-color: var(--board-accent, #7c6fff);
      color: var(--board-accent, #7c6fff);
      box-shadow: 0 0 15px rgba(124, 111, 255, 0.3);
    }
    @keyframes musicSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .music-panel {
      position: absolute;
      bottom: 60px;
      left: 0;
      width: 290px;
      background: rgba(24, 24, 28, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.07);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      opacity: 0;
      transform: translateY(10px) scale(0.95);
      pointer-events: none;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      transform-origin: bottom left;
    }
    .music-panel.show {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }
    .mp-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .mp-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: #f0f0f4;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .mp-close {
      background: none;
      border: none;
      color: #9898a8;
      cursor: pointer;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: 6px;
      transition: background 0.2s;
    }
    .mp-close:hover {
      background: rgba(255,255,255,0.06);
      color: #f0f0f4;
    }
    .mp-body {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .audio-player-controls {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255,255,255,0.03);
      padding: 8px 12px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.03);
    }
    .play-pause-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--board-accent, #7c6fff);
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      transition: transform 0.2s, background 0.2s;
    }
    .play-pause-btn:hover {
      transform: scale(1.06);
      background: var(--accent-2, #a594ff);
    }
    .track-info {
      flex: 1;
      min-width: 0;
    }
    .track-name {
      font-size: 0.75rem;
      color: #f0f0f4;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .track-author {
      font-size: 0.65rem;
      color: #9898a8;
    }
    .vol-control {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 70px;
    }
    .vol-icon {
      font-size: 0.7rem;
      color: #9898a8;
      cursor: pointer;
    }
    .vol-slider {
      flex: 1;
      -webkit-appearance: none;
      height: 3px;
      border-radius: 2px;
      background: rgba(255,255,255,0.1);
      outline: none;
      cursor: pointer;
    }
    .vol-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #f0f0f4;
      cursor: pointer;
    }
    .channels-list {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 6px;
    }
    .channel-btn {
      padding: 8px 4px;
      border-radius: 8px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.04);
      color: #9898a8;
      font-size: 0.7rem;
      font-family: inherit;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
    }
    .channel-btn:hover {
      background: rgba(255,255,255,0.06);
      color: #f0f0f4;
    }
    .channel-btn.active {
      background: rgba(124, 111, 255, 0.15);
      border-color: var(--board-accent, #7c6fff);
      color: #f0f0f4;
      font-weight: 500;
    }
    .custom-url-box {
      display: flex;
      flex-direction: column;
      gap: 6px;
      border-top: 1px solid rgba(255,255,255,0.06);
      padding-top: 10px;
    }
    .custom-url-label {
      font-size: 0.65rem;
      font-weight: 600;
      color: #5a5a6e;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .custom-url-input-wrap {
      display: flex;
      gap: 6px;
    }
    .custom-url-input {
      flex: 1;
      padding: 6px 10px;
      border-radius: 8px;
      background: rgba(0,0,0,0.2);
      border: 1px solid rgba(255,255,255,0.05);
      color: #f0f0f4;
      font-size: 0.72rem;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
    }
    .custom-url-input:focus {
      border-color: var(--board-accent, #7c6fff);
    }
    .custom-url-btn {
      padding: 6px 12px;
      border-radius: 8px;
      background: rgba(124, 111, 255, 0.12);
      border: 1px solid rgba(124, 111, 255, 0.2);
      color: #a594ff;
      font-size: 0.72rem;
      font-family: inherit;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .custom-url-btn:hover {
      background: var(--board-accent, #7c6fff);
      color: white;
      border-color: transparent;
    }
    .embed-player-container {
      width: 100%;
      height: 80px;
      border-radius: 10px;
      overflow: hidden;
      background: #000;
      border: 1px solid rgba(255,255,255,0.08);
      display: none;
    }
    .embed-player-container.active {
      display: block;
    }
  `;

  // Inject Styles into Document Head
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  // Pre-configured tracks
  const PRESET_TRACKS = [
    {
      id: 'lofi',
      name: 'Lofi Relax Beats',
      author: 'Focus Chill',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    },
    {
      id: 'rain',
      name: 'Lluvia Relajante',
      author: 'Sonidos de la Naturaleza',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
    },
    {
      id: 'cafe',
      name: 'Cafetería Acústica',
      author: 'Ambiente de Ciudad',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
    }
  ];

  // Variables state
  let isPanelOpen = false;
  let isPlaying = false;
  let currentTrack = PRESET_TRACKS[0];
  let isEmbedMode = false;

  // HTML5 Audio element
  const audio = new Audio();
  audio.loop = true;
  audio.volume = 0.5;

  // Build and Inject Widget HTML elements
  const widgetContainer = document.createElement('div');
  widgetContainer.className = 'music-widget-wrap';
  widgetContainer.innerHTML = `
    <button class="music-btn" id="musicWidgetBtn" title="Música y Enfoque">🎵</button>
    <div class="music-panel" id="musicWidgetPanel">
      <div class="mp-header">
        <div class="mp-title">🎧 <span>Música de Enfoque</span></div>
        <button class="mp-close" id="musicPanelCloseBtn">✕</button>
      </div>
      <div class="mp-body">
        
        <!-- Native Audio Controls -->
        <div class="audio-player-controls" id="nativePlayerControls">
          <button class="play-pause-btn" id="musicPlayBtn">▶</button>
          <div class="track-info">
            <div class="track-name" id="musicTrackName">Lofi Relax Beats</div>
            <div class="track-author" id="musicTrackAuthor">Focus Chill</div>
          </div>
          <div class="vol-control">
            <span class="vol-icon" id="musicVolIcon" title="Silenciar">🔊</span>
            <input type="range" class="vol-slider" id="musicVolSlider" min="0" max="100" value="50" />
          </div>
        </div>

        <!-- Embed Iframe Container for Spotify / YouTube -->
        <div class="embed-player-container" id="embedPlayerContainer"></div>

        <!-- Presets Channels -->
        <div class="channels-list" id="presetChannelsList">
          <button class="channel-btn active" data-id="lofi">☕ Lofi</button>
          <button class="channel-btn" data-id="rain">🌧️ Lluvia</button>
          <button class="channel-btn" data-id="cafe">🏬 Café</button>
        </div>

        <!-- Custom URL Input -->
        <div class="custom-url-box">
          <div class="custom-url-label">Cargar enlace personalizado</div>
          <div class="custom-url-input-wrap">
            <input type="text" class="custom-url-input" id="customMusicUrl" placeholder="YouTube, Spotify o MP3 URL..." />
            <button class="custom-url-btn" id="loadCustomUrlBtn">Cargar</button>
          </div>
        </div>
        
      </div>
    </div>
  `;

  document.body.appendChild(widgetContainer);

  // DOM Elements
  const widgetBtn = document.getElementById('musicWidgetBtn');
  const panel = document.getElementById('musicWidgetPanel');
  const closeBtn = document.getElementById('musicPanelCloseBtn');
  const playBtn = document.getElementById('musicPlayBtn');
  const trackName = document.getElementById('musicTrackName');
  const trackAuthor = document.getElementById('musicTrackAuthor');
  const volSlider = document.getElementById('musicVolSlider');
  const volIcon = document.getElementById('musicVolIcon');
  const presetBtns = document.querySelectorAll('.channel-btn');
  const customUrlInput = document.getElementById('customMusicUrl');
  const loadCustomUrlBtn = document.getElementById('loadCustomUrlBtn');
  const nativeControls = document.getElementById('nativePlayerControls');
  const embedContainer = document.getElementById('embedPlayerContainer');

  // Load preset track initially
  function loadPreset(trackId) {
    const track = PRESET_TRACKS.find(t => t.id === trackId);
    if (!track) return;

    // Reset embed mode
    isEmbedMode = false;
    embedContainer.classList.remove('active');
    embedContainer.innerHTML = '';
    nativeControls.style.display = 'flex';

    currentTrack = track;
    audio.src = track.url;
    trackName.textContent = track.name;
    trackAuthor.textContent = track.author;

    // Update active button UI
    presetBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.id === trackId);
    });

    if (isPlaying) {
      audio.play().catch(err => {
        console.log("Auto-play blocked or error: ", err);
        setPlayState(false);
      });
    }
  }

  // Set Play / Pause State
  function setPlayState(play) {
    isPlaying = play;
    if (play) {
      playBtn.textContent = '⏸';
      widgetBtn.classList.add('playing');
      widgetBtn.textContent = '💿';
    } else {
      playBtn.textContent = '▶';
      widgetBtn.classList.remove('playing');
      widgetBtn.textContent = '🎵';
    }
  }

  // Toggle Play / Pause
  function togglePlay() {
    if (isEmbedMode) return; // Managed by iframe UI

    if (isPlaying) {
      audio.pause();
      setPlayState(false);
    } else {
      // Ensure audio has a source
      if (!audio.src) {
        audio.src = currentTrack.url;
      }
      audio.play().then(() => {
        setPlayState(true);
      }).catch(err => {
        console.error("Audio playback error: ", err);
        alert("No se pudo iniciar el audio. Intente nuevamente.");
      });
    }
  }

  // Volume Slider handler
  volSlider.addEventListener('input', () => {
    const val = volSlider.value / 100;
    audio.volume = val;
    if (val === 0) {
      volIcon.textContent = '🔇';
    } else if (val < 0.5) {
      volIcon.textContent = '🔈';
    } else {
      volIcon.textContent = '🔊';
    }
  });

  // Mute toggle
  let prevVol = 50;
  volIcon.addEventListener('click', () => {
    if (audio.volume > 0) {
      prevVol = volSlider.value;
      volSlider.value = 0;
      audio.volume = 0;
      volIcon.textContent = '🔇';
    } else {
      volSlider.value = prevVol;
      audio.volume = prevVol / 100;
      volIcon.textContent = prevVol < 50 ? '🔈' : '🔊';
    }
  });

  // Load Preset Buttons click
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      loadPreset(btn.dataset.id);
    });
  });

  // Toggle Panel Open/Close
  function togglePanel() {
    isPanelOpen = !isPanelOpen;
    panel.classList.toggle('show', isPanelOpen);
  }

  widgetBtn.addEventListener('click', togglePanel);
  closeBtn.addEventListener('click', () => {
    isPanelOpen = false;
    panel.classList.remove('show');
  });

  // Native player play button
  playBtn.addEventListener('click', togglePlay);

  // Load custom URL
  loadCustomUrlBtn.addEventListener('click', () => {
    const url = customUrlInput.value.trim();
    if (!url) return;

    // Pause native playing audio
    audio.pause();
    setPlayState(false);

    // 1. YouTube Link check
    let ytId = '';
    if (url.includes('youtube.com/watch')) {
      try {
        ytId = new URL(url).searchParams.get('v');
      } catch(e) {}
    } else if (url.includes('youtu.be/')) {
      ytId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      ytId = url.split('youtube.com/embed/')[1]?.split('?')[0];
    }

    if (ytId) {
      // Load YouTube Iframe
      isEmbedMode = true;
      nativeControls.style.display = 'none';
      presetBtns.forEach(btn => btn.classList.remove('active'));
      
      embedContainer.innerHTML = `
        <iframe width="100%" height="80" 
          src="https://www.youtube.com/embed/${ytId}?autoplay=1&enablejsapi=1" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen>
        </iframe>
      `;
      embedContainer.classList.add('active');
      widgetBtn.classList.add('playing');
      widgetBtn.textContent = '💿';
      showToast('YouTube cargado con éxito 📺');
      return;
    }

    // 2. Spotify Link check
    if (url.includes('open.spotify.com/')) {
      let spType = '';
      let spId = '';
      
      const match = url.match(/open\.spotify\.com\/(track|playlist|album|artist)\/([a-zA-Z0-9]+)/);
      if (match) {
        spType = match[1];
        spId = match[2];
      }

      if (spId) {
        isEmbedMode = true;
        nativeControls.style.display = 'none';
        presetBtns.forEach(btn => btn.classList.remove('active'));

        embedContainer.innerHTML = `
          <iframe src="https://open.spotify.com/embed/${spType}/${spId}" 
            width="100%" height="80" 
            frameborder="0" 
            allowtransparency="true" 
            allow="encrypted-media">
          </iframe>
        `;
        embedContainer.classList.add('active');
        widgetBtn.classList.add('playing');
        widgetBtn.textContent = '💿';
        showToast('Spotify cargado con éxito 🎵');
        return;
      }
    }

    // 3. Direct Audio URL (fallback / generic MP3)
    isEmbedMode = false;
    embedContainer.classList.remove('active');
    embedContainer.innerHTML = '';
    nativeControls.style.display = 'flex';
    presetBtns.forEach(btn => btn.classList.remove('active'));

    trackName.textContent = 'Enlace personalizado';
    trackAuthor.textContent = 'Audio Externo';
    
    audio.src = url;
    audio.play().then(() => {
      setPlayState(true);
      showToast('Audio MP3 cargado con éxito 🎶');
    }).catch(err => {
      console.error("Audio error", err);
      alert("No se pudo reproducir este enlace de audio. Asegúrese de que sea un enlace directo a un archivo de audio (por ejemplo, con terminación .mp3).");
    });
  });

  // Helper toast notifier (reuse or create custom fallback)
  function showToast(msg) {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
    } else {
      console.log("Toast: ", msg);
    }
  }

  // Load first preset initially on script load
  loadPreset('lofi');

})();
