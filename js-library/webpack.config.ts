import * as path from 'path'
import Dotenv from 'dotenv-webpack'
import TerserPlugin from 'terser-webpack-plugin'

const rootDir = path.resolve(__dirname)
const srcDir = path.resolve(rootDir, 'src')
const buildDir = path.resolve(rootDir, 'build')

const isProduction = process.env.mode === 'production'

const config = {
  mode: process.env.mode || 'production',
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    // modules: [path.resolve('./node_modules'), path.resolve('./src')],
  },
  entry: {
    index: path.resolve(srcDir, 'index.ts'),
  },
  output: {
    filename: '[name].js',
    path: buildDir,
    library: 'fdp-contracts-js',
    libraryExport: 'default',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    globalObject: `(typeof self !== 'undefined' ? self : this)`,
  },
  optimization: {
    minimize: false,
    minimizer: [new TerserPlugin({ extractComments: false })],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx|json)$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
        },
      },
    ],
  },
  plugins: [new Dotenv({ path: path.resolve(srcDir, 'contracts', 'contracts.env') })],
}

export default config
