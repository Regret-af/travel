<template>
  <section class="upload-card" :class="[`upload-card-${shape}`, { 'upload-card-disabled': disabled }]">
    <input
      ref="inputRef"
      type="file"
      accept="image/*"
      class="file-input"
      @change="handleFileChange"
    />

    <button class="preview-shell" type="button" :disabled="disabled || uploading" @click="chooseFile">
      <img v-if="modelValue" :src="modelValue" :alt="title" class="preview-image" />
      <div v-else class="preview-placeholder">
        <strong>{{ placeholderTitle }}</strong>
        <p>{{ placeholderDescription }}</p>
      </div>

      <div class="preview-overlay">
        <span>{{ uploading ? '上传中...' : modelValue ? '更换图片' : buttonText }}</span>
      </div>
    </button>

    <div class="upload-copy">
      <p v-if="eyebrow" class="upload-eyebrow">{{ eyebrow }}</p>
      <h3>{{ title }}</h3>
      <p class="upload-description">{{ description }}</p>

      <div class="upload-actions">
        <button
          class="upload-action"
          type="button"
          :disabled="disabled || uploading"
          @click="chooseFile"
        >
          {{ modelValue ? '重新上传' : buttonText }}
        </button>
        <span class="upload-tip">{{ tip }}</span>
      </div>

      <p v-if="errorMessage" class="upload-error">{{ errorMessage }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import 'element-plus/theme-chalk/el-message.css';
import { uploadFile, type UploadBizType, type UploadedFile } from '@/api/files';
import { getApiErrorMessage } from '@/types/api';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    bizType: UploadBizType;
    eyebrow?: string;
    title: string;
    description: string;
    buttonText?: string;
    tip?: string;
    placeholderTitle?: string;
    placeholderDescription?: string;
    shape?: 'landscape' | 'square';
    disabled?: boolean;
  }>(),
  {
    modelValue: '',
    eyebrow: '',
    buttonText: '上传图片',
    tip: '支持常见图片格式',
    placeholderTitle: '选择一张图片',
    placeholderDescription: '上传后会立即显示预览',
    shape: 'landscape',
    disabled: false
  }
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void;
  (event: 'uploaded', payload: UploadedFile): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const errorMessage = ref('');

const chooseFile = () => {
  if (props.disabled || uploading.value) return;
  inputRef.value?.click();
};

const resetInput = () => {
  if (inputRef.value) {
    inputRef.value.value = '';
  }
};

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  errorMessage.value = '';

  if (!file) {
    resetInput();
    return;
  }

  if (!file.type.startsWith('image/')) {
    errorMessage.value = '请选择图片文件后再上传。';
    ElMessage.warning(errorMessage.value);
    resetInput();
    return;
  }

  uploading.value = true;

  try {
    const res = await uploadFile(file, props.bizType);
    emit('update:modelValue', res.data.fileUrl);
    emit('uploaded', res.data);
    ElMessage.success('上传成功');
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error, '图片上传失败，请稍后重试。');
  } finally {
    uploading.value = false;
    resetInput();
  }
};
</script>

<style scoped lang="scss">
.upload-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 22px;
  border-radius: 28px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  border: 1px solid rgba(226, 232, 240, 0.86);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.05);
}

.upload-card-disabled {
  opacity: 0.76;
}

.file-input {
  display: none;
}

.preview-shell {
  position: relative;
  overflow: hidden;
  border: none;
  padding: 0;
  border-radius: 24px;
  background:
    radial-gradient(circle at 22% 18%, rgba(255, 255, 255, 0.88), transparent 20%),
    linear-gradient(140deg, rgba(34, 211, 238, 0.2) 0%, rgba(212, 175, 55, 0.18) 46%, rgba(15, 23, 42, 0.12) 100%);
  cursor: pointer;
}

.upload-card-landscape .preview-shell {
  aspect-ratio: 16 / 10;
}

.upload-card-square .preview-shell {
  aspect-ratio: 1 / 1;
}

.preview-image,
.preview-placeholder {
  width: 100%;
  height: 100%;
}

.preview-image {
  object-fit: cover;
}

.preview-placeholder {
  display: grid;
  place-content: center;
  gap: 8px;
  padding: 20px;
  text-align: center;

  strong {
    color: #111827;
    font-size: var(--font-size-3xl);
    line-height: 1.2;
  }

  p {
    margin: 0;
    color: #64748b;
    font-size: var(--font-size-md);
    line-height: 1.7;
  }
}

.preview-overlay {
  position: absolute;
  inset: auto 16px 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  color: #111827;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.upload-copy h3 {
  margin: 0;
  color: #111827;
  font-size: var(--font-size-6xl);
  line-height: 1.16;
  font-weight: var(--font-weight-title);
}

.upload-eyebrow {
  margin: 0;
  color: #c79b1d;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
}

.upload-eyebrow + h3 {
  margin-top: 10px;
}

.upload-description,
.upload-tip,
.upload-error {
  color: #64748b;
  font-size: var(--font-size-md);
  line-height: 1.75;
}

.upload-description {
  margin: 12px 0 0;
}

.upload-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 14px;
  margin-top: 18px;
}

.upload-action {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid rgba(212, 175, 55, 0.24);
  background: #111827;
  color: #f8fafc;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    background 0.25s ease,
    color 0.25s ease,
    box-shadow 0.25s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: rgba(212, 175, 55, 0.45);
    background: #9a7313;
    color: #111827;
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.upload-error {
  margin: 12px 0 0;
  color: #b91c1c;
}

@media (max-width: 767px) {
  .upload-card {
    padding: 18px;
    border-radius: 22px;
  }

  .preview-shell {
    border-radius: 20px;
  }

  .upload-copy h3 {
    font-size: var(--font-size-4xl);
  }
}
</style>
