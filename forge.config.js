module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  packagerConfig: {},
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: {
          entry: './src/main.ts',
          module: {
            rules: [
              {
                test: /\.tsx?$/,
                exclude: /(node_modules|\.webpack)/,
                use: {
                  loader: 'ts-loader',
                  options: {
                    transpileOnly: true,
                  },
                },
              },
            ],
          },
          resolve: {
            extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
          },
        },
        renderer: {
          config: {
            target: 'web',
            resolve: {
              extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
            },
            module: {
              rules: [
                {
                  test: /\.tsx?$/,
                  exclude: /(node_modules|\.webpack)/,
                  use: {
                    loader: 'ts-loader',
                    options: {
                      transpileOnly: true,
                    },
                  },
                },
                {
                  test: /\.css$/,
                  use: ['style-loader', 'css-loader'],
                },
                {
                  test: /\.(jpg|png|svg|gif)$/,
                  use: {
                    loader: 'file-loader',
                    options: {
                      name: '[name].[ext]',
                    },
                  },
                },
              ],
            },
            resolve: {
              extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
            },
          },
          entryPoints: [
            {
              html: './src/index.html',
              js: './src/renderer/index.tsx',
              name: 'main_window',
              preload: {
                js: './src/preload.ts'
              },
            },
          ],
        },
      },
    },
  ],
};
