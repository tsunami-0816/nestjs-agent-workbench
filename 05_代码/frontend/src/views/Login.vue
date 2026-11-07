<template>
  <div class="login-wrap">
    <el-card class="login-card">
      <h2 class="title">AI 对话工作台</h2>
      <el-tabs v-model="tab">
        <el-tab-pane label="登录" name="login">
          <el-form :model="loginForm" label-width="0" @submit.prevent>
            <el-form-item>
              <el-input v-model="loginForm.username" placeholder="用户名" prefix-icon="User" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="loginForm.password" type="password" placeholder="密码" prefix-icon="Lock" show-password @keyup.enter="doLogin" />
            </el-form-item>
            <el-button type="primary" :loading="loading" style="width:100%" @click="doLogin">登 录</el-button>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="注册" name="register">
          <el-form :model="regForm" label-width="0">
            <el-form-item>
              <el-input v-model="regForm.username" placeholder="用户名" prefix-icon="User" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="regForm.password" type="password" placeholder="密码（至少6位）" prefix-icon="Lock" show-password @keyup.enter.exact.prevent="doRegister" />
            </el-form-item>
            <el-button type="primary" :loading="loading" style="width:100%" @click="doRegister">注 册</el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'
import { setAuth } from '../stores/auth'

const router = useRouter()
const tab = ref('login')
const loading = ref(false)
const loginForm = ref({ username: '', password: '' })
const regForm = ref({ username: '', password: '' })

async function doLogin() {
  loading.value = true
  try {
    const data: any = await api.post('/auth/login', loginForm.value)
    setAuth(data.access_token, data.user)
    ElMessage.success('登录成功')
    router.push('/')
  } finally {
    loading.value = false
  }
}

async function doRegister() {
  loading.value = true
  try {
    await api.post('/auth/register', regForm.value)
    ElMessage.success('注册成功，请登录')
    tab.value = 'login'
    loginForm.value.username = regForm.value.username
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}
.login-card { width: 380px; }
.title { text-align: center; margin: 0 0 16px; }
</style>
