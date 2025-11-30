import type { RouteRecordRaw } from 'vue-router';

/**
 * Application routes
 * 
 * Route meta options:
 * - requiresAuth: boolean - Route requires authenticated user
 * - guestOnly: boolean - Route only accessible to non-authenticated users
 */
const routes: RouteRecordRaw[] = [
  // Auth routes (in AuthLayout - provides QLayout wrapper)
  {
    path: '/login',
    component: () => import('../layouts/AuthLayout.vue'),
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('../pages/LoginPage.vue'),
        meta: { guestOnly: true },
      },
    ],
  },
  {
    path: '/register',
    component: () => import('../layouts/AuthLayout.vue'),
    children: [
      {
        path: '',
        name: 'register',
        component: () => import('../pages/RegisterPage.vue'),
        meta: { guestOnly: true },
      },
    ],
  },

  // Main app routes
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('../pages/IndexPage.vue'),
      },
      {
        path: 'quote',
        name: 'quote',
        component: () => import('../pages/QuotePage.vue'),
      },
      {
        path: 'quotes',
        name: 'savedQuotes',
        component: () => import('../pages/SavedQuotesPage.vue'),
      },
      {
        path: 'clients',
        name: 'clients',
        component: () => import('../pages/ClientsPage.vue'),
      },
      {
        path: 'invoices',
        name: 'invoices',
        component: () => import('../pages/InvoicesPage.vue'),
      },
      {
        path: 'jobs',
        name: 'jobs',
        component: () => import('../pages/JobsPage.vue'),
      },
      {
        path: 'jobs/:id',
        name: 'activeJob',
        component: () => import('../pages/ActiveJobPage.vue'),
        props: true,
      },
      {
        path: 'analytics',
        name: 'analytics',
        component: () => import('../pages/AnalyticsPage.vue'),
      },
      {
        path: 'calendar',
        name: 'calendar',
        component: () => import('../pages/CalendarPage.vue'),
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('../pages/SettingsPage.vue'),
      },
      {
        path: 'admin/pricing',
        name: 'adminPricing',
        component: () => import('../pages/AdminPricingPage.vue'),
      },
    ],
  },

  // Always leave this as last one
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    redirect: '/',
  },
];

export default routes;
