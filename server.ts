import express from 'express';
import * as http from 'http';
import * as path from 'path';
import * as WebSocket from 'ws';

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const WIPE_STATE_DELAY = 10000;

let currentState: Record<string, any> = {};

function stateCheck() {
    for (const key in currentState) {
        const state = currentState[key];

        if (new Date().getTime() - state.hb > WIPE_STATE_DELAY) {
            delete currentState[key];
        }
    }
}

wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (message: string) => {
        console.log('received: %s', (message));
        stateCheck();
        // Convert json string into json object
        const data: Record<string, any> = JSON.parse(message);


        if (data.type === 'position' || Object.keys(data).includes('coords')) {
            currentState[data.id] = data.coords;
            console.log('Updated coords for %s', (data.id));
        } else if (data.type === 'fetch') {
            if (Object.keys(currentState).includes(data.id)) {
                ws.send(currentState[data.id]);
            }
        } else if (data.type === 'all') {
            ws.send(JSON.stringify(currentState));
        }
    });

    ws.send('ready');
});

// Serve index file with express
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Start server
server.listen(process.env.PORT || 3000, () => {
    console.log(`Server started on port ${(server.address() as WebSocket.AddressInfo).port}`);
});