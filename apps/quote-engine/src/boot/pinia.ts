import { boot } from 'quasar/wrappers';
import { createPinia } from 'pinia';

/**
 * Pinia store setup
 * Registers Pinia for state management
 */
export default boot(({ app }) => {
  const pinia = createPinia();
  app.use(pinia);
});
