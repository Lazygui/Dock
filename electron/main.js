// electron/main.js
import { app, BrowserWindow, ipcMain } from 'electron'
import { join, dirname } from 'path' // 导入 dirname
import { fileURLToPath } from 'url'  // 导入 fileURLToPath
import { handlePing } from './ping.js'
const UPDATE_JSON_URL = 'https://cdn.jsdelivr.net/gh/Lazygui/Dock@gh-pages/version.json';
const RELEASE_PAGE = 'https://github.com/Lazygui/Dock/releases/latest';
// 1. 手动构建 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
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
function createWindow() {
       const win = new BrowserWindow({
              width: 1029,
              height: 847,
              resizable: false,
              frame: false,
              titleBarStyle: 'hidden',
              backgroundColor: '#00000000',
              show: false,
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
              win.setOpacity(0) // 先设为透明
              win.show()        // 显示窗口（此时用户看不见，因为透明度是0）

              // 动画步长和间隔
              const step = 0.1
              const interval = 20

              const fadeInInterval = setInterval(() => {
                     // 防止窗口在动画过程中被关闭导致报错
                     if (win.isDestroyed()) {
                            clearInterval(fadeInInterval)
                            return
                     }

                     const opacity = win.getOpacity()
                     if (opacity < 1) {
                            // 增加透明度，直到 1
                            win.setOpacity(Math.min(1, opacity + step))
                     } else {
                            clearInterval(fadeInInterval)
                     }
              }, interval)
       })
       ipcMain.on('window-min', () => {
              win.minimize();
       })

       ipcMain.on('window-close', () => {
              // 如果窗口已经销毁，直接返回
              if (win.isDestroyed()) return;

              // 动画步长和间隔
              const step = 0.1; // 每次减少 0.1 透明度
              const interval = 20; // 每 20ms 执行一次 (约 50fps)

              const fadeOutInterval = setInterval(() => {
                     // 再次检查防止报错
                     if (win.isDestroyed()) {
                            clearInterval(fadeOutInterval);
                            return;
                     }

                     // 获取当前透明度
                     const opacity = win.getOpacity();

                     if (opacity > 0) {
                            // 减少透明度
                            win.setOpacity(Math.max(0, opacity - step));
                     } else {
                            // 动画结束，清理定时器并关闭窗口
                            clearInterval(fadeOutInterval);
                            win.destroy(); // 使用 destroy 强制关闭
                     }
              }, interval);
       })
}

app.whenReady().then(() => {
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
              const latestVersion = data.version; // 这是 Action 生成的 Tag 版本
              const currentVersion = app.getVersion();

              console.log(`Update Check: Local(${currentVersion}) vs Remote(${latestVersion})`);

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