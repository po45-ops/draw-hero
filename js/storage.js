(function () {
  "use strict";

  const KEY = "drawHeroSaveV1";
  const defaults = {
    playerName: "ผู้กล้าน้อย",
    level: 1,
    xp: 0,
    coins: 120,
    gems: 3,
    selectedCharacter: "es",
    unlockedCharacters: ["es", "kai", "leen", "mimi"],
    stageStars: {},
    worldProgress: 1,
    highScore: 0,
    totalCorrect: 0,
    bestCombo: 0,
    completedStages: 0,
    characterMastery: {},
    learningStats: {},
    tutorialSeen: false,
    customPacks: [],
    templates: {},
    settings: {
      sound: true,
      music: false,
      effectsVolume: 70,
      musicVolume: 40,
      language: "th",
      reducedMotion: false,
      showGuide: true
    }
  };

  let memory = clone(defaults);
  let available = true;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function merge(base, incoming) {
    const result = Object.assign({}, base, incoming || {});
    result.settings = Object.assign({}, base.settings, incoming && incoming.settings);
    result.stageStars = Object.assign({}, base.stageStars, incoming && incoming.stageStars);
    result.characterMastery = Object.assign({}, base.characterMastery, incoming && incoming.characterMastery);
    result.learningStats = Object.assign({}, base.learningStats, incoming && incoming.learningStats);
    result.customPacks = Array.isArray(result.customPacks) ? result.customPacks : [];
    result.unlockedCharacters = Array.isArray(result.unlockedCharacters) ? result.unlockedCharacters : base.unlockedCharacters.slice();
    result.templates = result.templates && typeof result.templates === "object" ? result.templates : {};
    return result;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      memory = raw ? merge(defaults, JSON.parse(raw)) : clone(defaults);
    } catch (error) {
      available = false;
      memory = clone(defaults);
    }
    return memory;
  }

  function save(data) {
    memory = merge(defaults, data || memory);
    if (available) {
      try {
        localStorage.setItem(KEY, JSON.stringify(memory));
      } catch (error) {
        available = false;
      }
    }
    return memory;
  }

  function patch(partial) {
    return save(Object.assign({}, memory, partial));
  }

  function reset() {
    memory = clone(defaults);
    if (available) {
      try { localStorage.removeItem(KEY); } catch (error) { available = false; }
    }
    return memory;
  }

  window.DrawHero = window.DrawHero || {};
  window.DrawHero.Storage = { load, save, patch, reset, defaults: clone(defaults), isAvailable: () => available };
})();
