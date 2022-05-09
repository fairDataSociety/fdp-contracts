import baseConfigFn, { ENV } from './webpack.config'

const config = (env: ENV) => {
  const baseConfig = baseConfigFn(env)

  const tsLoader = baseConfig.module.rules.find(rule => rule.use?.loader === 'ts-loader')

  if (!tsLoader) {
    throw new Error('No ts-loader found')
  }

  ;(tsLoader.use as any).options = {
    configFile: 'tsconfig.build.json',
  }

  return baseConfig
}

export default config
