<template>
  <el-menu
    :default-active="route.path"
    :collapse="isCollapse"
    :collapse-transition="false"
    background-color="transparent"
    text-color="rgba(255,255,255,.7)"
    active-text-color="#fff"
    router
    class="sidebar-menu"
  >
    <template v-for="item in menus" :key="item.id">
      <!-- 有子菜单 -->
      <el-sub-menu v-if="item.children?.length" :index="item.path || item.code">
        <template #title>
          <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
          <span>{{ item.name }}</span>
        </template>
        <el-menu-item
          v-for="child in item.children"
          :key="child.id"
          :index="child.path"
        >
          <el-icon v-if="child.icon"><component :is="child.icon" /></el-icon>
          <span>{{ child.name }}</span>
        </el-menu-item>
      </el-sub-menu>

      <!-- 叶子菜单 -->
      <el-menu-item v-else :index="item.path">
        <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
        <span>{{ item.name }}</span>
      </el-menu-item>
    </template>
  </el-menu>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getUserInfo } from '@/api/auth.js'
import { setUser } from '@/utils/auth.js'

defineProps({ isCollapse: Boolean })
const route = useRoute()
const menus = ref([])

onMounted(async () => {
  try {
    const res = await getUserInfo()
    if (res.code === 200) {
      menus.value = res.data.menus || []
      setUser(res.data)
    }
  } catch { menus.value = defaultMenus }
})

// 降级菜单（当 API 失败时使用）
const defaultMenus = [
  { id: 1, name: '用户管理', code: 'user:menu', path: '/user', icon: 'User' },
  { id: 2, name: '角色管理', code: 'role:menu', path: '/role', icon: 'Setting' },
  { id: 3, name: '权限查看', code: 'perm:menu', path: '/permission', icon: 'Key' },
  { id: 4, name: '操作日志', code: 'log:menu', path: '/log', icon: 'Document' }
]
</script>

<style scoped>
.sidebar-menu { border-right: none; }
.sidebar-menu :deep(.el-menu-item),
.sidebar-menu :deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
}
.sidebar-menu :deep(.el-menu-item:hover),
.sidebar-menu :deep(.el-sub-menu__title:hover) {
  background: rgba(255,255,255,.08) !important;
}
.sidebar-menu :deep(.el-menu-item.is-active) {
  background: rgba(64,158,255,.2) !important;
  border-right: 3px solid #409eff;
}
</style>
