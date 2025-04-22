const path = require('path');

module.exports = {
  packagerConfig: {
    asar: true,
    extraResource: [
      'src/assets/extension'
    ],
    appId: "hyperiya.app.iris",
    icon: "src/assets/icons/Iris",  // no file extension needed here
    name: "Iris"
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        // Add these configurations
        name: "Iris",
        authors: "Hyperiya",
        description: "Music & Game Stat Displayer",
        exe: "Iris.exe",
        setupExe: "iris-setup.exe",
        setupIcon: "src/assets/icons/Iris.ico",
        iconUrl: "https://github.com/Hyperiya/Iris/blob/8d4bfd8ba8f0e90b2d7e4c58a1522f52123235cf/Iris/src/assets/icons/Iris.png"
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
      config: {
        options: {
          icon: 'src/assets/icons/Iris.icns' // Make sure you have .icns file for macOS
        }
      }
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          icon: 'src/assets/icons/Iris.png'
        }
      },
    },
    {
      name: "@electron-forge/maker-dmg", // Add DMG maker for macOS
      config: {
        icon: 'src/assets/icons/Iris.icns',
        format: 'ULFO'
      }
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          icon: 'src/assets/icons/Iris.png',
          categories: ['Utility'],
          maintainer: 'Hyperiya'
        }
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {
        options: {
          icon: 'src/assets/icons/Iris.png',
          categories: ['Utility'],
          maintainer: 'Hyperiya'
        }
      },
    },
    {
      name: '@electron-forge/maker-flatpak', // Add Flatpak support
      config: {
        options: {
          icon: 'src/assets/icons/Iris.png'
        }
      }
    }
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
