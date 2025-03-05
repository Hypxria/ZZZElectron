import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import webpack from 'webpack';

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  
  externals: {
    electron: 'commonjs electron',
    path: 'commonjs path',
    fs: 'commonjs fs',
    crypto: 'commonjs crypto',
    'electron-store': 'commonjs electron-store',
    'node-machine-id': 'commonjs node-machine-id'
  },
  entry: './src/main.ts',
  // Put your normal webpack config below here
  module: {
    rules,
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': JSON.stringify({
        SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
        SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET
      })
    })
  ]
};

export default mainConfig;