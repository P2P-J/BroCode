(() => {
  const BRO = (globalThis.BRO ??= {});

  BRO.players = {
    nativeCss: [
      'video::-webkit-media-controls-panel { background: transparent !important; background-image: none !important; box-shadow: none !important; }',
      'video::-webkit-media-controls-enclosure { background: transparent !important; background-image: none !important; }'
    ],
    presets: [
      {
        id: 'youtube',
        name: 'YouTube',
        roots: ['.html5-video-player'],
        hide: ['.ytp-gradient-top', '.ytp-gradient-bottom', '.ytp-chrome-top', '.ytp-chrome-bottom', '.ytp-tooltip', '.ytp-preview', '.ytp-storyboard-framepreview'],
        noBackground: [],
        blockHover: false,
        stripControls: false
      },
      {
        id: 'videojs',
        name: 'Video.js',
        roots: ['.video-js'],
        hide: ['.vjs-control-bar', '.vjs-mouse-display', '.vjs-time-tooltip', '.vjs-title-bar'],
        noBackground: [],
        blockHover: false,
        stripControls: false
      },
      {
        id: 'jwplayer',
        name: 'JW Player',
        roots: ['.jwplayer'],
        hide: ['.jw-controlbar', '.jw-controls-backdrop', '.jw-tooltip', '.jw-time-tip'],
        noBackground: [],
        blockHover: false,
        stripControls: false
      },
      {
        id: 'plyr',
        name: 'Plyr',
        roots: ['.plyr'],
        hide: ['.plyr__controls', '.plyr__tooltip', '.plyr__preview-thumb'],
        noBackground: [],
        blockHover: false,
        stripControls: false
      },
      {
        id: 'shaka',
        name: 'Shaka Player',
        roots: ['.shaka-video-container'],
        hide: ['.shaka-bottom-controls', '.shaka-scrim-container'],
        noBackground: [],
        blockHover: false,
        stripControls: false
      },
      {
        id: 'mediaelement',
        name: 'MediaElement.js',
        roots: ['.mejs__container', '.mejs-container'],
        hide: ['.mejs__controls', '.mejs__time-float', '.mejs-controls', '.mejs-time-float'],
        noBackground: [],
        blockHover: false,
        stripControls: false
      },
      {
        id: 'flowplayer',
        name: 'Flowplayer',
        roots: ['.flowplayer'],
        hide: ['.fp-controls'],
        noBackground: [],
        blockHover: false,
        stripControls: false
      }
    ]
  };
})();
