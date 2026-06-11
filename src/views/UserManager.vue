<template>
  <div class="page">
    <!-- 搜索栏 -->
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键字">
          <el-input v-model="searchForm.keyword" placeholder="用户名/昵称/邮箱" clearable
            @keyup.enter="handleSearch" style="width:220px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作栏 -->
    <el-card shadow="never" style="margin-top:16px">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button type="primary" @click="openAdd" v-if="hasPerm('user:add')">
            <el-icon><Plus /></el-icon> 新增用户
          </el-button>
          <el-button type="danger" @click="handleBatchDelete" :disabled="!selected.length" v-if="hasPerm('user:delete')">
            <el-icon><Delete /></el-icon> 批量删除 {{ selected.length ? `(${selected.length})` : '' }}
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-button @click="handleExport" v-if="hasPerm('user:export')">
            <el-icon><Download /></el-icon> 导出 Excel
          </el-button>
        </div>
      </div>

      <!-- 表格 -->
      <el-table
        :data="tableData"
        v-loading="loading"
        @selection-change="val => selected = val"
        stripe
        style="margin-top:12px"
      >
        <el-table-column type="selection" width="45" />
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="nickname" label="昵称" width="140" />
        <el-table-column prop="email" label="邮箱" min-width="200" />
        <el-table-column label="角色" width="160">
          <template #default="{ row }">
            <el-tag v-for="r in row.roles" :key="r.id" size="small" style="margin-right:4px">
              {{ r.name }}
            </el-tag>
            <span v-if="!row.roles?.length" style="color:#999">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="warning" @click="openEdit(row)" v-if="hasPerm('user:edit')">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)"
              v-if="hasPerm('user:delete') && row.id !== 1">
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @change="loadData"
          background
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="520px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" :prop="isEdit ? '' : 'password'">
          <el-input v-model="form.password" type="password" show-password
            :placeholder="isEdit ? '留空则不修改密码' : '请输入密码'" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="角色" prop="roleIds">
          <el-select v-model="form.roleIds" multiple placeholder="请选择角色" style="width:100%">
            <el-option v-for="r in allRoles" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserList, addUser, updateUser, deleteUser, batchDeleteUsers } from '@/api/user.js'
import { getAllRoles } from '@/api/role.js'
import { exportUsers } from '@/api/export.js'
import { getUser } from '@/utils/auth.js'

// 权限检查
const perms = computed(() => getUser()?.permissions || [])
const hasPerm = (code) => perms.value.includes(code)

// 搜索
const searchForm = reactive({ keyword: '' })

// 分页
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const tableData = ref([])
const loading = ref(false)
const selected = ref([])

// 弹窗
const dialogVisible = ref(false)
const dialogTitle = computed(() => isEdit.value ? '编辑用户' : '新增用户')
const isEdit = ref(false)
const editId = ref(null)
const submitting = ref(false)
const formRef = ref(null)
const allRoles = ref([])

const form = reactive({
  username: '', password: '', nickname: '', email: '', roleIds: []
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }]
}

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const res = await getUserList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword
    })
    if (res.code === 200) {
      tableData.value = res.data.list
      pagination.total = res.data.total
    }
  } catch {} finally { loading.value = false }
}

// 搜索
function handleSearch() {
  pagination.page = 1
  loadData()
}
function resetSearch() {
  searchForm.keyword = ''
  handleSearch()
}

// 加载角色
async function loadRoles() {
  const res = await getAllRoles()
  if (res.code === 200) allRoles.value = res.data
}

// 新增
function openAdd() {
  isEdit.value = false
  editId.value = null
  resetForm()
  dialogVisible.value = true
}

// 编辑
function openEdit(row) {
  isEdit.value = true
  editId.value = row.id
  form.username = row.username
  form.password = ''
  form.nickname = row.nickname
  form.email = row.email
  form.roleIds = row.roles?.map(r => r.id) || []
  dialogVisible.value = true
}

// 重置表单
function resetForm() {
  form.username = ''
  form.password = ''
  form.nickname = ''
  form.email = ''
  form.roleIds = []
  formRef.value?.clearValidate()
}

// 提交
async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const data = {
      username: form.username,
      nickname: form.nickname,
      email: form.email,
      roleIds: form.roleIds
    }
    if (form.password) data.password = form.password

    const res = isEdit.value
      ? await updateUser(editId.value, data)
      : await addUser(data)

    if (res.code === 200) {
      ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
      dialogVisible.value = false
      loadData()
    }
  } catch {} finally { submitting.value = false }
}

// 删除
async function handleDelete(id) {
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？', '警告', { type: 'warning' })
  } catch { return }
  const res = await deleteUser(id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
    loadData()
  }
}

// 批量删除
async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selected.value.length} 个用户吗？`, '警告', { type: 'warning' })
  } catch { return }
  const ids = selected.value.map(s => s.id)
  const res = await batchDeleteUsers(ids)
  if (res.code === 200) {
    ElMessage.success(res.message)
    selected.value = []
    loadData()
  }
}

// 导出
function handleExport() {
  exportUsers()
}

onMounted(() => {
  loadData()
  loadRoles()
})
</script>

<style scoped>
.page { max-width: 1400px; }
.search-card :deep(.el-card__body) { padding-bottom: 0; }
.toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
