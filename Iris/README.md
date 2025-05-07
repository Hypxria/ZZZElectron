# Iris

Music & Game Stat Displayer

## Building with Electron Builder

### Prerequisites

- Node.js 18+ installed
- npm 9+ installed

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm start
```

### Building with V8 Snapshot for Faster Loading

To build the application with V8 snapshot support for faster startup:

```bash
# For Windows
npm run build:snapshot

# For all platforms
npm run dist
```

### Platform-Specific Builds

```bash
# Windows only
npm run dist:win

# macOS only
npm run dist:mac

# Linux only
npm run dist:linux
```

### macOS Notarization

For notarizing macOS builds, set the following environment variables:

```bash
export APPLE_ID=your.apple.id@example.com
export APPLE_ID_PASSWORD=your-app-specific-password
export APPLE_TEAM_ID=your-team-id
```

Then run:

```bash
npm run dist:mac
```

## Configuration

The build configuration is defined in:

- `electron-builder.yml` - Base configuration
- `electron-builder.js` - JavaScript configuration that extends the YAML file
- `package.json` - Contains the `build` field for additional configuration

## License

MIT