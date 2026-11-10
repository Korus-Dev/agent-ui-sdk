import type { SampleApi } from '../shared/api';

declare global { interface Window { sampleApi: SampleApi } }

export const api = window.sampleApi;
