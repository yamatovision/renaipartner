const tsConfigPaths = require('tsconfig-paths');
const tsConfig = require('./tsconfig.json');

tsConfigPaths.register({
  baseUrl: './dist',
  paths: {
    '@/*': ['*'],
    '@/types': ['types'],
    '@/config': ['config'],
    '@/common': ['common'],
    '@/features': ['features']
  }
});