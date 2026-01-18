'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, RefreshCw, ExternalLink, X } from 'lucide-react';
import { useEditor } from '@/contexts/EditorContext';

export function LivePreview() {
  const { tabs, currentProject, isPreviewOpen, togglePreview } = useEditor();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [consoleMessages, setConsoleMessages] = useState<string[]>([]);

  // Find HTML file content
  const htmlTab = tabs.find(t => t.extension === '.html');
  const cssTab = tabs.find(t => t.extension === '.css');
  const jsTab = tabs.find(t => t.extension === '.js');

  const generatePreviewContent = () => {
    let html = htmlTab?.content || `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Preview</title>
</head>
<body>
  <p>No HTML file found. Create an index.html file to see preview.</p>
</body>
</html>`;

    // Inject CSS if not already linked
    if (cssTab && !html.includes('<link') && !html.includes('<style>')) {
      const styleTag = `<style>\n${cssTab.content}\n</style>`;
      html = html.replace('</head>', `${styleTag}\n</head>`);
    }

    // Inject JS if not already linked
    if (jsTab && !html.includes('<script src=')) {
      const scriptTag = `<script>\n${jsTab.content}\n</script>`;
      html = html.replace('</body>', `${scriptTag}\n</body>`);
    }

    // Add console override to capture logs
    const consoleOverride = `
<script>
(function() {
  const originalConsole = { ...console };
  const sendMessage = (type, args) => {
    window.parent.postMessage({
      type: 'console',
      level: type,
      message: Array.from(args).map(a => 
        typeof a === 'object' ? JSON.stringify(a) : String(a)
      ).join(' ')
    }, '*');
  };
  console.log = (...args) => { sendMessage('log', args); originalConsole.log(...args); };
  console.error = (...args) => { sendMessage('error', args); originalConsole.error(...args); };
  console.warn = (...args) => { sendMessage('warn', args); originalConsole.warn(...args); };
  console.info = (...args) => { sendMessage('info', args); originalConsole.info(...args); };
  window.onerror = (msg, url, line, col, error) => {
    sendMessage('error', [msg + ' (line ' + line + ')']);
    return false;
  };
})();
</script>`;

    html = html.replace('<head>', `<head>\n${consoleOverride}`);

    return html;
  };

  const refreshPreview = () => {
    if (!iframeRef.current) return;
    
    setIsLoading(true);
    setConsoleMessages([]);
    
    const content = generatePreviewContent();
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    iframeRef.current.src = url;
    
    setTimeout(() => setIsLoading(false), 500);
  };

  // Listen for console messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'console') {
        setConsoleMessages(prev => [
          ...prev.slice(-50), // Keep last 50 messages
          `[${event.data.level}] ${event.data.message}`
        ]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Auto-refresh on content change
  useEffect(() => {
    if (isPreviewOpen) {
      const timeout = setTimeout(refreshPreview, 1000);
      return () => clearTimeout(timeout);
    }
  }, [htmlTab?.content, cssTab?.content, jsTab?.content, isPreviewOpen]);

  if (!isPreviewOpen) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 border-l border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Preview
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={refreshPreview}
            className="p-1.5 hover:bg-gray-800 rounded"
            title="Refresh"
          >
            <RefreshCw size={14} className={`text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              const content = generatePreviewContent();
              const blob = new Blob([content], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
            }}
            className="p-1.5 hover:bg-gray-800 rounded"
            title="Open in new tab"
          >
            <ExternalLink size={14} className="text-gray-400" />
          </button>
          <button
            onClick={togglePreview}
            className="p-1.5 hover:bg-gray-800 rounded"
            title="Close preview"
          >
            <X size={14} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Preview iframe */}
      <div className="flex-1 bg-white relative">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
          </div>
        )}
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
          title="Preview"
        />
      </div>

      {/* Console */}
      {consoleMessages.length > 0 && (
        <div className="h-32 border-t border-gray-800 bg-gray-950 overflow-auto">
          <div className="px-2 py-1 border-b border-gray-800 text-xs text-gray-500">
            Console
          </div>
          <div className="p-2 font-mono text-xs">
            {consoleMessages.map((msg, i) => (
              <div
                key={i}
                className={`py-0.5 ${
                  msg.startsWith('[error]') ? 'text-red-400' :
                  msg.startsWith('[warn]') ? 'text-yellow-400' :
                  'text-gray-400'
                }`}
              >
                {msg}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
