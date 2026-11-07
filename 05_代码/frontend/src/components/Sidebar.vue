<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <span class="app-name">AI 工作台</span>
      <el-button size="small" type="primary" @click="$emit('new')">+ 新对话</el-button>
    </div>
    <div class="conv-list">
      <div
        v-for="c in conversations"
        :key="c.id"
        :class="['conv-item', { active: c.id === currentId }]"
        @click="$emit('select', c.id)"
      >
        {{ c.title }}
      </div>
    </div>
    <div class="sidebar-footer">
      <span class="username">{{ user?.username }}</span>
      <el-button size="small" @click="$emit('logout')">退出</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  conversations: any[]
  currentId: number | null
  user: any
}>()
defineEmits<{
  (e: 'select', id: number): void
  (e: 'new'): void
  (e: 'logout'): void
}>()
</script>

<style scoped>
.sidebar {
  width: 260px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #2b2f36;
  color: #ddd;
}
.sidebar-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #3a3f47;
}
.app-name { font-weight: 600; }
.conv-list { flex: 1; overflow-y: auto; padding: 8px; }
.conv-item {
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 4px;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.conv-item:hover { background: #3a3f47; }
.conv-item.active { background: #409eff; }
.sidebar-footer {
  padding: 12px 16px;
  border-top: 1px solid #3a3f47;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.username { font-size: 13px; }
</style>
