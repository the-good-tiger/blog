import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/**
 * Development server with live reload
 */
class DevServer {
    constructor(port = 3000, distDir = './dist') {
        this.port = port;
        this.distDir = distDir;
        this.clients = new Set();
        this.mimeTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.json': 'application/json'
        };
    }
    
    async start() {
        this.setupFileWatcher();
        this.startServer();
    }
    
    setupFileWatcher() {
        const watcher = chokidar.watch(['./content', './scripts', './assets'], {
            ignored: /(^|[/\\])\../, // ignore dotfiles
            persistent: true
        });
        
        watcher.on('change', (path) => {
            console.log(`File changed: ${path}`);
            this.triggerLiveReload();
        });
        
        watcher.on('add', (path) => {
            console.log(`File added: ${path}`);
            this.triggerLiveReload();
        });
    }
    
    triggerLiveReload() {
        this.clients.forEach(client => {
            client.write('data: reload\n\n');
        });
    }
    
    startServer() {
        const server = createServer(async (req, res) => {
            try {
                await this.handleRequest(req, res);
            } catch (error) {
                console.error('Server error:', error);
                res.writeHead(500);
                res.end('Internal Server Error');
            }
        });
        
        // SSE for live reload
        server.on('request', (req, res) => {
            if (req.url === '/livereload') {
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                });
                
                this.clients.add(res);
                req.on('close', () => this.clients.delete(res));
            }
        });
        
        server.listen(this.port, () => {
            console.log(`🚀 Development server running at http://localhost:${this.port}`);
            console.log(`📁 Serving files from: ${this.distDir}`);
            console.log(`🔄 Live reload enabled`);
        });
    }
    
    async handleRequest(req, res) {
        let filePath = join(__dirname, '..', this.distDir, req.url);
        
        // Default to index.html for directory requests
        if (filePath.endsWith('/')) {
            filePath = join(filePath, 'index.html');
        }
        
        // Check if file exists
        try {
            await stat(filePath);
        } catch (error) {
            // Try adding .html extension
            if (!extname(filePath)) {
                filePath += '.html';
                try {
                    await stat(filePath);
                } catch {
                    this.serve404(res);
                    return;
                }
            } else {
                this.serve404(res);
                return;
            }
        }
        
        // Serve file
        try {
            const content = await readFile(filePath);
            const ext = extname(filePath);
            const contentType = this.mimeTypes[ext] || 'application/octet-stream';
            
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache'
            });
            
            res.end(content);
        } catch (error) {
            this.serve404(res);
        }
    }
    
    serve404(res) {
        res.writeHead(404);
        res.end(`
            <html>
                <body>
                    <h1>404 - Not Found</h1>
                    <p>The requested file was not found.</p>
                    <p>Run <code>npm run build</code> to generate the site.</p>
                </body>
            </html>
        `);
    }
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const server = new DevServer();
    server.start();
}

export default DevServer;