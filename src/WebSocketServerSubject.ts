import { NextObserver, Subscription, Subscriber, Subject } from 'rxjs'
import { WebSocketMessage } from 'rxjs/internal/observable/dom/WebSocketSubject'
import { AnonymousSubject } from 'rxjs/internal-compatibility'

interface WebSocketServerSubjectConfig<T> {
  /**
   * A serializer used to create messages from passed values before the
   * messages are sent to the server. Defaults to JSON.stringify.
   */
  serializer?: (value: any) => WebSocketMessage;
  /**
   * A deserializer used for messages arriving on the socket from the
   * server. Defaults to JSON.parse.
   */
  deserializer?: (e: MessageEvent) => any;
  /**
   * An Observer than watches when close events occur on the underlying webSocket
   */
  closeObserver?: NextObserver<CloseEvent>;
  /**
   * An Observer that watches when a close is about to occur due to
   * unsubscription.
   */
  closingObserver?: NextObserver<void>;
}

const WEBSOCKETSUBJECT_INVALID_ERROR_OBJECT =
  'WebSocketServerSubject.error must be called with an object of follow type { code: number, reason: string }'

export class WebSocketServerSubject<T> extends AnonymousSubject<T> {
  _output: Subject<T>;
  _socket: WebSocket
  _config: WebSocketServerSubjectConfig<T>

  /**
   * @param socket
   * @param config
   */
  constructor (socket: WebSocket, config?: WebSocketServerSubjectConfig<T>) {
    super()
    this._output = new Subject<T>()
    this._config = { ...config }
    this._socket = this.configureReceiver(socket)
    this.destination = this.configureTransmitter(socket)
  }

  /**
   * Attach WebSocket Handlers for onmessage, onclose and onerror
   */
  private configureReceiver (socket: WebSocket): WebSocket {
    const deserializer = this._config.deserializer || function (e: MessageEvent) { return JSON.parse(e.data) }

    /**
     * On message handler calls next on the output subject
     */
    socket.onmessage = (e: MessageEvent) => {
      try {
        this._output.next(deserializer(e))
      } catch (err) {
        this._output.error(err)
      }
    }

    /**
     * On close handler
     */
    socket.onclose = (e: CloseEvent) => {
      const { closeObserver } = this._config
      if (closeObserver) {
        closeObserver.next(e)
      }
      if (e.wasClean) {
        this._output.complete()
      } else {
        this._output.error(e)
      }
    }

    /**
     * On error handler
     */
    socket.onerror = (e: Event) => {
      this._output.error(e)
    }

    return socket
  }

  /**
   * Create a subscriber that sends data via the WebSocket when called with WebSocketServerSubject.next()
   */
  private configureTransmitter (socket: WebSocket) {
    const serializer = this._config.serializer || function (value: any) { return JSON.stringify(value) }
    return Subscriber.create<T>(
      (x) => {
        if (socket.readyState === 1) {
          try {
            socket.send(serializer(x))
          } catch (e) {
            if (this.destination) {
              this.destination.error(e)
            }
          }
        }
      },
      (e) => {
        const { closingObserver } = this._config
        if (closingObserver) {
          closingObserver.next(undefined)
        }
        if (e && e.code) {
          socket.close(e.code, e.reason)
        } else {
          this._output.error(new TypeError(WEBSOCKETSUBJECT_INVALID_ERROR_OBJECT))
        }
      },
      () => {
        const { closingObserver } = this._config
        if (closingObserver) {
          closingObserver.next(undefined)
        }
        socket.close()
      }
    ) as Subscriber<any>
  }

  /**
   * Close WebSocket Connection if open
   */
  _closeSocket () {
    if (this._socket && this._socket.readyState === this._socket.OPEN) {
      this._socket.close()
    }
  }

  /**
   * Override inherited _subscribe
   */
  _subscribe (subscriber: Subscriber<T>): Subscription {
    const { source } = this
    if (source) {
      return source.subscribe(subscriber)
    }
    this._output.subscribe(subscriber)
    subscriber.add(() => {
      if (this._output.observers.length === 0) {
        this._closeSocket()
      }
    })
    return subscriber
  }

  /**
   * Override inherited unsubscribe that closes the WebSocket before unsubscribing
   */
  unsubscribe () {
    this._closeSocket()
    super.unsubscribe()
  }
}
