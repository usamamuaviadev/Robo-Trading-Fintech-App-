const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const { withNativeWind } = require("nativewind/metro");

const defaultConfig = getDefaultConfig(__dirname);

// Enable SVG imports as React components
defaultConfig.transformer = {
    ...defaultConfig.transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
};


module.exports = withNativeWind(mergeConfig(defaultConfig, {
    /* your config */
}), { input: "./global.css" });