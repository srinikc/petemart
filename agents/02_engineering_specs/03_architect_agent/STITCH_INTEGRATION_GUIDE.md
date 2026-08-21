# PeteMart — UI-API-DB Integration Patterns (Stitch Guide)

> **Document Version:** 2.0  
> **Purpose:** Define the complete integration patterns connecting the UI layer (Web + Mobile) → API Layer → Database Layer for the PeteMart platform. Covers data flow, API consumption patterns, state synchronization, error handling, and caching strategies.

---

## 1. Integration Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        UI LAYER                                     │
│  ┌──────────────────────┐    ┌──────────────────────────────────┐  │
│  │   Next.js Web App    │    │   React Native Mobile App       │  │
│  │   (SSR + ISR + PWA)  │    │   (Offline + Push + GPS)       │  │
│  └──────────┬───────────┘    └──────────────┬───────────────────┘  │
│             │                               │                        │
│             ▼                               ▼                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              API CLIENT LAYER                                │  │
│  │  • TanStack Query (React Query) — Server State Manager      │  │
│  │  • Axios / Apollo Client — HTTP Client                      │  │
│  │  • WebSocket — Real-time (delivery tracking)                │  │
│  │  • Service Worker — Offline cache + Sync                    │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
│                             │                                        │
└─────────────────────────────┼────────────────────────────────────────┘
                              │ HTTPS / WSS
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API LAYER                                      │
│  ┌────────────────────────────────────────────┐                    │
│  │  CloudFront CDN + WAF + Global Accelerator │                    │
│  └─────────────────────┬──────────────────────┘                    │
│                        │                                            │
│                        ▼                                            │
│  ┌────────────────────────────────────────────┐                    │
│  │         Kong API Gateway                   │                    │
│  │  • Rate Limit • Auth • Routing • Throttle  │                    │
│  └──────────┬──────────────────────┬──────────┘                    │
│             │                      │                                │
│      ┌──────▼──────┐       ┌──────▼──────┐                         │
│      │  REST APIs  │       │   GraphQL   │                         │
│      │  /v1/*      │       │   /graphql  │                         │
│      └──────┬──────┘       └──────┬──────┘                         │
│             │                      │                                │
│             └──────────┬──────────┘                                │
│                        │                                            │
│                        ▼                                            │
│              ┌──────────────────┐                                  │
│              │  Microservices   │                                  │
│              │  16 Services     │                                  │
│              └────────┬─────────┘                                  │
│                       │                                            │
└───────────────────────┼────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                     │
│  ┌────────┐  ┌────────┐  ┌──────────┐  ┌─────────┐  ┌─────────┐  │
│  │Aurora  │  │ Redis  │  │Elastic-  │  │ S3 Blob│  │RabbitMQ │  │
│  │Postgres│  │ Cache  │  │search    │  │Storage │  │ + Kafka │  │
│  └────────┘  └────────┘  └──────────┘  └─────────┘  └─────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. UI → API Integration Patterns

### 2.1 API Client Configuration

```typescript
// api/client.ts — Shared API Client Configuration
import axios, { AxiosInstance, AxiosError } from 'axios';
import { getSession, refreshSession, logout } from '@/lib/auth';

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.petemart.com/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT
apiClient.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

// Response Interceptor: Handle 401 → Refresh Token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newSession = await refreshSession();
        originalRequest.headers.Authorization = `Bearer ${newSession.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        await logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 2.2 GraphQL Client (Apollo)

```typescript
// api/graphql-client.ts
import { ApolloClient, InMemoryCache, createHttpLink, from, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { getSession } from '@/lib/auth';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'https://api.petemart.com/graphql',
});

const authLink = setContext(async (_, { headers }) => {
  const session = await getSession();
  return {
    headers: {
      ...headers,
      authorization: session?.accessToken ? `Bearer ${session.accessToken}` : '',
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`[GraphQL error]: ${message}`, locations, path);
    });
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// WebSocket link for real-time subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: process.env.NEXT_PUBLIC_WS_URL || 'wss://api.petemart.com/graphql',
    connectionParams: async () => {
      const session = await getSession();
      return { authToken: session?.accessToken };
    },
  })
);

// Split: Use WS for subscriptions, HTTP for queries/mutations
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  from([errorLink, authLink.concat(httpLink)])
);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          products: {
            keyArgs: ['filters'],
            merge(existing, incoming) {
              return {
                ...incoming,
                edges: [...(existing?.edges || []), ...incoming.edges],
              };
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
  },
});
```

### 2.3 Server State Management (TanStack Query)

```typescript
// hooks/useProducts.ts — Example Query Hook
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';

// === QUERIES ===

// Fetch products with pagination
export function useProducts(filters: ProductFilters) {
  return useInfiniteQuery({
    queryKey: ['products', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get('/products', {
        params: { ...filters, page: pageParam, limit: 20 },
      });
      return data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fetch single product (with cache-first for fast navigation)
export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/products/${id}`);
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: () => {
      // Use cached data from list query as placeholder
      const queryClient = useQueryClient();
      const cached = queryClient.getQueryData(['products']);
      const product = cached?.pages
        ?.flatMap((p: any) => p.data)
        ?.find((p: any) => p.id === id);
      return product;
    },
  });
}

// === MUTATIONS ===

// Add to cart with optimistic update
export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, variantId, quantity }: AddToCartInput) => {
      const { data } = await apiClient.post('/cart/items', {
        productId, variantId, quantity,
      });
      return data;
    },
    // Optimistic update
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData(['cart']);
      queryClient.setQueryData(['cart'], (old: any) => ({
        ...old,
        items: [...(old?.items || []), { ...newItem, quantity: newItem.quantity }],
      }));
      return { previousCart };
    },
    onError: (err, newItem, context) => {
      // Rollback on error
      queryClient.setQueryData(['cart'], context?.previousCart);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

// Place order
export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: CreateOrderInput) => {
      const { data } = await apiClient.post('/orders', orderData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
```

---

## 3. Core UI → API Patterns (By Feature)

### 3.1 Product Browse & Search

```
[UI Component]            [API Client]           [Backend]          [Data Source]
─────────────            ───────────            ─────────          ───────────
ProductList               useProducts(filters)   GET /v1/products   PostgreSQL
  ├── Category filter     → queryKey: ['products', filters]         + Redis cache
  ├── Price range         → staleTime: 5min                         + Elasticsearch
  ├── Search input        → cursor pagination
  └── Sort by             → getNextPageParam

SearchBar                 useSearch(query)       GET /v1/search     Elasticsearch
  ├── Debounce 300ms      → queryKey: ['search', query]             + PostgreSQL
  ├── Suggestions         → staleTime: 1min
  └── Results grid        → keepPreviousData
```

**Data Flow:**
```
User types → Debounce 300ms → GET /v1/search?q=silk → CDN (miss) → API Gateway → SearchService → Elasticsearch
  → Response cached in TanStack Query (1min) + Redis (5min) + CDN (60s stale-while-revalidate)
  → UI renders with cached data instantly on next search
```

### 3.2 Cart Operations

```
[UI Component]            [API Client]           [Backend]          [Data Source]
─────────────            ───────────            ─────────          ───────────
CartPage                  useQuery('cart')       GET /v1/cart       PostgreSQL
  ├── Items list          → staleTime: 0 (always fresh)             + Redis session
  ├── Quantity adjust     useAddToCart()         POST /v1/cart/items
  ├── Remove item         useRemoveFromCart()    DELETE /v1/cart/items/:id
  └── Price summary       useApplyCoupon()       POST /v1/cart/coupon
```

**Optimistic Update Pattern:**
```
User clicks "+" → Immediate UI update (optimistic)
  → POST /v1/cart/items { quantity: newQty }
  → On success: TanStack Query invalidates 'cart'
  → On error: Rollback to previous UI state
  → Submit analytics event: 'cart_item_updated'
```

### 3.3 Order Placement

```
[UI Component]            [API Client]           [Backend]          [Data Source]
─────────────            ───────────            ─────────          ───────────
CheckoutPage              usePlaceOrder()        POST /v1/orders    PostgreSQL
  ├── Address select      → mutationFn                          + Redis (idempotency)
  ├── Delivery options    → idempotencyKey: uuid               + RabbitMQ event
  ├── Payment method      → retry: 3 (exponential)
  └── Place order btn     → onSuccess → redirect /orders/:id
```

**Idempotency Flow:**
```
Client generates `idempotencyKey: uuid`
  → POST /v1/orders { ..., idempotencyKey }
  → Order service checks Redis key `idempotency:{key}`
  → If exists: return cached response (prevents duplicate order)
  → If new: process order, store key in Redis (TTL: 24h)
  → Publish `order.placed` to RabbitMQ
  → Return order confirmation
```

### 3.4 Real-time Delivery Tracking

```
[UI Component]            [WebSocket]            [Backend]          [Data Source]
─────────────            ───────────            ─────────          ───────────
TrackingPage              GraphQL Subscription   wss://api/graphql  PostgreSQL
  ├── Map view            subscription deliveryStatus(orderId)      + Redis (geo cache)
  ├── Status timeline     → onNext: update position, ETA           + Kafka (geo events)
  ├── ETA display         → onError: reconnect (3s backoff)
  └── Contact driver      → onComplete: delivery done
```

**WebSocket Reconnection Strategy:**
```typescript
// WebSocket reconnection with exponential backoff
const wsLink = new GraphQLWsLink(
  createClient({
    url: 'wss://api.petemart.com/graphql',
    retryAttempts: 10,
    shouldRetry: () => true,
    on: {
      connected: () => console.log('WS connected'),
      closed: (event) => {
        if (event.code === 1000) return; // Normal close
        // Auto-reconnect with backoff
      },
    },
  })
);
```

---

## 4. API → Service Integration Patterns

### 4.1 Inter-Service Communication (gRPC)

```protobuf
// proto/order.proto
service OrderService {
  rpc CreateOrder(CreateOrderRequest) returns (OrderResponse);
  rpc GetOrder(GetOrderRequest) returns (OrderResponse);
  rpc UpdateOrderStatus(UpdateStatusRequest) returns (OrderResponse);
}

service InventoryService {
  rpc ReserveStock(ReserveRequest) returns (ReserveResponse);
  rpc ReleaseStock(ReleaseRequest) returns (ReleaseResponse);
}

service PaymentService {
  rpc ProcessPayment(PaymentRequest) returns (PaymentResponse);
  rpc ProcessRefund(RefundRequest) returns (RefundResponse);
}
```

**Order Creation Flow (Service Orchestration):**
```
OrderService receives HTTP request
  → gRPC call to InventoryService: ReserveStock
  → gRPC call to PaymentService: ProcessPayment
  → DB transaction: Create order + order items
  → Publish event: order.placed (RabbitMQ)
  → Return response to API Gateway
```

### 4.2 Event-Driven Integration (RabbitMQ)

```typescript
// events/publisher.ts — Event Publisher
import { Channel, Connection } from 'amqplib';

export class EventPublisher {
  private channel: Channel;

  async publish(event: string, payload: object): Promise<void> {
    await this.channel.assertExchange('petemart', 'topic', { durable: true });

    this.channel.publish(
      'petemart',
      event,
      Buffer.from(JSON.stringify({
        event,
        payload,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '2.0',
          correlationId: crypto.randomUUID(),
        },
      })),
      { persistent: true, contentType: 'application/json' }
    );
  }
}

// Usage: After order creation
await publisher.publish('order.placed', {
  orderId: 'PM-20241201-001',
  merchantId: 'M-123',
  amount: 1500,
  items: [{ productId: 'P-456', quantity: 2 }],
});
```

```typescript
// events/consumer.ts — Event Consumer (Notification Service)
import { Channel, ConsumeMessage } from 'amqplib';

export class NotificationConsumer {
  async consume(): Promise<void> {
    await this.channel.assertExchange('petemart', 'topic', { durable: true });
    
    await this.channel.assertQueue('q.notification.order', { 
      durable: true,
      deadLetterExchange: 'petemart.dlx',
      messageTtl: 30000, // 30 second processing timeout
    });

    await this.channel.bindQueue('q.notification.order', 'petemart', 'order.*');

    this.channel.consume('q.notification.order', async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const { event, payload } = JSON.parse(msg.content.toString());
        
        switch (event) {
          case 'order.placed':
            await this.sendOrderConfirmation(payload);
            break;
          case 'order.confirmed':
            await this.sendMerchantNotification(payload);
            break;
        }

        this.channel.ack(msg);
      } catch (error) {
        // Retry 3 times, then send to DLQ
        if (msg.properties.headers['x-retry-count'] < 3) {
          this.channel.nack(msg, false, true); // Requeue
        } else {
          this.channel.nack(msg, false, false); // Send to DLQ
        }
      }
    });
  }
}
```

---

## 5. API → DB Integration Patterns

### 5.1 Repository Pattern

```typescript
// repositories/order.repository.ts
import { Pool } from 'pg';
import { Redis } from 'ioredis';

export class OrderRepository {
  constructor(
    private db: Pool,
    private cache: Redis
  ) {}

  async findById(orderId: string): Promise<Order | null> {
    // Cache-aside pattern
    const cached = await this.cache.get(`order:${orderId}`);
    if (cached) return JSON.parse(cached);

    const { rows } = await this.db.query(
      'SELECT * FROM orders WHERE order_id = $1',
      [orderId]
    );

    if (rows.length > 0) {
      const order = rows[0];
      await this.cache.setex(`order:${orderId}`, 300, JSON.stringify(order));
      return order;
    }

    return null;
  }

  async create(order: CreateOrderInput): Promise<Order> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Insert order
      const { rows: [newOrder] } = await client.query(
        `INSERT INTO orders (order_id, user_id, merchant_id, subtotal, total, status, metadata)
         VALUES ($1, $2, $3, $4, $5, 'pending', $6)
         RETURNING *`,
        [order.orderId, order.userId, order.merchantId, order.subtotal, order.total, order.metadata]
      );

      // Insert order items
      for (const item of order.items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, variant_id, product_name, unit_price, quantity)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newOrder.id, item.productId, item.variantId, item.productName, item.unitPrice, item.quantity]
        );
      }

      await client.query('COMMIT');

      // Invalidate cache
      await this.cache.del(`order:${order.orderId}`);
      await this.cache.del(`user:${order.userId}:orders`);

      return newOrder;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
```

### 5.2 CQRS Pattern (Read vs Write Models)

```typescript
// read-models/product-read.service.ts
// Uses Elasticsearch for complex queries
export class ProductReadService {
  async search(filters: SearchFilters): Promise<SearchResult> {
    const query = {
      index: 'products',
      body: {
        query: {
          bool: {
            must: [
              filters.query ? { multi_match: { query: filters.query, fields: ['name^3', 'description^2', 'merchant_name'] } } : { match_all: {} },
              filters.categoryId ? { term: { category_id: filters.categoryId } } : {},
              filters.minPrice ? { range: { price: { gte: filters.minPrice } } } : {},
              filters.maxPrice ? { range: { price: { lte: filters.maxPrice } } } : {},
            ],
            filter: [
              { term: { is_active: true } },
              filters.geo ? { geo_distance: { distance: `${filters.radius}km`, location: filters.geo } } : {},
            ],
          },
        },
        sort: [filters.sortBy || '_score'],
        from: (filters.page - 1) * filters.limit,
        size: filters.limit,
        aggs: {
          categories: { terms: { field: 'category_id' } },
          price_ranges: { range: { field: 'price', ranges: [{ to: 100 }, { from: 100, to: 500 }, { from: 500 }] } },
        },
      },
    };

    return this.elasticsearch.search(query);
  }
}

// write-models/product-write.service.ts
// Uses PostgreSQL (Aurora) for transactional writes
export class ProductWriteService {
  async create(product: CreateProductInput): Promise<Product> {
    // Start transaction
    const newProduct = await this.db.query('INSERT INTO products ... RETURNING *');
    
    // Update search index asynchronously
    await this.queue.publish('catalog.updated', { productId: newProduct.id, action: 'create' });
    
    // Invalidate cache
    await this.cache.del(`merchant:${product.merchantId}:products`);
    
    return newProduct;
  }
}
```

---

## 6. State Synchronization Patterns

### 6.1 Offline-First (Mobile / PWA)

```typescript
// offline/sync.ts — Background Sync Manager
import NetInfo from '@react-native-community/netinfo';
import { WatermelonDB } from '@nozbe/watermelondb';

export class OfflineSyncManager {
  private syncQueue: SyncQueueItem[] = [];

  async queueOperation(operation: SyncQueueItem): Promise<void> {
    const state = await NetInfo.fetch();

    if (state.isConnected) {
      // Online: execute immediately
      return this.executeOperation(operation);
    }

    // Offline: store for later sync
    await this.localDB.collections.get('sync_queue').create((record) => {
      record.endpoint = operation.endpoint;
      record.method = operation.method;
      record.payload = JSON.stringify(operation.payload);
      record.createdAt = Date.now();
    });
  }

  async syncPending(): Promise<void> {
    const pending = await this.localDB.collections
      .get('sync_queue')
      .query(Q.where('status', 'pending'))
      .fetch();

    for (const item of pending) {
      try {
        await this.executeOperation(item);
        await item.update((record) => { record.status = 'synced'; });
      } catch (error) {
        await item.update((record) => { 
          record.status = 'failed';
          record.retryCount += 1;
        });
      }
    }
  }
}

// Register background sync
AppRegistry.registerHeadlessTask('BackgroundSync', () => OfflineSyncManager.syncPending);
```

### 6.2 Real-time Push Notifications

```typescript
// notifications/push.ts — Push Notification Integration
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';

export class PushNotificationManager {
  async register(): Promise<void> {
    const permission = await messaging().requestPermission();
    
    if (permission === messaging.AuthorizationStatus.AUTHORIZED) {
      const token = await messaging().getToken();
      
      // Send token to backend
      await apiClient.post('/notifications/register-device', {
        token,
        platform: Platform.OS,
        appVersion: DeviceInfo.getVersion(),
      });
    }
  }

  async handleNotification(remoteMessage: RemoteMessage): Promise<void> {
    const { data } = remoteMessage;

    switch (data?.type) {
      case 'order_status':
        // Navigate to order tracking
        NavigationService.navigate('OrderTracking', { orderId: data.orderId });
        break;
      case 'delivery_update':
        // Update delivery tracking map
        TrackingStore.updateDeliveryPosition(data.orderId, JSON.parse(data.position));
        break;
      case 'merchant_message':
        // Show in-app notification
        InAppNotification.show(data.message);
        break;
    }
  }
}
```

---

## 7. Error Handling Patterns

### 7.1 Unified Error Response Format (RFC 7807)

```typescript
// api/error-handler.ts
interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errors?: Record<string, string[]>;
}

// API response interceptor maps all errors to ProblemDetails
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ProblemDetails>) => {
    const problem = error.response?.data;
    
    if (problem) {
      switch (problem.status) {
        case 400:
          toast.error(problem.detail, problem.errors);
          break;
        case 401:
          redirectToLogin();
          break;
        case 403:
          toast.error('You do not have permission to perform this action');
          break;
        case 404:
          toast.error('Resource not found');
          break;
        case 409:
          toast.error('Conflict: please refresh and try again');
          break;
        case 429:
          toast.error(`Rate limited. Retry after ${error.response.headers['retry-after']}s`);
          break;
        case 500:
          toast.error('Something went wrong. Our team has been notified.');
          Sentry.captureException(error);
          break;
      }
    }
    
    return Promise.reject(problem || error);
  }
);
```

### 7.2 Optimistic UI Rollback

```typescript
// hooks/useOptimisticMutation.ts
function useOptimisticMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    queryKey: QueryKey;
    optimisticUpdate: (oldData: any, variables: TVariables) => any;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previousData = queryClient.getQueryData(options.queryKey);
      
      queryClient.setQueryData(options.queryKey, (old) => 
        options.optimisticUpdate(old, variables)
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback to previous state
      queryClient.setQueryData(options.queryKey, context?.previousData);
      toast.error('Operation failed. Changes reverted.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: options.queryKey });
    },
  });
}
```

---

## 8. Data Flow Examples (End-to-End)

### 8.1 Complete Order Flow

```
1. User adds to cart
   UI → useAddToCart mutation → POST /v1/cart/items
     → API Gateway validates JWT
     → Cart Service adds item to DB
     → Redis cache invalidates
     → TanStack Query refetches cart

2. User checks out
   UI → navigate to /checkout
     → useQuery(['cart']) fetches cart
     → GET /v1/cart (cached 0s, always fresh)
     → Display items, address, payment options

3. User places order
   UI → usePlaceOrder() → POST /v1/orders { idempotencyKey }
     → API Gateway: validate JWT, rate limit, CORS
     → Order Service:
         a. Check idempotency (Redis)
         b. Begin DB transaction
         c. Reserve inventory (gRPC → Inventory Service)
         d. Process payment (gRPC → Payment Service → Razorpay)
         e. Create order records
         f. Commit transaction
         g. Publish 'order.placed' (RabbitMQ)
         h. Invalidate caches
     → Response: { orderId, status, paymentUrl }

4. Post-order events
   RabbitMQ consumers:
     a. Notification Service → Send SMS/Email/Push
     b. Inventory Service → Decrement stock, check low stock
     c. Analytics Service → Log order event (Kafka)
     d. Delivery Service → Auto-assign delivery partner

5. UI update
   → TanStack Query invalidates ['cart'], ['orders']
   → Redirect to /orders/:id
   → Real-time tracking via WebSocket subscription
```

### 8.2 Product Search Flow

```
1. User searches
   UI → SearchBar with 300ms debounce
     → useSearch(query) → GET /v1/search?q=silk+saree&page=1

2. API processing
   CDN cache check (60s stale-while-revalidate)
   → API Gateway → Search Service
   → Elasticsearch query (multi-match + filters + geo)
   → Results aggregated and returned

3. Caching layers
   TanStack Query cache: 2min TTL (instant back navigation)
   Redis cache: 5min TTL (product catalog)
   CDN cache: 60s with stale-while-revalidate 300s

4. User clicks product
   → useProduct(id) → GET /v1/products/P-456
   → TanStack Query placeholderData from cached search results
   → Instant navigation (no loading state)
   → Background refetch for fresh data
```

---

## 9. Performance & Caching Strategy at Each Layer

| Layer | Cache Type | TTL | Invalidation |
|-------|-----------|-----|--------------|
| **UI Component** | Local state (Zustand) | Session | Component unmount |
| **TanStack Query** | In-memory cache | 2-5 min | StaleTime + invalidate |
| **Service Worker** | Cache Storage API | 1 day (static) | SW update |
| **CDN (CloudFront)** | Edge cache | 60s (API), 1d (assets) | Cache invalidation |
| **Redis** | Application cache | 5-10 min | Write-through + TTL |
| **PostgreSQL** | Buffer cache + materialized views | Varies | Partial index |
| **Elasticsearch** | Index cache | Near real-time | Index refresh |

### 9.1 Cache Tag Strategy

```typescript
// cache/tags.ts
export const CacheTags = {
  product: (id: string) => `product:${id}`,
  merchant: (id: string) => `merchant:${id}`,
  category: (id: string) => `category:${id}`,
  userOrders: (userId: string) => `user:${userId}:orders`,
  cart: (userId: string) => `cart:${userId}`,
  search: (query: string) => `search:${query}`,
};

// Invalidate by tag pattern
export async function invalidateCache(tag: string): Promise<void> {
  await redis.eval(`
    local keys = redis.call('KEYS', ARGV[1])
    for _, key in ipairs(keys) do
      redis.call('DEL', key)
    end
  `, 0, tag);
}

// Usage
await invalidateCache('merchant:123:*'); // Invalidates all merchant 123 related caches
```

---

## 10. Integration Testing Patterns

### 10.1 API Contract Tests (Pact)

```typescript
// pact/order-consumer.pact.test.ts
describe('Order Service Contract', () => {
  const provider = new Pact({
    consumer: 'WebApp',
    provider: 'OrderService',
    port: 1234,
  });

  beforeAll(() => provider.setup());
  afterAll(() => provider.finalize());

  describe('create order', () => {
    beforeEach(() => {
      provider.addInteraction({
        state: 'a valid order request',
        uponReceiving: 'a POST request to create order',
        withRequest: {
          method: 'POST',
          path: '/v1/orders',
          headers: { Authorization: 'Bearer mock-jwt' },
          body: {
            items: [{ productId: '1', variantId: '1', quantity: 2 }],
            addressId: 'addr-1',
            paymentMethod: 'razorpay',
          },
        },
        willRespondWith: {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
          body: {
            orderId: 'PM-20241201-001',
            status: 'pending',
            total: 1200,
          },
        },
      });
    });

    it('creates an order successfully', async () => {
      const response = await apiClient.post('/v1/orders', {
        items: [{ productId: '1', variantId: '1', quantity: 2 }],
        addressId: 'addr-1',
        paymentMethod: 'razorpay',
      });
      expect(response.status).toBe(201);
      expect(response.data.orderId).toBeDefined();
    });
  });
});
```

### 10.2 E2E Test (Playwright)

```typescript
// e2e/order-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete Order Flow', () => {
  test('buyer searches, adds to cart, and checks out', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'priya@example.com');
    await page.fill('[data-testid="password"]', 'Test@123');
    await page.click('[data-testid="login-btn"]');
    await expect(page).toHaveURL('/');

    // Search for product
    await page.fill('[data-testid="search-input"]', 'silk saree');
    await page.waitForTimeout(500); // debounce
    const results = page.locator('[data-testid="product-card"]');
    await expect(results.first()).toBeVisible();
    await results.first().click();

    // Add to cart
    await page.click('[data-testid="add-to-cart-btn"]');
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');

    // Go to cart and checkout
    await page.click('[data-testid="cart-icon"]');
    await expect(page).toHaveURL('/cart');
    await page.click('[data-testid="checkout-btn"]');

    // Place order
    await page.click('[data-testid="place-order-btn"]');
    await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();

    // Verify order in history
    await page.click('[data-testid="orders-link"]');
    await expect(page.locator('[data-testid="order-card"]').first()).toBeVisible();
  });
});
```

---

## 11. Integration Checklist

- [x] API Client with JWT auto-refresh
- [x] TanStack Query for server state with staleTime + cacheTime
- [x] Optimistic updates with rollback for cart and orders
- [x] GraphQL for flexible queries + Subscriptions for real-time
- [x] gRPC for inter-service communication
- [x] RabbitMQ for event-driven async processing
- [x] Kafka for high-throughput analytics streams
- [x] 4-layer caching (Browser → CDN → Redis → DB)
- [x] Offline-first for mobile (WatermelonDB + sync queue)
- [x] Idempotency keys for write operations
- [x] Unified error handling (RFC 7807 Problem Details)
- [x] Contract tests (Pact) for all API integrations
- [x] E2E tests (Playwright) for critical user journeys
- [x] WebSocket reconnection with exponential backoff
- [x] Cache tag-based invalidation