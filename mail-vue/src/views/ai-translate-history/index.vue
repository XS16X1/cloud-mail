<template>
  <div class="ai-translate-history">
    <div class="history-header">
      <h2>{{ $t('translationHistory') }}</h2>
      <div class="header-actions">
        <el-button 
          type="primary" 
          :icon="DocumentCopy" 
          @click="exportHistory"
        >
          {{ $t('export') }}
        </el-button>
        <el-button 
          type="danger" 
          :icon="Delete" 
          @click="clearAllHistory"
        >
          {{ $t('clearAll') }}
        </el-button>
      </div>
    </div>
    
    <div class="history-filters">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-input 
            v-model="searchText" 
            :placeholder="$t('searchHistory')"
            clearable
            @input="filterHistory"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select 
            v-model="sourceLangFilter" 
            :placeholder="$t('sourceLanguage')"
            clearable
            @change="filterHistory"
          >
            <el-option 
              v-for="lang in languageOptions" 
              :key="lang.code" 
              :label="lang.name" 
              :value="lang.code"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select 
            v-model="targetLangFilter" 
            :placeholder="$t('targetLanguage')"
            clearable
            @change="filterHistory"
          >
            <el-option 
              v-for="lang in languageOptions" 
              :key="lang.code" 
              :label="lang.name" 
              :value="lang.code"
            />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="filterHistory"
          />
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="refreshHistory">
            {{ $t('refresh') }}
          </el-button>
        </el-col>
      </el-row>
    </div>
    
    <div class="history-stats">
      <el-card shadow="never">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">{{ stats.total }}</div>
            <div class="stat-label">{{ $t('totalTranslations') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ stats.today }}</div>
            <div class="stat-label">{{ $t('todayTranslations') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ stats.languages.length }}</div>
            <div class="stat-label">{{ $t('languagesUsed') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ stats.avgResponseTime }}ms</div>
            <div class="stat-label">{{ $t('avgResponseTime') }}</div>
          </div>
        </div>
      </el-card>
    </div>
    
    <div class="history-list">
      <el-table 
        :data="filteredHistory" 
        style="width: 100%"
        v-loading="loading"
        empty-text="暂无翻译历史"
      >
        <el-table-column prop="timestamp" :label="$t('time')" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column prop="sourceLang" :label="$t('sourceLanguage')" width="120">
          <template #default="scope">
            {{ getLanguageName(scope.row.sourceLang) }}
          </template>
        </el-table-column>
        <el-table-column prop="targetLang" :label="$t('targetLanguage')" width="120">
          <template #default="scope">
            {{ getLanguageName(scope.row.targetLang) }}
          </template>
        </el-table-column>
        <el-table-column prop="originalText" :label="$t('originalText')" min-width="200">
          <template #default="scope">
            <el-tooltip 
              :content="scope.row.originalText" 
              placement="top"
              :disabled="scope.row.originalText.length <= 50"
            >
              <span>{{ scope.row.originalText.length > 50 ? scope.row.originalText.substring(0, 50) + '...' : scope.row.originalText }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="translatedText" :label="$t('translatedText')" min-width="200">
          <template #default="scope">
            <el-tooltip 
              :content="scope.row.translatedText" 
              placement="top"
              :disabled="scope.row.translatedText.length <= 50"
            >
              <span>{{ scope.row.translatedText.length > 50 ? scope.row.translatedText.substring(0, 50) + '...' : scope.row.translatedText }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column :label="$t('actions')" width="150" fixed="right">
          <template #default="scope">
            <el-button 
              size="small" 
              type="primary" 
              @click="useHistoryTranslation(scope.row)"
            >
              {{ $t('use') }}
            </el-button>
            <el-button 
              size="small" 
              @click="copyTranslation(scope.row)"
            >
              {{ $t('copy') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="filteredHistory.length"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; justify-content: center"
      />
    </div>
    
    <!-- 翻译详情弹窗 -->
    <el-dialog 
      v-model="showDetailDialog" 
      :title="$t('translationDetail')" 
      width="60%"
      :before-close="closeDetailDialog"
    >
      <div class="translation-detail">
        <div class="detail-item">
          <label>{{ $t('time') }}:</label>
          <span>{{ formatDate(selectedHistory?.timestamp) }}</span>
        </div>
        <div class="detail-item">
          <label>{{ $t('sourceLanguage') }}:</label>
          <span>{{ getLanguageName(selectedHistory?.sourceLang) }}</span>
        </div>
        <div class="detail-item">
          <label>{{ $t('targetLanguage') }}:</label>
          <span>{{ getLanguageName(selectedHistory?.targetLang) }}</span>
        </div>
        <div class="detail-item">
          <label>{{ $t('originalText') }}:</label>
          <div class="detail-content">{{ selectedHistory?.originalText }}</div>
        </div>
        <div class="detail-item">
          <label>{{ $t('translatedText') }}:</label>
          <div class="detail-content">{{ selectedHistory?.translatedText }}</div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDetailDialog">{{ $t('cancel') }}</el-button>
          <el-button type="primary" @click="useHistoryTranslation(selectedHistory)">
            {{ $t('use') }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { 
  getTranslationHistory,
  getSupportedLanguages 
} from '@/request/ai-translate.js';
import { Search, DocumentCopy, Delete } from '@element-plus/icons-vue';

const { t } = useI18n();

// 响应式数据
const loading = ref(false);
const historyList = ref([]);
const filteredHistory = ref([]);
const searchText = ref('');
const sourceLangFilter = ref('');
const targetLangFilter = ref('');
const dateRange = ref([]);
const currentPage = ref(1);
const pageSize = ref(20);
const showDetailDialog = ref(false);
const selectedHistory = ref(null);

const languageOptions = ref([]);
const stats = reactive({
  total: 0,
  today: 0,
  languages: [],
  avgResponseTime: 0
});

// 计算属性
const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredHistory.value.slice(start, end);
});

// 方法
const initLanguages = async () => {
  try {
    const response = await getSupportedLanguages();
    if (response.data && response.data.code === 200) {
      languageOptions.value = response.data.data;
    } else {
      languageOptions.value = [
        { code: 'zh', name: '中文' },
        { code: 'en', name: '英语' }
      ];
    }
  } catch (error) {
    console.error('获取语言列表失败:', error);
    languageOptions.value = [
      { code: 'zh', name: '中文' },
      { code: 'en', name: '英语' }
    ];
  }
};

const loadHistory = async () => {
  loading.value = true;
  try {
    const response = await getTranslationHistory(1000); // 获取最近1000条
    if (response.data && response.data.code === 200) {
      historyList.value = response.data.data || [];
      filterHistory();
      calculateStats();
    } else {
      historyList.value = [];
      filteredHistory.value = [];
    }
  } catch (error) {
    console.error('获取翻译历史失败:', error);
    historyList.value = [];
    filteredHistory.value = [];
  } finally {
    loading.value = false;
  }
};

const filterHistory = () => {
  let filtered = [...historyList.value];
  
  // 按文本搜索过滤
  if (searchText.value) {
    const searchLower = searchText.value.toLowerCase();
    filtered = filtered.filter(item => 
      item.originalText.toLowerCase().includes(searchLower) ||
      item.translatedText.toLowerCase().includes(searchLower)
    );
  }
  
  // 按源语言过滤
  if (sourceLangFilter.value) {
    filtered = filtered.filter(item => item.sourceLang === sourceLangFilter.value);
  }
  
  // 按目标语言过滤
  if (targetLangFilter.value) {
    filtered = filtered.filter(item => item.targetLang === targetLangFilter.value);
  }
  
  // 按日期范围过滤
  if (dateRange.value && dateRange.value.length === 2) {
    const [startDate, endDate] = dateRange.value;
    filtered = filtered.filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }
  
  filteredHistory.value = filtered;
  currentPage.value = 1;
};

const calculateStats = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayHistory = historyList.value.filter(item => {
    const itemDate = new Date(item.timestamp);
    return itemDate >= today;
  });
  
  const languageMap = {};
  historyList.value.forEach(item => {
    const key = `${item.sourceLang}-${item.targetLang}`;
    languageMap[key] = (languageMap[key] || 0) + 1;
  });
  
  stats.total = historyList.value.length;
  stats.today = todayHistory.length;
  stats.languages = Object.keys(languageMap);
  stats.avgResponseTime = Math.round(historyList.value.reduce((sum, item) => sum + (item.responseTime || 100), 0) / Math.max(historyList.value.length, 1));
};

const getLanguageName = (code) => {
  const lang = languageOptions.value.find(l => l.code === code);
  return lang ? lang.name : code;
};

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

const useHistoryTranslation = (item) => {
  // 复制翻译结果到剪贴板
  navigator.clipboard.writeText(item.translatedText).then(() => {
    ElMessage.success(t('translationCopied'));
  }).catch(() => {
    ElMessage.error(t('copyFailed'));
  });
};

const copyTranslation = (item) => {
  navigator.clipboard.writeText(item.translatedText).then(() => {
    ElMessage.success(t('copySuccess'));
  }).catch(() => {
    ElMessage.error(t('copyFailed'));
  });
};

const showTranslationDetail = (item) => {
  selectedHistory.value = item;
  showDetailDialog.value = true;
};

const closeDetailDialog = () => {
  showDetailDialog.value = false;
  selectedHistory.value = null;
};

const exportHistory = () => {
  if (filteredHistory.value.length === 0) {
    ElMessage.warning(t('noHistoryToExport'));
    return;
  }
  
  const csvContent = [
    ['时间', '源语言', '目标语言', '原文', '译文'],
    ...filteredHistory.value.map(item => [
      formatDate(item.timestamp),
      getLanguageName(item.sourceLang),
      getLanguageName(item.targetLang),
      `"${item.originalText.replace(/"/g, '""')}"`,
      `"${item.translatedText.replace(/"/g, '""')}"`,
    ])
  ].map(row => row.join(',')).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `translation-history-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  ElMessage.success(t('exportSuccess'));
};

const clearAllHistory = () => {
  ElMessageBox.confirm(
    t('clearAllHistoryConfirm'),
    t('warning'),
    {
      confirmButtonText: t('confirm'),
      cancelButtonText: t('cancel'),
      type: 'warning'
    }
  ).then(() => {
    // 这里应该调用清空历史的API
    historyList.value = [];
    filteredHistory.value = [];
    calculateStats();
    ElMessage.success(t('clearSuccess'));
  }).catch(() => {
    // 用户取消
  });
};

const refreshHistory = () => {
  loadHistory();
};

const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleCurrentChange = (page) => {
  currentPage.value = page;
};

// 生命周期
onMounted(() => {
  initLanguages();
  loadHistory();
});
</script>

<style scoped lang="scss">
.ai-translate-history {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  
  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
    
    .header-actions {
      display: flex;
      gap: 12px;
    }
  }
  
  .history-filters {
    margin-bottom: 20px;
  }
  
  .history-stats {
    margin-bottom: 20px;
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      
      .stat-item {
        text-align: center;
        
        .stat-number {
          font-size: 32px;
          font-weight: bold;
          color: var(--el-color-primary);
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 14px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }
  
  .history-list {
    background: var(--el-bg-color);
    border-radius: 8px;
    overflow: hidden;
    
    :deep(.el-table) {
      border-radius: 8px;
    }
  }
  
  .translation-detail {
    .detail-item {
      margin-bottom: 16px;
      
      label {
        display: inline-block;
        width: 120px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }
      
      .detail-content {
        padding: 12px;
        background: var(--el-bg-color-page);
        border-radius: 4px;
        border: 1px solid var(--el-border-color-lighter);
        white-space: pre-wrap;
        word-break: break-word;
        min-height: 60px;
      }
    }
  }
}
</style>