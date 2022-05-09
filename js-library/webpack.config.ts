import * as path from 'path'
import Dotenv from 'dotenv-webpack'
import TerserPlugin from 'terser-webpack-plugin'

const rootDir = path.resolve(__dirname)
const srcDir = path.resolve(rootDir, 'src')
const buildDir = path.resolve(rootDir, 'build')

export interface ENV {
  mode: 'production' | 'development'
}

const config = (env: ENV) => {
  const isProduction = env.mode === 'production'

  return {
    mode: env.mode || 'production',
    devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
    entry: {
      index: path.resolve(srcDir, 'index.ts'),
    },
    output: {
      filename: '[name].js',
      path: buildDir,
      sourceMapFilename: '[name][ext].map',
      libraryTarget: 'umd',
      library: 'fdp-contracts',
      globalObject: 'this',
      clean: true,
    },
    externals: {
      ethers: 'ethers',
    },
    optimization: {
      minimize: isProduction,
      minimizer: [new TerserPlugin({ extractComments: false })],
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
          },
        },
        {
          test: /\.json5$/i,
          loader: 'json5-loader',
          options: {
            esModule: true,
          },
          type: 'javascript/auto',
        },
      ],
    },
    plugins: [new Dotenv({ path: path.resolve(srcDir, 'contracts', 'contracts-ganache.env') })],
  }
}

export default config
