<template>
  <q-page class="login-page flex flex-center">
    <q-card class="login-card q-pa-lg" style="min-width: 350px; max-width: 400px;">
      <!-- Logo/Title -->
      <div class="text-center q-mb-lg">
        <q-icon name="calculate" size="48px" color="primary" />
        <h5 class="q-mb-xs q-mt-sm">Quote Engine</h5>
        <p class="text-grey-6">Sign in to your account</p>
      </div>

      <!-- Login Form -->
      <q-form @submit.prevent="handleLogin" class="q-gutter-md">
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
          v-model="password"
          label="Password"
          :type="showPassword ? 'text' : 'password'"
          outlined
          autocomplete="current-password"
          :rules="[val => !!val || 'Password is required']"
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
          label="Sign In"
          class="full-width"
          size="lg"
          :loading="authStore.isLoading"
        />

        <div class="text-center q-mt-md">
          <span class="text-grey-6">Don't have an account?</span>
          <q-btn
            flat
            dense
            color="primary"
            label="Register"
            @click="$router.push('/register')"
          />
        </div>
      </q-form>

      <!-- Divider -->
      <div class="row items-center q-my-lg">
        <div class="col"><q-separator /></div>
        <div class="col-auto q-px-md text-grey-5">or</div>
        <div class="col"><q-separator /></div>
      </div>

      <!-- Continue without account -->
      <q-btn
        outline
        color="grey-7"
        label="Continue without account"
        class="full-width"
        @click="continueAsGuest"
      />
      <p class="text-center text-grey-6 text-caption q-mt-sm">
        Your data stays on this device only
      </p>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useQuasar } from 'quasar';

const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const authStore = useAuthStore();

// Form state
const email = ref('');
const password = ref('');
const showPassword = ref(false);

// Email validation
function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Handle login
async function handleLogin() {
  const success = await authStore.login({
    email: email.value,
    password: password.value,
  });

  if (success) {
    $q.notify({
      type: 'positive',
      message: `Welcome back, ${authStore.userName}!`,
      icon: 'check_circle',
    });

    // Redirect to intended page or home
    const redirect = (route.query.redirect as string) || '/';
    router.push(redirect);
  }
}

// Continue without account
function continueAsGuest() {
  router.push('/');
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--q-primary) 0%, #1a1a2e 100%);
}

.login-card {
  border-radius: 16px;
}

@media (max-width: 400px) {
  .login-card {
    margin: 16px;
    width: 100%;
  }
}
</style>
