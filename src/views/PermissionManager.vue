<template>
  <div class="page">
    <el-card shadow="never">
      <div class="toolbar">
        <span class="title-text">系统权限树</span>
        <el-button type="primary" @click="openAdd">
          <el-icon><Plus /></el-icon> 新增权限
        </el-button>
      </div>

      <el-tree
        :data="treeData"
        node-key="id"
        default-expand-all
        :props="{ label: 'name', children: 'children' }"
        style="margin-top:12px"
        v-loading="loading"
      >
        <template #default="{ data }">
          <span class="tree-node">
            <el-tag :type="data.type === 'menu' ? 'primary' : 'warning'" size="small" effect="plain">
              {{ data.type === 'menu' ? '菜单' : '按钮' }}
            </el-tag>
            <span class="node-name">{{ data.name }}</span>
            <span class="node-code">{{ data.code }}</span>
            <span v-if="data.path" class="node-path">{{ data.path }}</span>
          </span>
        </template>
      </el-tree>
    </el-card>

    <!-- 新增权限弹窗 -->
    <el-dialog v-model="dialogVisible" title="新增权限" width="520px" :close-on-click-modal="false" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio value="menu">菜单</el-radio>
            <el-radio value="button">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="父节点">
          <el-tree-select
            v-model="form.parent_id"
            :data="treeSelectData"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            placeholder="不选则为顶级"
            check-strictly
            clearable
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="如：用户管理" />
        </el-form-item>
        <el-form-item label="编码" prop="code">
          <el-input v-model="form.code" placeholder="如：user:menu" />
        </el-form-item>
        <el-form-item label="路由路径" v-if="form.type === 'menu'">
          <el-input v-model="form.path" placeholder="如：/user" />
        </el-form-item>
        <el-form-item label="图标" v-if="form.type === 'menu'">
          <el-input v-model="form.icon" placeholder="Element Plus 图标名，如：User" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" />
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPermissionTree, addPermission } from '@/api/permission.js'

const treeData = ref([])
const treeSelectData = ref([])
const loading = ref(false)

const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const form = reactive({
  type: 'button', parent_id: null, name: '', code: '', path: '', icon: '', sort_order: 0
})
const rules = {
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入编码', trigger: 'blur' }]
}

async function loadData() {
  loading.value = true
  try {
    const res = await getPermissionTree()
    if (res.code === 200) {
      treeData.value = res.data
      // 为 tree-select 准备数据（加入一个虚拟根节点）
      treeSelectData.value = [
        { id: 0, name: '根节点', children: res.data }
      ]
    }
  } catch {} finally { loading.value = false }
}

function openAdd() {
  resetForm()
  dialogVisible.value = true
}

function resetForm() {
  form.type = 'button'
  form.parent_id = null
  form.name = ''
  form.code = ''
  form.path = ''
  form.icon = ''
  form.sort_order = 0
  formRef.value?.clearValidate()
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const res = await addPermission({ ...form })
    if (res.code === 200) {
      ElMessage.success('新增成功')
      dialogVisible.value = false
      loadData()
    }
  } catch {} finally { submitting.value = false }
}

onMounted(loadData)
</script>

<style scoped>
.page { max-width: 1200px; }
.toolbar { display: flex; align-items: center; justify-content: space-between; }
.title-text { font-size: 16px; font-weight: 600; }
.tree-node { display: flex; align-items: center; gap: 10px; font-size: 14px; }
.node-code { color: #999; font-size: 12px; font-family: monospace; }
.node-path { color: #409eff; font-size: 12px; }
</style>
