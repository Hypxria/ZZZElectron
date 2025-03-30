module.exports = {
  packagerConfig: {},
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
                  /src\/services/,  // Include the services directory
                  /src\/main\.ts$/  // Include main.ts
                ],
                use: {
                  loader: 'ts-loader',
                  options: {
                    transpileOnly: true
                  }
                }
              }
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
