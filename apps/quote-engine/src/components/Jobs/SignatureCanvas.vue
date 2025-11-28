<template>
  <div class="signature-canvas-wrapper">
    <div class="signature-label text-caption text-grey-7 q-mb-xs">
      {{ label }}
    </div>
    
    <div 
      ref="canvasContainer"
      class="signature-container"
      :class="{ 'has-signature': hasSignature }"
    >
      <canvas
        ref="canvasRef"
        class="signature-canvas"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
        @touchstart.prevent="handleTouchStart"
        @touchmove.prevent="handleTouchMove"
        @touchend="stopDrawing"
      />
      
      <div v-if="!hasSignature" class="signature-placeholder">
        <q-icon name="draw" size="32px" color="grey-5" />
        <div class="text-caption text-grey-6">Sign here</div>
      </div>
    </div>

    <div class="row q-mt-sm q-col-gutter-sm">
      <div class="col">
        <q-btn
          flat
          dense
          icon="refresh"
          label="Clear"
          color="grey-7"
          :disable="!hasSignature"
          @click="clearSignature"
        />
      </div>
      <div class="col-auto" v-if="showSaveButton">
        <q-btn
          unelevated
          dense
          icon="check"
          label="Save"
          color="primary"
          :disable="!hasSignature"
          @click="saveSignature"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';

const props = withDefaults(defineProps<{
  modelValue?: string;
  label?: string;
  lineWidth?: number;
  lineColor?: string;
  backgroundColor?: string;
  showSaveButton?: boolean;
}>(), {
  label: 'Customer Signature',
  lineWidth: 2,
  lineColor: '#000000',
  backgroundColor: '#ffffff',
  showSaveButton: true,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'signed', dataUrl: string): void;
  (e: 'cleared'): void;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const canvasContainer = ref<HTMLElement | null>(null);
const isDrawing = ref(false);
const hasSignature = ref(false);
const ctx = ref<CanvasRenderingContext2D | null>(null);
const lastX = ref(0);
const lastY = ref(0);

let resizeObserver: ResizeObserver | null = null;

function initCanvas() {
  if (!canvasRef.value || !canvasContainer.value) return;
  
  const canvas = canvasRef.value;
  const container = canvasContainer.value;
  
  // Set canvas size to match container
  const rect = container.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  
  ctx.value = canvas.getContext('2d');
  if (ctx.value) {
    ctx.value.strokeStyle = props.lineColor;
    ctx.value.lineWidth = props.lineWidth;
    ctx.value.lineCap = 'round';
    ctx.value.lineJoin = 'round';
    
    // Fill background
    ctx.value.fillStyle = props.backgroundColor;
    ctx.value.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // Load existing signature if provided
  if (props.modelValue) {
    loadSignature(props.modelValue);
  }
}

function loadSignature(dataUrl: string) {
  if (!ctx.value || !canvasRef.value) return;
  
  const img = new Image();
  img.onload = () => {
    if (ctx.value && canvasRef.value) {
      ctx.value.drawImage(img, 0, 0, canvasRef.value.width, canvasRef.value.height);
      hasSignature.value = true;
    }
  };
  img.src = dataUrl;
}

function getCoordinates(event: MouseEvent | Touch): { x: number; y: number } {
  if (!canvasRef.value) return { x: 0, y: 0 };
  
  const rect = canvasRef.value.getBoundingClientRect();
  const scaleX = canvasRef.value.width / rect.width;
  const scaleY = canvasRef.value.height / rect.height;
  
  if ('touches' in event) {
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }
  
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function startDrawing(event: MouseEvent) {
  if (!ctx.value) return;
  
  isDrawing.value = true;
  hasSignature.value = true;
  
  const { x, y } = getCoordinates(event);
  lastX.value = x;
  lastY.value = y;
  
  ctx.value.beginPath();
  ctx.value.moveTo(x, y);
}

function draw(event: MouseEvent) {
  if (!isDrawing.value || !ctx.value) return;
  
  const { x, y } = getCoordinates(event);
  
  ctx.value.lineTo(x, y);
  ctx.value.stroke();
  ctx.value.beginPath();
  ctx.value.moveTo(x, y);
  
  lastX.value = x;
  lastY.value = y;
}

function stopDrawing() {
  if (!ctx.value) return;
  
  isDrawing.value = false;
  ctx.value.beginPath();
  
  // Auto-emit on drawing complete
  if (hasSignature.value) {
    emitSignature();
  }
}

function handleTouchStart(event: TouchEvent) {
  if (!ctx.value || event.touches.length === 0) return;
  
  isDrawing.value = true;
  hasSignature.value = true;
  
  const touch = event.touches[0];
  const { x, y } = getCoordinates(touch);
  lastX.value = x;
  lastY.value = y;
  
  ctx.value.beginPath();
  ctx.value.moveTo(x, y);
}

function handleTouchMove(event: TouchEvent) {
  if (!isDrawing.value || !ctx.value || event.touches.length === 0) return;
  
  const touch = event.touches[0];
  const { x, y } = getCoordinates(touch);
  
  ctx.value.lineTo(x, y);
  ctx.value.stroke();
  ctx.value.beginPath();
  ctx.value.moveTo(x, y);
  
  lastX.value = x;
  lastY.value = y;
}

function clearSignature() {
  if (!ctx.value || !canvasRef.value) return;
  
  ctx.value.fillStyle = props.backgroundColor;
  ctx.value.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  hasSignature.value = false;
  
  emit('update:modelValue', '');
  emit('cleared');
}

function getSignatureDataUrl(): string {
  if (!canvasRef.value) return '';
  return canvasRef.value.toDataURL('image/png');
}

function emitSignature() {
  const dataUrl = getSignatureDataUrl();
  emit('update:modelValue', dataUrl);
}

function saveSignature() {
  if (!hasSignature.value) return;
  
  const dataUrl = getSignatureDataUrl();
  emit('update:modelValue', dataUrl);
  emit('signed', dataUrl);
}

// Watch for modelValue changes
watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue !== getSignatureDataUrl()) {
    loadSignature(newValue);
  } else if (!newValue) {
    clearSignature();
  }
});

onMounted(async () => {
  await nextTick();
  initCanvas();
  
  // Set up resize observer
  if (canvasContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      // Save current signature
      const currentSignature = hasSignature.value ? getSignatureDataUrl() : null;
      
      // Reinitialize canvas
      initCanvas();
      
      // Restore signature if there was one
      if (currentSignature && hasSignature.value) {
        loadSignature(currentSignature);
      }
    });
    resizeObserver.observe(canvasContainer.value);
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

// Expose methods for parent component
defineExpose({
  clear: clearSignature,
  save: saveSignature,
  getDataUrl: getSignatureDataUrl,
  hasSignature: () => hasSignature.value,
});
</script>

<style scoped>
.signature-canvas-wrapper {
  width: 100%;
}

.signature-container {
  position: relative;
  width: 100%;
  height: 150px;
  border: 2px dashed #ccc;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
  cursor: crosshair;
}

.signature-container.has-signature {
  border-style: solid;
  border-color: #1976d2;
}

.signature-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  touch-action: none;
}

.signature-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.has-signature .signature-placeholder {
  display: none;
}
</style>
