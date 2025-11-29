<template>
  <q-page class="register-page flex flex-center">
    <q-card class="register-card q-pa-lg" style="min-width: 350px; max-width: 450px;">
      <!-- Logo/Title -->
      <div class="text-center q-mb-lg">
        <q-icon name="calculate" size="48px" color="primary" />
        <h5 class="q-mb-xs q-mt-sm">Quote Engine</h5>
        <p class="text-grey-6">Create your account</p>
      </div>

      <!-- Registration Form -->
      <q-form @submit.prevent="handleRegister" class="q-gutter-md">
        <q-input
          v-model="name"
          label="Full Name"
          outlined
          autocomplete="name"
          :rules="[val => !!val || 'Name is required']"
        >
          <template v-slot:prepend>
            <q-icon name="person" />
          </template>
        </q-input>

        <q-input
          v-model="email"
          label="Email"
          type="email"
          outlined
          autocomplete="email"
          :rules="[
            val => !!val || 'Email is required',
            val => isValidEmail(val) || 'Invalid email format'
          ]"
        >
          <template v-slot:prepend>
            <q-icon name="email" />
          </template>
        </q-input>

        <q-input
          v-model="phone"
          label="Phone (optional)"
          type="tel"
          outlined
          autocomplete="tel"
        >
          <template v-slot:prepend>
            <q-icon name="phone" />
          </template>
        </q-input>

        <q-input
          v-model="password"
          label="Password"
          :type="showPassword ? 'text' : 'password'"
          outlined
          autocomplete="new-password"
          :rules="[
            val => !!val || 'Password is required',
            val => val.length >= 8 || 'Password must be at least 8 characters'
          ]"
        >
          <template v-slot:prepend>
            <q-icon name="lock" />
          </template>
          <template v-slot:append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>

        <q-input
          v-model="confirmPassword"
          label="Confirm Password"
          :type="showPassword ? 'text' : 'password'"
          outlined
          autocomplete="new-password"
          :rules="[
            val => !!val || 'Please confirm your password',
            val => val === password || 'Passwords do not match'
          ]"
        >
          <template v-slot:prepend>
            <q-icon name="lock_outline" />
          </template>
        </q-input>

        <!-- Organization (optional) -->
        <q-expansion-item
          label="Business Details (optional)"
          icon="business"
          header-class="text-grey-7"
        >
          <q-input
            v-model="organizationName"
            label="Business Name"
            outlined
            class="q-mt-sm"
            hint="Create a business to share data with team members"
          >
            <template v-slot:prepend>
              <q-icon name="store" />
            </template>
          </q-input>
        </q-expansion-item>

        <!-- Error Message -->
        <q-banner v-if="authStore.error" class="bg-negative text-white q-mb-md" rounded>
          <template v-slot:avatar>
            <q-icon name="error" />
          </template>
          {{ authStore.error }}
        </q-banner>

        <q-btn
          type="submit"
          color="primary"
          label="Create Account"
          class="full-width"
          size="lg"
          :loading="authStore.isLoading"
        />

        <div class="text-center q-mt-md">
          <span class="text-grey-6">Already have an account?</span>
          <q-btn
            flat
            dense
            color="primary"
            label="Sign In"
            @click="$router.push('/login')"
          />
        </div>
      </q-form>

      <!-- Terms -->
      <p class="text-center text-grey-6 text-caption q-mt-lg">
        By creating an account, you agree to our
        <a href="#" class="text-primary">Terms of Service</a>
        and
        <a href="#" class="text-primary">Privacy Policy</a>
      </p>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useQuasar } from 'quasar';

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();

// Form state
const name = ref('');
const email = ref('');
const phone = ref('');
const password = ref('');
const confirmPassword = ref('');
const organizationName = ref('');
const showPassword = ref(false);

// Email validation
function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Handle registration
async function handleRegister() {
  if (password.value !== confirmPassword.value) {
    $q.notify({
      type: 'negative',
      message: 'Passwords do not match',
      icon: 'error',
    });
    return;
  }

  const success = await authStore.register({
    email: email.value,
    password: password.value,
    name: name.value || undefined,
    phone: phone.value || undefined,
    organizationName: organizationName.value || undefined,
  });

  if (success) {
    $q.notify({
      type: 'positive',
      message: 'Account created successfully!',
      icon: 'check_circle',
    });

    router.push('/');
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--q-primary) 0%, #1a1a2e 100%);
}

.register-card {
  border-radius: 16px;
}

@media (max-width: 450px) {
  .register-card {
    margin: 16px;
    width: 100%;
  }
}
</style>
