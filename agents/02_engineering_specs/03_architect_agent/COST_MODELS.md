# PeteMart — Cost Models & Capacity Planning

> **Document Version:** 2.0  
> **Scope:** POC (8 merchants) to Full Production (5,000 merchants)  
> **Currency:** USD (monthly unless specified)

---

## 1. POC Cost Model (8 Merchants, Single Market)

### 1.1 Infrastructure — Free Tier / Minimal (Monthly)

| Category | Service | Spec | Monthly Cost |
|----------|---------|------|------------:|
| **Compute** | ECS Fargate | 10 tasks × 0.5 vCPU × 1GB | $150 |
| **Database** | RDS PostgreSQL | db.t3.medium (2vCPU, 4GB) + 50GB gp3 | $50 |
| **Cache** | ElastiCache Redis | cache.t3.small (1.37GB) | $20 |
| **Queue** | SQS Standard | 100K requests/month | Free |
| **Storage** | S3 Standard | 10GB + Transfer | $5 |
| **CDN** | CloudFront | 50GB transfer + 1M requests | $10 |
| **DNS** | Route 53 | 1 hosted zone | $5 |
| **Auth** | Auth0 | Free Tier (7K MAU) | Free |
| **Payments** | Razorpay | Test Mode | Free |
| **Notifications** | Twilio SMS | Trial credits | Free |
| **SES** | AWS SES | 1000 emails/month | Free |
| **Monitoring** | CloudWatch | Basic metrics | $15 |
| **CI/CD** | GitHub Actions | Free Tier (2000 min) | Free |
| **ECR** | Container Registry | 500MB | Free |
| **ALB** | Load Balancer | 1 ALB + 1 rule | $20 |
| **NAT** | NAT Gateway | 1 per AZ | $30 |
| **Total** | | | **$305** |

### 1.2 POC Total Cost (8 Weeks)

| Cost Category | Amount |
|:--------------|-------:|
| Infrastructure (AWS) — 2 months | $610 |
| Engineering (2 × Full-Stack × 8 weeks @ $150/hr × 40hr/wk) | $24,000 |
| QA Engineer (1 × 6 weeks @ $100/hr) | $9,000 |
| Domain + SSL | $15 |
| **Total POC Budget** | **~$33,625** |

---

## 2. Production Cost Model (5,000 Merchants)

### 2.1 Assumptions

| Parameter | Value |
|-----------|-------|
| Active Merchants | 5,000 |
| Monthly Active Users (MAU) | 100,000 |
| Monthly Orders | 500,000 |
| Monthly Order Value (Average) | ₹500 ($6) |
| Product Catalog Size | 500,000 |
| Daily Active Users (DAU) | 25,000 |
| Concurrent Users (Peak) | 5,000 |
| Image Storage | 1 TB |
| Data Transfer (CDN) | 5 TB/month |

### 2.2 Compute (ECS Fargate) — Monthly

| Service | Min | Max | CPU | Memory (GB) | Unit Cost/hr | Monthly (Min) | Monthly (Avg) |
|---------|-----|-----|-----|------------|------------:|--------------:|--------------:|
| API Gateway (Kong) | 3 | 10 | 1024 | 2 | $0.088 | $190 | $475 |
| Auth Service | 2 | 6 | 512 | 1 | $0.044 | $63 | $158 |
| Product Service | 3 | 15 | 1024 | 2 | $0.088 | $190 | $950 |
| Order Service | 4 | 20 | 1024 | 2 | $0.088 | $253 | $1,267 |
| Merchant Service | 3 | 10 | 512 | 1 | $0.044 | $95 | $317 |
| Inventory Service | 3 | 10 | 512 | 1 | $0.044 | $95 | $317 |
| Delivery Service | 3 | 15 | 1024 | 2 | $0.088 | $190 | $950 |
| Payment Service | 3 | 10 | 512 | 1 | $0.044 | $95 | $317 |
| User Service | 2 | 6 | 512 | 1 | $0.044 | $63 | $158 |
| Pricing Service | 2 | 6 | 512 | 1 | $0.044 | $63 | $158 |
| Catalog Service | 3 | 8 | 512 | 1 | $0.044 | $95 | $253 |
| Search Service | 3 | 10 | 2048 | 4 | $0.176 | $380 | $1,267 |
| Notification Service | 2 | 8 | 512 | 1 | $0.044 | $63 | $253 |
| Analytics Service | 2 | 6 | 2048 | 4 | $0.176 | $253 | $760 |
| Reporting Service | 2 | 4 | 512 | 1 | $0.044 | $63 | $127 |
| DocGen Service | 2 | 4 | 512 | 1 | $0.044 | $63 | $127 |
| Export Service | 2 | 4 | 512 | 1 | $0.044 | $63 | $127 |
| **Compute Total** | | | | | | **$2,677** | **$8,524** |

### 2.3 Database & Storage — Monthly

| Component | Spec | Quantity | Cost |
|-----------|------|---------:|-----:|
| **Aurora PostgreSQL Writer** | db.r6g.large (2vCPU, 16GB) | 1 | $350 |
| **Aurora PostgreSQL Reader** | db.r6g.large (2vCPU, 16GB) | 2 | $700 |
| **Aurora Storage** | 500GB @ $0.10/GB-month | 500 | $50 |
| **Aurora IOPS** | 3M/month | 3M | Included |
| **ElastiCache Redis (Primary)** | r6g.large (2vCPU, 13.07GB) | 1 | $180 |
| **ElastiCache Redis (Replicas)** | r6g.large | 2 | $360 |
| **ElastiCache Redis (Shards)** | Additional 6 shards × r6g.large | 6 | $1,080 |
| **OpenSearch** | m6g.large.search (2vCPU, 16GB) × 3 nodes | 3 | $600 |
| **S3 Standard** | 1TB + 5TB transfer | 1000GB | $115 |
| **S3 Glacier (Backups)** | 500GB | 500 | $5 |
| **EFS** | 100GB | 100 | $30 |
| **Database Total** | | | **$3,470** |

### 2.4 Networking & CDN — Monthly

| Component | Cost |
|-----------|-----:|
| CloudFront CDN (5TB transfer + 10M requests) | $350 |
| AWS Global Accelerator | $150 |
| Application Load Balancer (3 AZs) | $120 |
| NAT Gateway (3 AZs × $32) | $96 |
| Route 53 (Hosted Zone + Queries) | $75 |
| VPC Endpoints | $60 |
| Data Transfer (Inter-AZ, cross-region) | $500 |
| **Network Total** | **$1,351** |

### 2.5 Security — Monthly

| Component | Cost |
|-----------|-----:|
| AWS WAF (CloudFront) | $300 |
| AWS Shield Advanced | $3,000 |
| Auth0 (Custom Tier, 100K MAU) | $300 |
| AWS KMS (Keys + API calls) | $50 |
| Secrets Manager | $20 |
| Certificate Manager (SSL/TLS) | Free |
| **Security Total** | **$3,670** |

### 2.6 Monitoring & Observability — Monthly

| Component | Cost |
|-----------|-----:|
| Datadog Infrastructure (100 hosts) | $600 |
| Datadog APM (100 hosts) | $400 |
| Sentry (Errors + Performance) | $150 |
| CloudWatch (Metrics + Logs) | $200 |
| PagerDuty (Operations) | $100 |
| **Monitoring Total** | **$1,450** |

### 2.7 Third-Party APIs & Services — Monthly

| Service | Usage | Cost |
|---------|-------|-----:|
| Razorpay/Stripe (Processing 1.5% + ₹2/txn) | 500K orders × $6 avg × 1.5% | $45,000* |
| Twilio SMS (OTP + Notifications) | 200K SMS @ $0.0079 | $1,580 |
| AWS SES (Email) | 100K emails @ $0.10/1000 | $10 |
| WhatsApp Business API | 50K conversations @ $0.005 | $250 |
| Google Maps Platform | 500K API calls | $400 |
| Mapbox (if alternative) | 500K calls | $200 |
| **API Total (excl. processing fees)** | | **$2,440** |

*\* Payment processing fees are pass-through to merchants; not included in platform cost.*

### 2.8 Production Total Monthly Cost

| Category | Monthly Cost |
|----------|------------:|
| Compute (ECS Fargate - Avg) | $8,524 |
| Database & Storage | $3,470 |
| Networking & CDN | $1,351 |
| Security | $3,670 |
| Monitoring & Observability | $1,450 |
| Third-Party APIs | $2,440 |
| **Total (Excl. Payment Processing)** | **$20,905** |
| **Total (Rounded)** | **~$21,000** |

### 2.9 Annual Production Cost

| Category | Annual Cost |
|----------|-----------:|
| Compute | $102,288 |
| Database & Storage | $41,640 |
| Networking & CDN | $16,212 |
| Security | $44,040 |
| Monitoring | $17,400 |
| APIs | $29,280 |
| **Annual Total** | **~$250,860** |

---

## 3. Scale Projections

### 3.1 Cost Scaling by Merchant Count

| Merchants | MAU | Orders/Month | Monthly Cost | Cost/Order | Cost/Merchant |
|----------:|----:|-------------:|------------:|-----------:|--------------:|
| 8 (POC) | 500 | 200 | $305 | $1.53 | $38.13 |
| 50 | 2,500 | 5,000 | $1,500 | $0.30 | $30.00 |
| 200 | 10,000 | 20,000 | $4,000 | $0.20 | $20.00 |
| 1,000 | 50,000 | 100,000 | $10,000 | $0.10 | $10.00 |
| 2,500 | 75,000 | 250,000 | $15,000 | $0.06 | $6.00 |
| 5,000 | 100,000 | 500,000 | $21,000 | $0.042 | $4.20 |
| 10,000 | 200,000 | 1,000,000 | $35,000 | $0.035 | $3.50 |

### 3.2 Revenue Model vs Cost

| Metric | Value |
|--------|------:|
| Monthly Platform Cost (5K merchants) | $21,000 |
| Avg B2C Commission (4%) | $30/order × 4% = $1.20 |
| Avg B2B Commission (1.5%) | $500/order × 1.5% = $7.50 |
| Subscription (Starter @ $499/yr) | $41.58/month |
| Subscription (Growth @ $999/yr) | $83.25/month |
| Subscription (Premium @ $2,499/yr) | $208.25/month |

**Breakeven Scenarios:**
- **B2C only**: 17,500 orders/month → $21,000 revenue
- **B2C + 50% merchants on Starter**: 10,000 orders ($12,000) + 2,500 × $41.58 ($103,950) → Profitable
- **B2C + Premium mix**: 5,000 orders ($6,000) + subscriptions → Profitable at 20% penetration

---

## 4. Capacity Planning

### 4.1 Database Capacity Projections

| Metric | 6 Months | 12 Months | 24 Months |
|--------|---------:|----------:|----------:|
| Users | 25,000 | 100,000 | 500,000 |
| Merchants | 500 | 2,500 | 5,000 |
| Products | 50,000 | 250,000 | 500,000 |
| Orders (cumulative) | 150,000 | 1,500,000 | 6,000,000 |
| DB Size (GB) | 10 | 50 | 150 |
| Aurora Instance | db.r6g.large | db.r6g.xlarge | db.r6g.2xlarge |
| Read Replicas | 1 | 2 | 3 |
| Redis Memory (GB) | 13 | 26 | 52 |

### 4.2 Storage Capacity

| Asset | 12 Months | Growth |
|-------|----------:|--------|
| Product Images (500K products × 5 images × 500KB) | 1.25 TB | 20% YoY |
| Documents (Invoices, Reports, KYC) | 200 GB | 30% YoY |
| Backups (DB + Config) | 100 GB | 50% YoY |
| Logs (CloudWatch) | 500 GB | 100% YoY |
| **Total S3 Storage** | **~2 TB** | |

### 4.3 Network Capacity

| Metric | Peak | Monthly |
|--------|-----:|--------:|
| API Requests/sec | 500 rps | 50M |
| Static Asset Requests/sec | 2,000 rps | 500M |
| CDN Egress | 50 Mbps avg | 5 TB |
| Data Transfer (Inter-service) | 100 Mbps | 1 TB |

---

## 5. Cost Optimization Strategies

### 5.1 Short-term (0-6 months)

| Strategy | Savings | Implementation |
|----------|--------:|----------------|
| Reserved Instances (RDS, Redis) | 30-40% | 1-year commitment |
| ECS Fargate Savings Plans | 20-30% | 1-year commitment |
| S3 Lifecycle (Infrequent Access) | 20% | Move old images to S3 IA |
| CloudFront Price Class 100 (India only) | 40% | Restrict to India edge locations |
| **Total Short-term Savings** | **~25-35%** | |

### 5.2 Medium-term (6-18 months)

| Strategy | Savings | Implementation |
|----------|--------:|----------------|
| Graviton (ARM) instances | 20% | Switch to AWS Graviton |
| Spot Instances (Batch jobs) | 60-70% | Analytics, reports on Spot |
| Auto-scaling tuned metrics | 15% | Fine-tune min/max thresholds |
| CDN caching optimization | 10% | Increase cache hit ratio > 90% |
| **Total Medium-term Savings** | **~20-30%** | |

### 5.3 Long-term (18+ months)

| Strategy | Savings | Implementation |
|----------|--------:|----------------|
| Custom Kubernetes (EKS) | 30% | Consolidate services on larger instances |
| Database sharding | 20% | Horizontal sharding for orders |
| CDN Multi-origin | 15% | Regional edge caching |
| Vendor negotiation | 10-20% | Bulk pricing on APIs |
| **Total Long-term Savings** | **~30-40%** | |

---

## 6. Team & Operational Costs

### 6.1 Engineering Team (Monthly)

| Role | Count | Monthly Cost (India) | Monthly Cost (US) |
|------|------:|--------------------:|------------------:|
| Full-Stack Engineers | 6 | $36,000 | $120,000 |
| Backend Engineers | 4 | $24,000 | $80,000 |
| Mobile Engineers | 2 | $12,000 | $40,000 |
| DevOps/SRE | 2 | $14,000 | $50,000 |
| QA Engineers | 2 | $8,000 | $30,000 |
| Data/Analytics Engineer | 1 | $6,000 | $20,000 |
| Product Manager | 1 | $8,000 | $25,000 |
| Tech Lead | 1 | $10,000 | $35,000 |
| **Total Engineering** | **19** | **$118,000** | **$400,000** |

### 6.2 Operations Team (Monthly)

| Role | Count | Monthly Cost (India) |
|------|------:|--------------------:|
| Customer Support | 5 | $10,000 |
| Merchant Onboarding | 3 | $6,000 |
| Delivery Operations | 2 | $4,000 |
| Finance/Accounts | 1 | $3,000 |
| **Total Ops** | **11** | **$23,000** |

---

## 7. Total Cost of Ownership (TCO) Summary

### 7.1 Monthly TCO (Production — 5,000 Merchants)

| Category | Monthly |
|----------|-------:|
| Infrastructure (AWS) | $21,000 |
| Engineering (India-based) | $118,000 |
| Operations | $23,000 |
| **Total Monthly TCO** | **$162,000** |
| **Total Annual TCO** | **$1,944,000** |

### 7.2 Cost Per Metric

| Metric | Cost |
|--------|-----:|
| Cost per Merchant (Monthly) | $32.40 |
| Cost per Active User (Monthly) | $1.62 |
| Cost per Order | $0.32 |
| Infrastructure Cost per Order | $0.042 |
| AWS Cost as % of TCO | 13% |

---

## 8. Recommendation

### 8.1 Phased Infrastructure Spend

| Phase | Duration | Monthly AWS Cost | Cumulative AWS Cost |
|-------|----------|----------------:|-------------------:|
| P0: Foundation | Month 1-2 | $305 POC | $610 |
| P1: Core Commerce | Month 2-4 | $1,500 | $4,600 |
| P2: Merchant Tools | Month 3-5 | $2,500 | $9,100 |
| P3: Delivery | Month 4-6 | $4,000 | $17,100 |
| P4: Search | Month 5-7 | $6,000 | $29,100 |
| P5: Admin | Month 6-8 | $8,000 | $45,100 |
| P6: Omnichannel | Month 7-9 | $12,000 | $69,100 |
| P7: Scale | Month 9-12 | $18,000 | $123,100 |
| **Production steady-state** | **Month 12+** | **$21,000** | |

### 8.2 Key Financial Decisions

1. **Start with POC ($305/month)** — Validate before scaling
2. **Reserve capacity at Month 6** — Commit to RIs for 30-40% savings
3. **Migrate to Graviton at Month 9** — Additional 20% compute savings
4. **Negotiate API contracts at Month 12** — Bulk pricing for Twilio, Maps, WhatsApp
5. **Target $0.03/infrastructure cost per order** at 1M orders/month