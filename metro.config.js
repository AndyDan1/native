const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'riv' to the list of assets
config.resolver.assetExts.push('riv');

module.exports = config;
