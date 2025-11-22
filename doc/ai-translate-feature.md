# AI翻译功能使用指南

## 功能概述

本项目新增了AI翻译功能，支持多种语言的实时翻译，可以帮助用户在邮件编写和阅读过程中进行语言转换。

## 功能特性

### 1. 支持的语言
- 中文 (zh)
- 英语 (en)
- 西班牙语 (es)
- 法语 (fr)
- 德语 (de)
- 日语 (ja)
- 韩语 (ko)
- 俄语 (ru)
- 葡萄牙语 (pt)
- 意大利语 (it)

### 2. 主要功能
- **实时翻译**: 支持文本的实时翻译
- **自动检测**: 自动检测源语言
- **翻译历史**: 保存翻译历史记录
- **批量翻译**: 支持批量文本翻译
- **邮件翻译**: 专门的邮件内容翻译功能

## 使用方法

### 1. 在邮件编辑器中使用翻译

当您在编写邮件时，可以在邮件编辑器的邮件主题下方看到翻译工具栏：

1. **选择语言**: 在源语言和目标语言下拉框中选择需要的语言
2. **自动检测**: 源语言可以选择"自动检测"，系统会自动识别文本语言
3. **翻译**: 点击"翻译"按钮进行翻译
4. **自动翻译**: 开启"自动翻译"功能，修改语言后会自动翻译
5. **使用历史**: 点击"历史"按钮查看和使用之前的翻译记录

### 2. 在邮件内容查看页面使用翻译

在查看邮件内容时，翻译组件会显示在邮件标题下方：

1. **翻译邮件内容**: 系统会自动使用邮件正文作为翻译源
2. **选择目标语言**: 选择您希望翻译成的目标语言
3. **查看翻译结果**: 翻译完成后会在组件中显示结果

### 3. 查看翻译历史

访问 `/ai-translate-history` 页面可以查看所有翻译历史：

1. **搜索历史**: 可以按文本内容、源语言、目标语言搜索
2. **日期筛选**: 支持按日期范围筛选翻译记录
3. **统计数据**: 显示总翻译次数、今日翻译次数、使用语言数等统计信息
4. **导出历史**: 支持将翻译历史导出为CSV文件
5. **清空历史**: 可以清空所有翻译历史记录

## API接口

### 后端API

#### 1. 获取支持的语言列表
```http
GET /api/ai-translate/languages
```

#### 2. 翻译文本
```http
POST /api/ai-translate/text
Content-Type: application/json

{
  "text": "需要翻译的文本",
  "targetLang": "en",
  "sourceLang": "zh"
}
```

#### 3. 批量翻译
```http
POST /api/ai-translate/batch
Content-Type: application/json

{
  "texts": ["文本1", "文本2"],
  "targetLang": "en",
  "sourceLang": "zh"
}
```

#### 4. 翻译邮件
```http
POST /api/ai-translate/email
Content-Type: application/json

{
  "subject": "邮件主题",
  "content": "邮件内容",
  "targetLang": "en",
  "sourceLang": "zh"
}
```

#### 5. 获取翻译历史
```http
GET /api/ai-translate/history?limit=50
```

### 前端请求函数

```javascript
import { 
  getSupportedLanguages, 
  translateText, 
  translateBatch, 
  translateEmail, 
  getTranslationHistory 
} from '@/request/ai-translate.js';

// 获取支持的语言
const languages = await getSupportedLanguages();

// 翻译文本
const result = await translateText('你好', 'en', 'zh');

// 批量翻译
const results = await translateBatch(['你好', '谢谢'], 'en', 'zh');

// 翻译邮件
const emailResult = await translateEmail('主题', '内容', 'en', 'zh');

// 获取翻译历史
const history = await getTranslationHistory(50);
```

## 组件使用

### AI翻译组件

```vue
<template>
  <ai-translate 
    :text="content"
    :default-target-lang="'en'"
    @translate="onTranslate"
    @translated="onTranslated"
  />
</template>

<script setup>
import aiTranslate from '@/components/ai-translate/index.vue'

const onTranslate = () => {
  // 翻译开始时的处理
}

const onTranslated = (result) => {
  // 翻译完成后的处理
  console.log(result.translatedText)
}
</script>
```

## 配置说明

### 组件属性

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| showToolbar | Boolean | true | 是否显示工具栏 |
| autoDetect | Boolean | true | 是否自动检测语言 |
| defaultSourceLang | String | 'auto' | 默认源语言 |
| defaultTargetLang | String | 'en' | 默认目标语言 |

### 组件事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| translate | - | 开始翻译时触发 |
| translated | result | 翻译完成时触发，返回翻译结果 |
| getOriginalText | - | 当需要获取原文时触发（用于自定义获取原文的逻辑） |

## 注意事项

1. **翻译质量**: 当前版本使用模拟翻译逻辑，实际项目中需要集成真实的翻译API
2. **语言支持**: 支持的语言列表可以根据需要扩展
3. **历史记录**: 翻译历史保存在KV存储中，有过期时间限制
4. **性能考虑**: 大量文本翻译可能需要考虑分页或分批处理

## 扩展建议

1. **集成真实翻译API**: 可以集成Google Translate、DeepL等第三方翻译服务
2. **翻译缓存**: 实现翻译结果缓存，避免重复翻译相同内容
3. **翻译质量评分**: 添加用户对翻译质量的评分功能
4. **专业术语库**: 支持自定义专业术语翻译规则
5. **语音翻译**: 未来可以考虑添加语音输入和输出功能

## 测试方法

1. 启动前端开发服务器：`npm run dev`
2. 启动后端开发服务器：`npm run start`
3. 访问邮件编辑页面，测试翻译功能
4. 访问翻译历史页面，测试历史记录功能
5. 测试不同语言组合的翻译效果