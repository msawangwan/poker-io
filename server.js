const config = require('./config');

const logctr = require('./lib/logger')('server');

const http = require('http');
const path = require('path');
const mime = require('mime');
const fs = require('fs');

const addr = config.network.hostAddr;
const port = config.network.hostPort;

const debug = (a, ...b) => logctr.log(a, ...b);

const createContentTypeHeader = contentType => {
    return { 'content-type': contentType };
};

const mimeType = file => {
    return createContentTypeHeader(mime.lookup(path.basename(file)));
};

const writeResponse = response => {
    const [
        res, code, content, contentType
    ] = response;

    res.writeHead(code, contentType);
    res.end(content);
};

const logRequest = request => {
    return (req, res) => {
        [req, res, next] = request;

        debug('incoming request', `${req.url}`);

        next(req, res);
    };
};

const serve = file => {
    const [res, cache, resourcePath] = file;
    const absolutePath = './' + resourcePath;
    const data = cache[absolutePath];

    if (data) {
        writeResponse([res, 200, data, mimeType(absolutePath)]);
    } else {
        fs.exists(
            absolutePath,
            (valid) => {
                const error = [res, 404, 'server error 404', createContentTypeHeader('text/plain')];
                if (valid) {
                    fs.readFile(
                        absolutePath,
                        (err, data) => {
                            if (err) {
                                writeResponse(error);
                            } else {
                                cache[absolutePath] = data;
                                writeResponse([res, 200, data, mimeType(absolutePath)]);
                            }
                        }
                    )
                } else {
                    writeResponse(error);
                }
            }
        );
    }
};

const cache = {};

const requestRouter = http.createServer(
    (req, res) => {
        logRequest([req, res, (req, res) => {
            let resourcePath = 'public';

            if (req.url === '/') {
                resourcePath += '/index.html';
            } else {
                resourcePath += req.url;
            }

            serve([res, cache, resourcePath]);
        }])(req, res);
    }
);

const io = require('socket.io')(requestRouter);
const clientPortal = require('./lib/client-portal')(requestRouter, port, io);

clientPortal.setup();
clientPortal.handleClientConnections();