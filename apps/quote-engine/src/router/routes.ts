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
        path: 'invoices',
        name: 'invoices',
        component: () => import('../pages/InvoicePage.vue'),
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
