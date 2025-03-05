import type { Configuration } from 'webpack';
import { rules } from './webpack.rules';
import webpack from 'webpack';

export const rendererConfig: Configuration = {
  externals: {
    electron: 'commonjs electron',
    path: 'commonjs path',
    fs: 'commonjs fs',
    crypto: 'commonjs crypto',
    // Add any other Node.js built-in modules you're using
  },
  module: {
    rules: [
      ...rules,
      {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
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

export default rendererConfig;