export { };

declare global {
       interface Window {
              electronAPI: {
                     startPing: (options: { ip: string; port: string }) => void;
                     onPingReply: (callback: (data: { type: 'log' | 'status', payload: any }) => void) => () => void;
                     minimize: () => void;
                     close: () => void;
              };
       }
}