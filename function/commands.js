const { join } = require('path');
const { readdirSync, statSync } = require('fs');

function loadCommands(directory, stats = { loaded: 0, failed: 0 }) {
  readdirSync(directory).forEach((file) => {
    const fullPath = join(directory, file);
    const isDirectory = statSync(fullPath).isDirectory();

    if (isDirectory) {
      loadCommands(fullPath, stats);
      return;
    }

    if (!file.endsWith('.js')) return;

    try {
      require(fullPath);
      stats.loaded += 1;
    } catch (error) {
      stats.failed += 1;
      console.error(`[Commands Loader] Failed to load: ${fullPath}`);
      console.error(error?.stack || error);
    }
  });

  return stats;
}

function initializeCommands() {
  const commandsPath = join(__dirname, './../commands');
  const stats = loadCommands(commandsPath);
  console.log(`[Commands Loader] Loaded: ${stats.loaded}, Failed: ${stats.failed}`);
}

module.exports = initializeCommands;
