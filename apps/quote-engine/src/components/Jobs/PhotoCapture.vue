<template>
  <div class="photo-capture">
    <!-- Photo Preview Grid -->
    <div v-if="photos.length > 0" class="photo-grid q-mb-md">
      <div 
        v-for="(photo, index) in photos" 
        :key="photo.id" 
        class="photo-item"
      >
        <q-img 
          :src="photo.uri" 
          :ratio="1"
          class="rounded-borders"
          @click="viewPhoto(photo)"
        >
          <div class="absolute-bottom-right q-pa-xs">
            <q-btn
              round
              dense
              flat
              icon="delete"
              color="white"
              size="sm"
              @click.stop="removePhoto(index)"
            />
          </div>
          <div class="absolute-bottom text-center text-caption bg-dark q-pa-xs">
            {{ photo.type }}
          </div>
        </q-img>
      </div>
    </div>

    <!-- Capture Buttons -->
    <div class="row q-col-gutter-sm">
      <div class="col-6">
        <q-btn
          outline
          color="primary"
          icon="photo_camera"
          label="Take Photo"
          class="full-width"
          @click="takePhoto"
          :loading="isCapturing"
        />
      </div>
      <div class="col-6">
        <q-btn
          outline
          color="secondary"
          icon="photo_library"
          label="From Gallery"
          class="full-width"
          @click="pickFromGallery"
          :loading="isCapturing"
        />
      </div>
    </div>

    <!-- Photo Type Selector Dialog -->
    <q-dialog v-model="showTypeDialog">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Photo Type</div>
        </q-card-section>
        <q-card-section>
          <q-list>
            <q-item 
              v-for="type in photoTypes" 
              :key="type.value"
              clickable
              v-close-popup
              @click="confirmPhoto(type.value)"
            >
              <q-item-section avatar>
                <q-icon :name="type.icon" :color="type.color" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ type.label }}</q-item-label>
                <q-item-label caption>{{ type.description }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        <q-card-section v-if="pendingImageUri">
          <q-input
            v-model="photoCaption"
            outlined
            dense
            label="Caption (optional)"
            placeholder="Add a description..."
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup @click="cancelPendingPhoto" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Photo Viewer Dialog -->
    <q-dialog v-model="showViewerDialog" maximized>
      <q-card class="bg-black">
        <q-bar class="bg-transparent text-white">
          <q-space />
          <q-btn flat dense icon="close" v-close-popup />
        </q-bar>
        <q-card-section class="flex flex-center" style="height: calc(100vh - 50px)">
          <q-img
            v-if="viewingPhoto"
            :src="viewingPhoto.uri"
            fit="contain"
            style="max-height: 100%; max-width: 100%"
          />
        </q-card-section>
        <q-card-section v-if="viewingPhoto" class="text-white text-center">
          <div class="text-subtitle1">{{ viewingPhoto.type }}</div>
          <div v-if="viewingPhoto.caption" class="text-caption">{{ viewingPhoto.caption }}</div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import type { JobPhoto, JobPhotoType } from '@tictacstick/calculation-engine';

const props = withDefaults(defineProps<{
  modelValue: JobPhoto[];
  maxPhotos?: number;
}>(), {
  maxPhotos: 20,
});

const emit = defineEmits<{
  (e: 'update:modelValue', photos: JobPhoto[]): void;
  (e: 'photo-added', photo: JobPhoto): void;
  (e: 'photo-removed', photo: JobPhoto): void;
}>();

const $q = useQuasar();

const photos = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const isCapturing = ref(false);
const showTypeDialog = ref(false);
const showViewerDialog = ref(false);
const pendingImageUri = ref<string | null>(null);
const photoCaption = ref('');
const viewingPhoto = ref<JobPhoto | null>(null);

const photoTypes: Array<{
  value: JobPhotoType;
  label: string;
  description: string;
  icon: string;
  color: string;
}> = [
  { value: 'before', label: 'Before', description: 'Photo taken before work', icon: 'hourglass_empty', color: 'orange' },
  { value: 'during', label: 'During', description: 'Work in progress', icon: 'autorenew', color: 'blue' },
  { value: 'after', label: 'After', description: 'Photo taken after work', icon: 'hourglass_full', color: 'green' },
  { value: 'issue', label: 'Issue', description: 'Document a problem', icon: 'warning', color: 'red' },
];

async function takePhoto() {
  if (photos.value.length >= props.maxPhotos) {
    $q.notify({
      type: 'warning',
      message: `Maximum ${props.maxPhotos} photos allowed`,
    });
    return;
  }

  isCapturing.value = true;

  try {
    // Check if Capacitor Camera is available
    if (typeof window !== 'undefined' && (window as any).Capacitor?.Plugins?.Camera) {
      const { Camera, CameraResultType, CameraSource } = (window as any).Capacitor.Plugins;
      
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        saveToGallery: true,
      });

      if (image.webPath) {
        pendingImageUri.value = image.webPath;
        showTypeDialog.value = true;
      }
    } else {
      // Fallback for web - use file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      
      input.onchange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            pendingImageUri.value = reader.result as string;
            showTypeDialog.value = true;
          };
          reader.readAsDataURL(file);
        }
      };
      
      input.click();
    }
  } catch (error: any) {
    console.error('Camera error:', error);
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to capture photo',
    });
  } finally {
    isCapturing.value = false;
  }
}

async function pickFromGallery() {
  if (photos.value.length >= props.maxPhotos) {
    $q.notify({
      type: 'warning',
      message: `Maximum ${props.maxPhotos} photos allowed`,
    });
    return;
  }

  isCapturing.value = true;

  try {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.Plugins?.Camera) {
      const { Camera, CameraResultType, CameraSource } = (window as any).Capacitor.Plugins;
      
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
      });

      if (image.webPath) {
        pendingImageUri.value = image.webPath;
        showTypeDialog.value = true;
      }
    } else {
      // Fallback for web
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            pendingImageUri.value = reader.result as string;
            showTypeDialog.value = true;
          };
          reader.readAsDataURL(file);
        }
      };
      
      input.click();
    }
  } catch (error: any) {
    console.error('Gallery error:', error);
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to pick photo',
    });
  } finally {
    isCapturing.value = false;
  }
}

function confirmPhoto(type: JobPhotoType) {
  if (!pendingImageUri.value) return;

  const newPhoto: JobPhoto = {
    id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    uri: pendingImageUri.value,
    type,
    caption: photoCaption.value.trim() || undefined,
    takenAt: new Date().toISOString(),
  };

  const updatedPhotos = [...photos.value, newPhoto];
  emit('update:modelValue', updatedPhotos);
  emit('photo-added', newPhoto);

  // Reset state
  pendingImageUri.value = null;
  photoCaption.value = '';
  showTypeDialog.value = false;

  $q.notify({
    type: 'positive',
    message: 'Photo added',
    icon: 'photo_camera',
  });
}

function cancelPendingPhoto() {
  pendingImageUri.value = null;
  photoCaption.value = '';
}

function removePhoto(index: number) {
  $q.dialog({
    title: 'Remove Photo',
    message: 'Are you sure you want to remove this photo?',
    cancel: true,
    ok: {
      label: 'Remove',
      color: 'negative',
    },
  }).onOk(() => {
    const removedPhoto = photos.value[index];
    const updatedPhotos = photos.value.filter((_, i) => i !== index);
    emit('update:modelValue', updatedPhotos);
    emit('photo-removed', removedPhoto);
  });
}

function viewPhoto(photo: JobPhoto) {
  viewingPhoto.value = photo;
  showViewerDialog.value = true;
}
</script>

<style scoped>
.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
}

@media (min-width: 600px) {
  .photo-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1024px) {
  .photo-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}
</style>
