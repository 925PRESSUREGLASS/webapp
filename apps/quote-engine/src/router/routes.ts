import type { RouteRecordRaw } from 'vue-router';

/**
 * Application routes
 */
const routes: RouteRecordRaw[] = [
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
