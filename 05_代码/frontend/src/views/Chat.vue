<template>
  <div class="chat-layout">
    <Sidebar
      :conversations="conversations"
      :current-id="currentConvId"
      :user="authStore.user"
      @select="selectConv"
      @new="newChat"
      @logout="doLogout"
    />
    <div class="chat-main">
      <div v-if="!currentConvId" class="empty-state">
        <p>选择左侧对话，或新建一个开始聊天</p>
      </div>
      <template v-else>
        <div class="messages" ref="msgBox">
          <div v-for="(m, i) in messages" :key="i" :class="['msg-row', m.role]">
            <div class="bubble">{{ m.content }}</div>
          </div>
        </div>
        <div class="input-area">
          <el-input
            v-model="input"
            type="textarea"
            :rows="3"
            placeholder="输入消息，Enter 发送"
            @keydown.enter.exact.prevent="send"
          />
          <el-button type="primary" :loading="sending" @click="send" style="margin-top:8px">发送</el-button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'
import { authStore, clearAuth } from '../stores/auth'
import { chatWS } from '../api/ws'
import Sidebar from '../components/Sidebar.vue'

const router = useRouter()
const conversations = ref<any[]>([])
const currentConvId = ref<number | null>(null)
const messages = ref<any[]>([])
const input = ref('')
const sending = ref(false)
const msgBox = ref<HTMLElement>()

async function loadConversations() {
  conversations.value = await api.get('/conversations') as any
}

async function newChat() {
  const conv: any = await api.post('/conversations', { title: '新对话' })
  conversations.value.unshift(conv)
  currentConvId.value = conv.id
  messages.value = []
}

async function selectConv(id: number) {
  currentConvId.value = id
  const data: any = await api.get(`/conversations/${id}/messages`)
  messages.value = data.list || []
  scrollBottom()
}

async function send() {
  const text = input.value.trim()
  if (!text || !currentConvId.value || sending.value) return
  input.value = ''
  sending.value = true
  messages.value.push({ role: 'user', content: text })
  messages.value.push({ role: 'assistant', content: '' })
  scrollBottom()

  chatWS.send({
    type: 'chat',
    conversationId: currentConvId.value,
    content: text,
  })
}

function scrollBottom() {
  nextTick(() => {
    if (msgBox.value) msgBox.value.scrollTop = msgBox.value.scrollHeight
  })
}

async function doLogout() {
  try { await api.post('/auth/logout') } catch {}
  chatWS.close()
  clearAuth()
  router.push('/login')
}

onMounted(async () => {
  await loadConversations()
  chatWS.connect()
  // P1-4: WS 重连成功后重拉当前对话历史，避免离线期间消息丢失
  chatWS.on('open', (data: any) => {
    if (data?.reconnected && currentConvId.value) {
      api.get(`/conversations/${currentConvId.value}/messages`).then((d: any) => {
        messages.value = d.list || []
      })
    }
  })
  // P1-2: chunk/done/error 都按 conversationId 过滤，防止串气泡
  chatWS.on('chunk', (data: any) => {
    if (data.conversationId !== currentConvId.value) return
    const last = messages.value[messages.value.length - 1]
    if (last && last.role === 'assistant') last.content += data.content
    scrollBottom()
  })
  chatWS.on('done', (data: any) => {
    if (data.conversationId !== currentConvId.value) return
    sending.value = false
  })
  chatWS.on('error', (data: any) => {
    ElMessage.error(data?.message || '流式错误')
    sending.value = false
  })
})

onUnmounted(() => chatWS.close())
</script>

<style scoped>
.chat-layout { display: flex; height: 100vh; }
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fafafa;
}
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
.msg-row { display: flex; margin-bottom: 16px; }
.msg-row.user { justify-content: flex-end; }
.bubble {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 8px;
  line-height: 1.5;
  white-space: pre-wrap;
}
.msg-row.user .bubble { background: #409eff; color: #fff; }
.msg-row.assistant .bubble { background: #fff; border: 1px solid #e4e7ed; }
.input-area {
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #e4e7ed;
}
</style>
