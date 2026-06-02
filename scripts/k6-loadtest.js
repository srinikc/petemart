/**
 * k6 Load Test Script — PeteMart API
 *
 * Run: k6 run scripts/k6-loadtest.js
 *
 * Simulates concurrent users hitting key API endpoints.
 * Thresholds: 95% of requests should complete under 500ms.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3458';

const errorRate = new Rate('errors');
const apiTrend = new Trend('api_duration');

export const options = {
  stages: [
    { duration: '10s', target: 5 },
    { duration: '20s', target: 20 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    errors: ['rate<0.1'],
    http_req_duration: ['p(95)<500'],
    api_duration: ['p(95)<300'],
  },
};

export default function () {
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/api/v1/health`);
    check(res, { 'health status 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
    apiTrend.add(res.timings.duration);
    sleep(1);
  });

  group('Public Endpoints', () => {
    const endpoints = ['/api/v1/markets', '/api/v1/merchants', '/api/v1/products'];
    for (const ep of endpoints) {
      const res = http.get(`${BASE_URL}${ep}`);
      check(res, { [`${ep} status 200`]: (r) => r.status === 200 });
      errorRate.add(res.status !== 200);
      apiTrend.add(res.timings.duration);
      sleep(0.5);
    }
  });

  group('Product Search', () => {
    const res = http.get(`${BASE_URL}/api/v1/products?q=silk&page=1&limit=10`);
    check(res, { 'product search 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
    apiTrend.add(res.timings.duration);
    sleep(0.5);
  });

  group('Auth Endpoints', () => {
    const res = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({ phone: '9999999999' }), {
      headers: { 'Content-Type': 'application/json' },
    });
    check(res, { 'auth login responds': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
    apiTrend.add(res.timings.duration);
    sleep(1);
  });

  group('Data Lookups', () => {
    const res = http.get(`${BASE_URL}/api/v1/merchants/tarun-enterprises`);
    check(res, { 'merchant detail 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
    apiTrend.add(res.timings.duration);
    sleep(0.5);
  });
}
