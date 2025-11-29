import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router';
import routes from './routes';
import { useAuthStore } from '../stores/auth';

/**
 * Vue Router configuration
 */
const createHistory = process.env.SERVER
  ? createMemoryHistory
  : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);

const router = createRouter({
  scrollBehavior: () => ({ left: 0, top: 0 }),
  routes,
  history: createHistory(process.env.VUE_ROUTER_BASE),
});

/**
 * Navigation guards for authentication
 */
router.beforeEach((to, from, next) => {
  // Lazy-load auth store to avoid circular dependency issues
  const authStore = useAuthStore();

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login with return URL
    next({
      name: 'login',
      query: { redirect: to.fullPath },
    });
    return;
  }

  // Check if route is for guests only (login/register)
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    // Already logged in, redirect to home
    next({ name: 'home' });
    return;
  }

  next();
});

export default router;
