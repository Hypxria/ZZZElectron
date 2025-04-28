import path from "path"
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  packagerConfig: {
    derefSymlinks: true,
    asar: true,
    extraResource: [
      'src/assets/extension'
    ],
    appId: "hyperiya.app.iris",
    icon: path.join(__dirname, 'src', 'assets', 'icons', 'Iris'),
    executableName: "Iris",
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
        iconUrl: "https://github.com/Hypxria/ZZZElectron/blob/8d4bfd8ba8f0e90b2d7e4c58a1522f52123235cf/App/src/assets/icons/Iris.png"
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
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
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-webpack",
      config: {
        mainConfig: {
          target: ['es2022'],
          entry: "./src/main.ts",
          devtool: 'source-map',
          output: {
            filename: '[name].js',
            path: path.resolve(__dirname, '.webpack'),
            module: true,
            library: {
              type: 'module'
            },
            chunkFormat: 'module'
          },
          experiments: {
            outputModule: true,
            topLevelAwait: true,
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
                    compilerOptions: {
                      module: 'ESNext',
                      moduleResolution: 'node'
                    }
                  }
                }
              }
            ]
          },
          resolve: {
            extensions: ['.js', '.ts', '.tsx', '.jsx', '.json'],
            extensionAlias: {
              '.js': ['.ts', '.tsx', '.js', '.jsx'],
              '.mjs': ['.mts', '.mjs']
            },
            fallback: {
              fs: false
            }
          }
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
            entry: './src/renderer/index.tsx',
            output: {
              filename: '[name].js',
              path: path.resolve(__dirname, '.webpack/renderer'),
              library: {
                type: 'module'
              },
              module: true,
              chunkFormat: 'module'
            },
            experiments: {
              outputModule: true,
              topLevelAwait: true,
            },
            module: {
              rules: [
                {
                  test: /\.tsx?$/,
                  exclude: [
                    /(node_modules|\.webpack)/,
                    /src\/services/  // Exclude services from renderer
                  ],
                  use: {
                    loader: 'ts-loader',
                    options: {
                      transpileOnly: true,
                      compilerOptions: {
                        module: 'esnext',
                        moduleResolution: 'node'
                      }
                    }
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
              extensions: ['.js', '.ts', '.tsx', '.jsx', '.json'],
              extensionAlias: {
                '.js': ['.ts', '.tsx', '.js', '.jsx'],
                '.mjs': ['.mts', '.mjs']
              }
            },
            target: 'electron-renderer',
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

