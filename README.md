# RxJS WebSocket Server Subject
RxJS WebSocket Server Wrapper for Node.js using WS

RxJS `WebSocketSubject` does not currently support injecting an established WebSocket connection.
This modified class accepts a WebSocket as returned by the WebSocket Server on connection event.

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
  const wsServerSubject = new WebSocketServerSubject<Message>(webSocket, wsServerSubjectConfig)

  /**
   * Top level Subscription
   */
  wsServerSubject.subscribe({
    next: (msg: Message) => console.log('Rx', msg),
    err: (err) => console.error(`Error ${err.code} ${err.reason}`),
    complete: () => 'Complete'
  })

  /**
   * Filter incoming message and respond with an ok
   */
  wsServerSubject
    .pipe(filter((msg: Message) => msg.event === 'test'))
    .subscribe(() => {
      const ok: Message = { event: 'ok' }
      wsServerSubject.next(ok)
      console.log('Tx', ok)
    })
})
```

## Generate Library
```bash
yarn build
```
