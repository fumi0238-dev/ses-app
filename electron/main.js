const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');
const http = require('http');

let mainWindow = null;
let serverProcess = null;
let serverPort = null;

const isDev = !app.isPackaged;

function getStandalonePath() {
  if (isDev) {
    return path.join(__dirname, '..', '.next', 'standalone');
  }
  // In packaged app, standalone is inside resources/app/electron/standalone/
  return path.join(__dirname, 'standalone');
}

function getDbPath() {
  if (isDev) {
    return path.join(__dirname, '..', 'dev.db');
  }
  return path.join(app.getPath('userData'), 'ses-app.db');
}

function getTemplatePath() {
  if (isDev) {
    return path.join(__dirname, '..', 'template.db');
  }
  return path.join(process.resourcesPath, 'template.db');
}

function initializeDatabase() {
  const dbPath = getDbPath();
  if (!fs.existsSync(dbPath)) {
    const templatePath = getTemplatePath();
    if (fs.existsSync(templatePath)) {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.copyFileSync(templatePath, dbPath);
      console.log('Database initialized:', dbPath);
    } else {
      console.warn('Template database not found:', templatePath);
    }
  } else {
    console.log('Database exists:', dbPath);
  }
}

function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

function waitForServer(port, timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error('サーバーの起動がタイムアウトしました'));
        } else {
          setTimeout(check, 300);
        }
      });
      req.setTimeout(2000, () => {
        req.destroy();
        if (Date.now() - start > timeout) {
          reject(new Error('サーバーの起動がタイムアウトしました'));
        } else {
          setTimeout(check, 300);
        }
      });
    };
    check();
  });
}

function startServer(port) {
  const standalonePath = getStandalonePath();
  const serverScript = path.join(standalonePath, 'server.js');

  if (!fs.existsSync(serverScript)) {
    throw new Error(`サーバースクリプトが見つかりません: ${serverScript}`);
  }

  return new Promise((resolve, reject) => {
    serverProcess = spawn(process.execPath, [serverScript], {
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        NODE_ENV: 'production',
        PORT: String(port),
        HOSTNAME: '127.0.0.1',
        DATABASE_PATH: getDbPath(),
      },
      cwd: standalonePath,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`[next] ${data.toString().trim()}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`[next] ${data.toString().trim()}`);
    });

    serverProcess.on('error', (err) => {
      reject(new Error(`サーバープロセスの起動に失敗: ${err.message}`));
    });

    serverProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`Server exited with code ${code}`);
      }
      serverProcess = null;
    });

    // Server process spawned, resolve immediately
    // We'll wait for HTTP readiness separately
    resolve();
  });
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'SES案件マッチング管理ツール',
    show: false,
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function killServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

app.whenReady().then(async () => {
  try {
    // Initialize database
    initializeDatabase();

    // Find available port and start server
    serverPort = await findAvailablePort(23456);
    console.log(`Starting server on port ${serverPort}...`);
    await startServer(serverPort);

    // Wait for server to be ready
    console.log('Waiting for server to be ready...');
    await waitForServer(serverPort);
    console.log('Server is ready!');

    // Create window
    createWindow(serverPort);
  } catch (err) {
    console.error('Startup error:', err);
    dialog.showErrorBox(
      '起動エラー',
      `アプリケーションの起動に失敗しました。\n\n${err.message}`
    );
    killServer();
    app.quit();
  }
});

app.on('window-all-closed', () => {
  killServer();
  app.quit();
});

app.on('before-quit', () => {
  killServer();
});

app.on('activate', () => {
  if (mainWindow === null && serverPort) {
    createWindow(serverPort);
  }
});
