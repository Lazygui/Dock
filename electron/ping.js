// electron/ping.js

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// 核心网络库
const tcpp = require('tcp-ping'); // 用于带端口的 TCP 测试
const { spawn } = require('child_process'); // 用于调用系统原生 Ping
const os = require('os'); // 用于判断操作系统
const iconv = require('iconv-lite'); // 用于修复 Windows 中文乱码

/**
 * 辅助函数：统一发送消息回前端
 */
function reply(event, type, payload) {
       try {
              if (!event.sender.isDestroyed()) {
                     event.reply('ping-reply', { type, payload });
              }
       } catch (error) {
              console.error('Failed to send reply to renderer:', error);
       }
}

/**
 * 主处理函数
 */
export async function handlePing(event, { ip, port }) {
       const targetPort = parseInt(port, 10);
       const hasPort = !isNaN(targetPort) && targetPort > 0;
       const targetDesc = hasPort ? `${ip}:${targetPort}` : ip;

       // 清空之前的状态（可选）
       reply(event, 'status', { code: 'pending', message: '测试中...' });

       if (hasPort) {
              // ============================================================
              // 模式 1: TCP 端口测试 (保持原逻辑，适用于检测服务是否开启)
              // ============================================================
              reply(event, 'log', `正在尝试 TCP 连接到 ${targetDesc} (端口模式)...`);

              try {
                     // 循环测试 4 次，模拟 Ping 的过程
                     let successCount = 0;

                     for (let i = 0; i < 4; i++) {
                            // 将 callback 风格转换为 Promise
                            const result = await new Promise((resolve) => {
                                   tcpp.ping({ address: ip, port: targetPort, attempts: 1, timeout: 2000 }, (err, data) => {
                                          if (err) resolve({ err });
                                          else resolve(data.results[0]);
                                   });
                            });

                            if (result.err || (result.seq === undefined && !result.time)) {
                                   reply(event, 'log', `连接到 ${targetDesc} 失败: 连接被拒绝或超时`);
                            } else {
                                   successCount++;
                                   const timeStr = result.time ? `${result.time.toFixed(2)}ms` : '<1ms';
                                   reply(event, 'log', `来自 ${targetDesc} 的回复: time=${timeStr}`);
                            }

                            // 间隔 1 秒再发下一次（除了最后一次）
                            if (i < 3) await new Promise(r => setTimeout(r, 1000));
                     }

                     if (successCount > 0) {
                            reply(event, 'status', { code: 'success', message: '端口连接成功' });
                     } else {
                            reply(event, 'status', { code: 'failure', message: '端口无法连接' });
                     }

              } catch (error) {
                     reply(event, 'log', `TCP 测试出错: ${error.message}`);
                     reply(event, 'status', { code: 'failure', message: '测试出错' });
              }

       } else {
              // ============================================================
              // 模式 2: 系统原生 ICMP Ping (完全模拟 CMD)
              // ============================================================
              reply(event, 'log', `正在调用系统 Ping 测试 ${ip} (ICMP模式)...`);

              const isWin = os.platform() === 'win32';

              // Windows 使用 -n 4，Mac/Linux 使用 -c 4
              const args = isWin ? ['-n', '4', ip] : ['-c', '4', ip];
              // Windows 下 Ping 命令就是 ping.exe
              const cmd = 'ping';

              // 使用 spawn 启动进程，实现流式输出
              const child = spawn(cmd, args);

              // 监听标准输出 (stdout)
              child.stdout.on('data', (chunk) => {
                     let output;
                     // Windows 中文系统通常是 CP936 (GBK)，需要转换，否则乱码
                     if (isWin) {
                            output = iconv.decode(chunk, 'cp936');
                     } else {
                            output = chunk.toString();
                     }

                     // 按行分割，防止一次性发来多行或半行
                     const lines = output.split(/\r?\n/);
                     lines.forEach(line => {
                            if (line.trim()) {
                                   reply(event, 'log', line.trim());
                            }
                     });
              });

              // 监听错误输出 (stderr)
              child.stderr.on('data', (chunk) => {
                     const errText = isWin ? iconv.decode(chunk, 'cp936') : chunk.toString();
                     reply(event, 'log', `Error: ${errText}`);
              });

              // 监听进程结束
              child.on('close', (code) => {
                     if (code === 0) {
                            reply(event, 'status', { code: 'success', message: 'Ping 完成' });
                     } else {
                            reply(event, 'log', `\nPing 进程退出，代码: ${code}`);
                            reply(event, 'status', { code: 'failure', message: 'Ping 失败' });
                     }
              });

              // 监听进程错误（如找不到 ping 命令）
              child.on('error', (err) => {
                     reply(event, 'log', `无法执行系统命令: ${err.message}`);
                     reply(event, 'status', { code: 'failure', message: '执行出错' });
              });
       }
}