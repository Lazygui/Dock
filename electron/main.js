// electron/main.js
import { app, BrowserWindow } from 'electron'
import { join, dirname } from 'path' // 导入 dirname
import { fileURLToPath } from 'url'  // 导入 fileURLToPath
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pkg = require('../package.json')
const UPDATE_JSON_URL = 'https://cdn.jsdelivr.net/gh/Lazygui/Dock@gh-pages/version.json';
const RELEASE_PAGE = 'https://github.com/Lazygui/Dock/releases/latest';
// 1. 手动构建 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function createWindow() {
       const win = new BrowserWindow({
              width: 1029,
              height: 847,
              resizable: false,
              frame: false,
              titleBarStyle: 'hidden',
              backgroundColor: '#00000000',
              show: false,
              paintWhenInitiallyHidden: true,
              webPreferences: {
                     nodeIntegration: false,
                     contextIsolation: true,
                     preload: join(__dirname, 'preload.cjs'),
              },
       })

       // 注意：如果你之前使用了 "--port 5173"，这里最好保持 5173，而不是 8080
       if (process.env.NODE_ENV === 'development') {
              win.loadURL('http://localhost:8080')
              win.webContents.openDevTools()
       } else {
              win.loadFile(join(__dirname, '../dist/index.html'))
       }
       win.once('ready-to-show', () => {
              win.show()
       })
}

app.whenReady().then(() => {
       const { ipcMain, shell } = require('electron');
       const { handlePing } = require('./ping.js');
       ipcMain.on('window-min', () => {
              if (win) win.minimize(); // <-- 加上 if(win) 做保护
       })

       ipcMain.on('window-close', () => {
              if (win) win.close(); // <-- 加上 if(win) 做保护
       })


       ipcMain.on('start-ping', handlePing);
       ipcMain.handle('check-for-update', checkForUpdate);
       ipcMain.handle('open-external', (event, url) => {
              if (url) shell.openExternal(url);
       });
       createWindow();
})

app.on('window-all-closed', () => {
       if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
       if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

/**
 * 检查更新
 */
async function checkForUpdate() {
       try {
              // 加上时间戳 t 避免 CDN 缓存旧版本
              const response = await fetch(`${UPDATE_JSON_URL}?t=${Date.now()}`, {
                     method: 'GET',
                     cache: 'no-store'
              });

              if (!response.ok) {
                     // 如果刚发布还没有 gh-pages 分支，可能会 404，这是正常的
                     throw new Error(`CDN Error: ${response.status}`);
              }

              const data = await response.json();
              const latestVersion = data.version;
              const currentVersion = pkg.version;

              if (isNewerVersion(latestVersion, currentVersion)) {
                     return {
                            hasUpdate: true,
                            version: latestVersion,
                            note: `发现新版本 v${latestVersion}，请前往下载。`,
                            downloadUrl: RELEASE_PAGE
                     };
              }
              return { hasUpdate: false };
       } catch (error) {
              console.error('Update check failed:', error);
              return { hasUpdate: false, error: error.message };
       }
}
function isNewerVersion(remoteVer, currentVer) {
       // 移除可能存在的 v 前缀
       const v1 = String(remoteVer).replace(/^v/, '').split('.').map(Number);
       const v2 = String(currentVer).replace(/^v/, '').split('.').map(Number);
       for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
              const val1 = v1[i] || 0;
              const val2 = v2[i] || 0;
              if (val1 > val2) return true;
              if (val1 < val2) return false;
       }
       return false;
}