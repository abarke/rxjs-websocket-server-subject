# RxJS WebSocket Server Subject
RxJs WebSocket Server Wrapper for Node.js using WS

## Usage
```typescript
import websocket from 'ws'
import { WebSocketServerSubject } from 'rxjs-websocket-server-subject'

// Create WebSocket Server using ws
const wsServer = new websocket.Server()

// Start Listening for WebSocket Connections
wsServer.on('connection', (webSocket: WebSocket, req: IncomingMessage) => {
  const wsServerSubjectConfig = {
    closeObserver: {
      next: () => console.log('disconnected')
    }
  }
  const availableResourceIds = new Set(['ch1', 'ch2', 'ch3', 'ch4'])
  const wsServerSubject = new WebSocketServerSubject<Message>(webSocket, wsServerSubjectConfig)

  /**
   * Top level Subscription
   */
  wsServerSubject.subscribe({
    next: (msg) => console.log('Rx', msg),
    err: (err) => console.error(`Error ${err.code} ${err.reason}`),
    complete: () => 'Complete'
  })

  /**
   * Filter incoming message and respond with an ok
   */
  wsServerSubject
    .pipe(filter((msg) => msg.event === 'test'))
    .subscribe(() => {
      const ok = { event: 'ok' }
      wsServerSubject.next(ok)
      console.log('Tx', ok)
    })
})
```

## Generate Library
```bash
yarn build
```
