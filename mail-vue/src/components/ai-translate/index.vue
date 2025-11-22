<template>
  <div class="ai-translate">
    <!-- 翻译工具栏 -->
    <div class="translate-toolbar" v-if="showToolbar">
      <div class="toolbar-left">
        <el-select 
          v-model="sourceLang" 
          :placeholder="$t('select')" 
          size="small"
          style="width: 120px"
          @change="onLanguageChange"
        >
          <el-option 
            v-for="lang in languageOptions" 
            :key="lang.code" 
            :label="lang.name" 
            :value="lang.code"
          />
        </el-select>
        
        <el-icon class="switch-icon" @click="switchLanguages">
          <el-icon-switch />
        </el-icon>
        
        <el-select 
          v-model="targetLang" 
          :placeholder="$t('select')" 
          size="small"
          style="width: 120px"
          @change="onLanguageChange"
        >
          <el-option 
            v-for="lang in languageOptions" 
            :key="lang.code" 
            :label="lang.name" 
            :value="lang.code"
          />
        </el-select>
        
        <el-button 
          type="primary" 
          size="small" 
          :loading="isTranslating"
          @click="handleTranslate"
          style="margin-left: 8px"
        >
          {{ $t('translate') }}
        </el-button>
      </div>
      
      <div class="toolbar-right">
        <el-button 
          text 
          size="small"
          @click="showHistory = !showHistory"
        >
          {{ $t('history') }}
        </el-button>
        <el-button 
          text 
          size="small"
          @click="toggleAutoTranslate"
        >
          {{ $t('autoTranslate') }}
          <el-icon class="ml-1" :class="{ 'auto-on': autoTranslate }">
            <el-icon-check />
          </el-icon>
        </el-button>
      </div>
    </div>
    
    <!-- 翻译历史面板 -->
    <div class="translate-history" v-if="showHistory">
      <div class="history-header">
        <h4>{{ $t('translationHistory') }}</h4>
        <el-button text size="small" @click="clearHistory">
          {{ $t('clear') }}
        </el-button>
      </div>
      <div class="history-list">
        <div 
          v-for="item in translationHistory" 
          :key="item.id"
          class="history-item"
          @click="useHistoryTranslation(item)"
        >
          <div class="history-source">{{ item.originalText }}</div>
          <div class="history-target">{{ item.translatedText }}</div>
          <div class="history-meta">
            {{ getLanguageName(item.sourceLang) }} → {{ getLanguageName(item.targetLang) }}
            <span class="history-time">{{ formatTime(item.timestamp) }}</span>
          </div>
        </div>
        <div v-if="translationHistory.length === 0" class="no-history">
          {{ $t('noTranslationHistory') }}
        </div>
      </div>
    </div>
    
    <!-- 翻译结果 -->
    <div class="translate-result" v-if="showResult && translatedText">
      <div class="result-header">
        <span class="result-label">{{ $t('translatedResult') }}</span>
        <el-button text size="small" @click="copyTranslation">
          {{ $t('copy') }}
        </el-button>
      </div>
      <div class="result-content">
        {{ translatedText }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { 
  getSupportedLanguages, 
  translateText, 
  getTranslationHistory 
} from '@/request/ai-translate.js';

const { t } = useI18n();

// Props
const props = defineProps({
  showToolbar: {
    type: Boolean,
    default: true
  },
  autoDetect: {
    type: Boolean,
    default: true
  },
  defaultSourceLang: {
    type: String,
    default: 'auto'
  },
  defaultTargetLang: {
    type: String,
    default: 'en'
  }
});

// Emits
const emit = defineEmits(['translate', 'translated']);

// 响应式数据
const sourceLang = ref(props.defaultSourceLang);
const targetLang = ref(props.defaultTargetLang);
const isTranslating = ref(false);
const showHistory = ref(false);
const autoTranslate = ref(false);
const translatedText = ref('');
const showResult = ref(false);
const translationHistory = ref([]);

const languageOptions = ref([]);

// 计算属性
const canTranslate = computed(() => {
  return sourceLang.value && targetLang.value && sourceLang.value !== targetLang.value;
});

// 方法
const initLanguages = async () => {
  try {
    const response = await getSupportedLanguages();
    if (response.data && response.data.code === 200) {
      languageOptions.value = response.data.data;
    } else {
      // 使用默认语言选项
      languageOptions.value = [
        { code: 'zh', name: '中文' },
        { code: 'en', name: '英语' },
        { code: 'auto', name: t('autoDetect') }
      ];
    }
  } catch (error) {
    console.error('获取语言列表失败:', error);
    languageOptions.value = [
      { code: 'zh', name: '中文' },
      { code: 'en', name: '英语' },
      { code: 'auto', name: t('autoDetect') }
    ];
  }
};

const handleTranslate = async () => {
  if (!canTranslate.value) {
    ElMessage.warning(t('pleaseSelectLanguage'));
    return;
  }

  const text = props.text || emit('getOriginalText');
  if (!text) {
    ElMessage.warning(t('textCannotBeEmpty'));
    return;
  }

  try {
    isTranslating.value = true;
    const response = await translateText(text, targetLang.value, sourceLang.value);
    
    if (response.data && response.data.code === 200) {
      const result = response.data.data;
      translatedText.value = result.translatedText;
      showResult.value = true;
      
      // 缓存翻译历史
      translationHistory.value.unshift({
        id: Date.now(),
        originalText: text,
        translatedText: result.translatedText,
        sourceLang: result.sourceLang,
        targetLang: result.targetLang,
        timestamp: result.timestamp
      });
      
      // 限制历史记录数量
      if (translationHistory.value.length > 20) {
        translationHistory.value = translationHistory.value.slice(0, 20);
      }
      
      emit('translated', result);
      ElMessage.success(t('translateSuccess'));
    } else {
      ElMessage.error(response.data?.message || t('translateFailed'));
    }
  } catch (error) {
    console.error('翻译失败:', error);
    ElMessage.error(t('translateFailed') + ': ' + error.message);
  } finally {
    isTranslating.value = false;
  }
};

const switchLanguages = () => {
  const temp = sourceLang.value;
  sourceLang.value = targetLang.value;
  targetLang.value = temp;
  onLanguageChange();
};

const onLanguageChange = () => {
  if (autoTranslate.value && translatedText.value) {
    handleTranslate();
  }
};

const toggleAutoTranslate = () => {
  autoTranslate.value = !autoTranslate.value;
};

const getLanguageName = (code) => {
  const lang = languageOptions.value.find(l => l.code === code);
  return lang ? lang.name : code;
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

const copyTranslation = async () => {
  if (!translatedText.value) return;
  
  try {
    await navigator.clipboard.writeText(translatedText.value);
    ElMessage.success(t('copySuccess'));
  } catch (error) {
    console.error('复制失败:', error);
    ElMessage.error(t('copyFailed'));
  }
};

const loadTranslationHistory = async () => {
  try {
    const response = await getTranslationHistory();
    if (response.data && response.data.code === 200) {
      translationHistory.value = response.data.data;
    }
  } catch (error) {
    console.error('获取翻译历史失败:', error);
  }
};

const clearHistory = () => {
  translationHistory.value = [];
  ElMessage.success(t('clearSuccess'));
};

const useHistoryTranslation = (item) => {
  translatedText.value = item.translatedText;
  showResult.value = true;
  showHistory.value = false;
};

// 监听器
watch(() => props.text, (newText) => {
  if (autoTranslate.value && newText) {
    handleTranslate();
  }
});

// 生命周期
onMounted(() => {
  initLanguages();
  loadTranslationHistory();
});
</script>

<style scoped lang="scss">
.ai-translate {
  .translate-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    margin-bottom: 12px;
    
    .toolbar-left {
      display: flex;
      align-items: center;
      
      .switch-icon {
        margin: 0 8px;
        cursor: pointer;
        color: var(--el-text-color-secondary);
        font-size: 16px;
        
        &:hover {
          color: var(--el-color-primary);
        }
      }
    }
    
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .auto-on {
        color: var(--el-color-success);
      }
    }
  }
  
  .translate-history {
    background: var(--el-bg-color-page);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
    margin-bottom: 12px;
    
    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      
      h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
      }
    }
    
    .history-list {
      max-height: 200px;
      overflow-y: auto;
      padding: 4px;
      
      .history-item {
        padding: 8px;
        border-radius: 4px;
        cursor: pointer;
        margin-bottom: 4px;
        background: var(--el-bg-color);
        
        &:hover {
          background: var(--el-bg-color-lighter);
        }
        
        .history-source {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          margin-bottom: 4px;
        }
        
        .history-target {
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 4px;
        }
        
        .history-meta {
          font-size: 11px;
          color: var(--el-text-color-placeholder);
          
          .history-time {
            margin-left: 8px;
          }
        }
      }
      
      .no-history {
        text-align: center;
        padding: 20px;
        color: var(--el-text-color-placeholder);
        font-size: 13px;
      }
    }
  }
  
  .translate-result {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
    margin-bottom: 12px;
    
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      
      .result-label {
        font-size: 13px;
        font-weight: 500;
        color: var(--el-text-color-secondary);
      }
    }
    
    .result-content {
      padding: 12px;
      font-size: 14px;
      line-height: 1.5;
      white-space: pre-wrap;
    }
  }
}

:deep(.el-icon) {
  transition: color 0.3s;
}
</style>