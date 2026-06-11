<template>
  <div class="page">
    <el-card shadow="never">
      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键字">
          <el-input v-model="searchForm.keyword" placeholder="操作人/目标/详情" clearable style="width:200px" />
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="searchForm.action" placeholder="全部" clearable style="width:140px">
            <el-option v-for="a in actionList" :key="a" :label="a" :value="a" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width:260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="操作人" width="120" />
        <el-table-column prop="action" label="操作类型" width="140">
          <template #default="{ row }">
            <el-tag :type="actionTag(row.action)" size="small">{{ row.action }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target" label="操作目标" width="160" />
        <el-table-column prop="detail" label="详情" min-width="220" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP" width="140" />
        <el-table-column prop="created_at" label="时间" width="170" sortable />
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[15, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @change="loadData"
          background
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getLogList, getLogActions } from '@/api/log.js'

const tableData = ref([])
const loading = ref(false)
const actionList = ref([])
const dateRange = ref([])

const searchForm = reactive({ keyword: '', action: '' })
const pagination = reactive({ page: 1, pageSize: 15, total: 0 })

function actionTag(action) {
  const map = { '登录': 'success', '登出': 'info', '新增用户': 'primary', '编辑用户': 'warning', '删除用户': 'danger',
    '批量删除用户': 'danger', '新增角色': 'primary', '编辑角色': 'warning', '删除角色': 'danger',
    '分配权限': 'success', '新增权限': 'primary' }
  return map[action] || 'info'
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      action: searchForm.action
    }
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await getLogList(params)
    if (res.code === 200) {
      tableData.value = res.data.list
      pagination.total = res.data.total
    }
  } catch {} finally { loading.value = false }
}

async function loadActions() {
  const res = await getLogActions()
  if (res.code === 200) actionList.value = res.data
}

function handleSearch() {
  pagination.page = 1
  loadData()
}

function resetSearch() {
  searchForm.keyword = ''
  searchForm.action = ''
  dateRange.value = []
  handleSearch()
}

onMounted(() => {
  loadData()
  loadActions()
})
</script>

<style scoped>
.page { max-width: 1400px; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
