<template>
  <el-container class="layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="aside">
      <div class="logo" @click="$router.push('/user')">
        <el-icon :size="24"><Lock /></el-icon>
        <span v-show="!isCollapse" class="logo-text">权限管理系统</span>
      </div>
      <SidebarMenu :is-collapse="isCollapse" />
    </el-aside>

    <el-container>
      <!-- 顶部栏 -->
      <el-header class="header" height="56px">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="isCollapse = !isCollapse" :size="20">
            <Fold v-if="!isCollapse" /><Expand v-else />
          </el-icon>
        </div>
        <div class="header-right">
          <span class="user-info">
            <el-icon><UserFilled /></el-icon>
            {{ user?.nickname || user?.username || '未登录' }}
            <el-tag v-if="user?.roleNames?.length" size="small" type="primary" style="margin-left:8px">
              {{ user.roleNames[0] }}
            </el-tag>
          </span>
          <el-button text @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            退出
          </el-button>
        </div>
      </el-header>

      <!-- 主内容 -->
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { logout } from '@/api/auth.js'
import { removeToken, getUser } from '@/utils/auth.js'
import SidebarMenu from './SidebarMenu.vue'

const router = useRouter()
const isCollapse = ref(false)
const user = ref(getUser())

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
  } catch { return }
  try { await logout() } catch {}
  removeToken()
  router.push('/login')
}
</script>

<style scoped>
.layout { height: 100vh; }

.aside {
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  transition: width .3s;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}
.logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255,255,255,.1);
  user-select: none;
}
.logo-text { font-size: 16px; font-weight: 700; white-space: nowrap; }

.header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
  z-index: 10;
}
.collapse-btn { cursor: pointer; }
.collapse-btn:hover { color: #409eff; }
.header-right { display: flex; align-items: center; gap: 16px; }
.user-info { display: flex; align-items: center; gap: 4px; font-size: 14px; color: #333; }

.main { background: #f0f2f5; padding: 20px; overflow-y: auto; }
</style>
