const path = require('path');

module.exports = {
  packagerConfig: {
    asar: true,
    extraResource: [
      'src/assets/extension'
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {},
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-webpack",
      config: {
        mainConfig: {
          entry: "./src/main.ts",
          module: {
            rules: [
              {
                test: /\.tsx?$/,
                exclude: /(node_modules|\.webpack)/,
                use: {
                  loader: "ts-loader",
                  options: {
                    transpileOnly: true,
                  },
                },
              },
              {
                test: /\.(ts|js)$/,
                include: [
                  path.resolve(__dirname, 'src/services'),
                  path.resolve(__dirname, 'src/main.ts')
                ],
                use: {
                  loader: 'ts-loader',
                  options: {
                    transpileOnly: true
                  }
                }
              },
              {
                test: /\.(svg|png|jpg|gif|jpeg)$/,
                include: [
                  path.resolve(__dirname, "src/assets/icons")
                ],
                type: "asset/inline"
              },
            ],
          },
          resolve: {
            extensions: [
              ".js",
              ".ts",
              ".jsx",
              ".tsx",
              ".css",
              ".scss",
              ".json",
            ],
          },
        },
        preloadConfig: {
          config: {
            target: 'electron-preload',
            externals: {
              'child_process': 'commonjs child_process',
              'fs': 'commonjs fs'
            },
            resolve: {
              fallback: {
                "child_process": false,
                "fs": false
              }
            }
          }
        },
        renderer: {
          config: {
            module: {
              rules: [
                {
                  test: /\.tsx?$/,
                  exclude: [
                    /(node_modules|\.webpack)/,
                    /src\/services/  // Exclude services from renderer
                  ],
                  use: {
                    loader: "ts-loader",
                    options: {
                      transpileOnly: true,
                    },
                  },
                },
                {
                  test: /\.css$/,
                  use: ["style-loader", "css-loader"],
                },
                {
                  test: /\.scss$/,
                  use: ["style-loader", "css-loader", "sass-loader"],
                },
                {
                  test: /\.(jpg|png|svg|gif)$/,
                  use: {
                    loader: "file-loader",
                    options: {
                      name: "[name].[ext]",
                    },
                  },
                },
              ],
            },
            resolve: {
              extensions: [".js", ".ts", ".jsx", ".tsx", ".scss", ".css"],
            },
          },
          entryPoints: [
            {
              html: "./src/index.html",
              js: "./src/renderer/index.tsx",
              name: "main_window",
              preload: {
                js: "./src/preload.ts",
              },
            },
          ],
        },
      },
    },
  ],
};
