<template>
  <div class="page">
    <el-card shadow="never">
      <div class="toolbar">
        <el-button type="primary" @click="openAdd" v-if="hasPerm('role:add')">
          <el-icon><Plus /></el-icon> 新增角色
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe style="margin-top:12px">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="角色名称" width="160" />
        <el-table-column prop="code" label="角色编码" width="160" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="permCount" label="权限数" width="80" align="center" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="success" @click="openPerm(row)" v-if="hasPerm('role:perm')">
              <el-icon><Key /></el-icon> 权限
            </el-button>
            <el-button size="small" type="warning" @click="openEdit(row)" v-if="hasPerm('role:edit') && row.id > 3">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)" v-if="hasPerm('role:delete') && row.id > 3">
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="480px" :close-on-click-modal="false" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" placeholder="如：财务主管" />
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="form.code" placeholder="如：finance" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="角色说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 权限分配弹窗 -->
    <el-dialog v-model="permVisible" title="分配权限" width="560px" :close-on-click-modal="false">
      <el-tabs v-model="permTab">
        <el-tab-pane label="菜单权限" name="menu">
          <el-tree
            ref="menuTreeRef"
            :data="menuTree"
            show-checkbox
            node-key="id"
            :default-checked-keys="checkedPermIds"
            :props="{ label: 'name', children: 'children' }"
            default-expand-all
          />
        </el-tab-pane>
        <el-tab-pane label="按钮权限" name="button">
          <el-checkbox-group v-model="checkedPermIds">
            <div v-for="btn in buttonPerms" :key="btn.id" style="margin-bottom:8px">
              <el-checkbox :value="btn.id" :label="btn.id">
                {{ btn.name }} <span style="color:#999;font-size:12px">({{ btn.code }})</span>
              </el-checkbox>
            </div>
          </el-checkbox-group>
          <el-empty v-if="!buttonPerms.length" description="暂无按钮权限" :image-size="60" />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="permVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingPerm" @click="handleSavePerm">保存权限</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRoleList, addRole, updateRole, deleteRole, saveRolePermissions } from '@/api/role.js'
import { getAllPermissions, getRolePermissionIds } from '@/api/permission.js'
import { getUser } from '@/utils/auth.js'

const perms = computed(() => getUser()?.permissions || [])
const hasPerm = (code) => perms.value.includes(code)

const tableData = ref([])
const loading = ref(false)

const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const submitting = ref(false)
const formRef = ref(null)
const form = reactive({ name: '', code: '', description: '' })
const rules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }]
}
const dialogTitle = computed(() => isEdit.value ? '编辑角色' : '新增角色')

// 权限分配
const permVisible = ref(false)
const permRoleId = ref(null)
const permTab = ref('menu')
const menuTree = ref([])
const buttonPerms = ref([])
const checkedPermIds = ref([])
const menuTreeRef = ref(null)
const savingPerm = ref(false)

async function loadData() {
  loading.value = true
  try {
    const res = await getRoleList()
    if (res.code === 200) tableData.value = res.data
  } catch {} finally { loading.value = false }
}

function openAdd() {
  isEdit.value = false
  editId.value = null
  resetForm()
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  editId.value = row.id
  form.name = row.name
  form.code = row.code
  form.description = row.description
  dialogVisible.value = true
}

function resetForm() {
  form.name = ''
  form.code = ''
  form.description = ''
  formRef.value?.clearValidate()
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const res = isEdit.value
      ? await updateRole(editId.value, form)
      : await addRole(form)
    if (res.code === 200) {
      ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
      dialogVisible.value = false
      loadData()
    }
  } catch {} finally { submitting.value = false }
}

async function handleDelete(id) {
  try {
    await ElMessageBox.confirm('确定要删除该角色吗？关联的用户将失去此角色。', '警告', { type: 'warning' })
  } catch { return }
  const res = await deleteRole(id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
    loadData()
  }
}

async function openPerm(row) {
  permRoleId.value = row.id
  checkedPermIds.value = []
  // 加载所有权限
  const res1 = await getAllPermissions()
  if (res1.code === 200) {
    // 构建菜单树
    const all = res1.data.all
    menuTree.value = buildTree(all.filter(p => p.type === 'menu'), 0)
    buttonPerms.value = all.filter(p => p.type === 'button')
  }
  // 加载已有权限
  const res2 = await getRolePermissionIds(row.id)
  if (res2.code === 200) {
    checkedPermIds.value = res2.data
  }
  permVisible.value = true
}

function buildTree(list, parentId) {
  return list
    .filter(item => item.parent_id === parentId)
    .map(item => ({
      ...item,
      children: buildTree(list, item.id)
    }))
}

async function handleSavePerm() {
  savingPerm.value = true
  try {
    // 合并菜单树勾选和按钮勾选
    const menuChecked = menuTreeRef.value?.getCheckedKeys() || []
    const halfChecked = menuTreeRef.value?.getHalfCheckedKeys() || []
    const allChecked = [...new Set([...menuChecked, ...halfChecked, ...checkedPermIds.value])]
    const res = await saveRolePermissions(permRoleId.value, allChecked)
    if (res.code === 200) {
      ElMessage.success('权限分配成功')
      permVisible.value = false
      loadData()
    }
  } catch {} finally { savingPerm.value = false }
}

onMounted(loadData)
</script>

<style scoped>
.page { max-width: 1400px; }
.toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
</style>
