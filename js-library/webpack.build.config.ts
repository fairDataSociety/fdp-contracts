import baseConfig from './webpack.config'

const tsLoader = baseConfig.module.rules.find(rule => rule.use?.loader === 'ts-loader')

if (!tsLoader) {
  throw new Error('No ts-loader found')
}

;(tsLoader.use as any).options = {
  configFile: 'tsconfig.build.json',
}

export default baseConfig
