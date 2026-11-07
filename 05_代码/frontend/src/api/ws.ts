import { authStore } from '../stores/auth'

type MessageHandler = (data: any) => void

const MAX_RECONNECT = 5
// 指数退避：1s, 2s, 4s, 8s, 16s
const BACKOFF_BASE = 1000

export class ChatWS {
  private ws: WebSocket | null = null
  private handlers: Record<string, MessageHandler[]> = {}
  private reconnectTimer: number | null = null
  private reconnectAttempts = 0
  private manuallyClosed = false

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return
    // 已达最大重连次数，不再自动连
    if (this.reconnectAttempts >= MAX_RECONNECT) return

    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    this.manuallyClosed = false
    this.ws = new WebSocket(`${proto}://${location.host}/ws?token=${authStore.token}`)

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      // 首次连接 vs 重连：重连后通知前端重拉当前对话历史
      // （首次连接时前端 onMounted 已经 loadConversations，不需要重复拉）
      // 用一个内置事件区分：第一次 open 前 reconnectAttempts 已被置 0，用标志位判断
      console.log('[WS] connected')
      this.handlers['open']?.forEach((h) => h({ reconnected: this._justReconnected }))
      this._justReconnected = false
    }

    this.ws.onclose = () => {
      // close() 已手动清空 onclose，走到这里说明是被动断开
      console.log(`[WS] closed, reconnect attempt ${this.reconnectAttempts + 1}/${MAX_RECONNECT}`)
      if (this.manuallyClosed) return
      if (!authStore.token) return // 已登出，不再连
      if (this.reconnectAttempts >= MAX_RECONNECT) {
        console.log('[WS] max reconnect attempts reached, stop')
        this.handlers['reconnect_failed']?.forEach((h) => h({}))
        return
      }
      const delay = BACKOFF_BASE * Math.pow(2, this.reconnectAttempts)
      this.reconnectAttempts += 1
      this._justReconnected = true
      this.reconnectTimer = window.setTimeout(() => this.connect(), delay)
    }

    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data)
        const type = msg.type || 'message'
        this.handlers[type]?.forEach((h) => h(msg))
      } catch (e) {
        console.error('[WS] parse error', e)
      }
    }
  }

  private _justReconnected = false

  on(type: string, handler: MessageHandler) {
    if (!this.handlers[type]) this.handlers[type] = []
    this.handlers[type].push(handler)
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  close() {
    this.manuallyClosed = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.reconnectAttempts = 0
    // 关键：清空回调，防止 close() 触发 onclose 后又起 3s 重连
    if (this.ws) {
      this.ws.onopen = null
      this.ws.onclose = null
      this.ws.onmessage = null
      try { this.ws.close() } catch {}
    }
    this.ws = null
  }
}

export const chatWS = new ChatWS()
