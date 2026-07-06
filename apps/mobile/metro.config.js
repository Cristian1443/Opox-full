// Config de Metro para monorepo — permite resolver deps hoisted en la raíz.
// https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Vigilar todos los archivos del monorepo
config.watchFolders = [workspaceRoot];

// 2. Buscar dependencias tanto en el proyecto como en la raíz del monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Deshabilitar hierarchical lookup para evitar resolver módulos duplicados
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
