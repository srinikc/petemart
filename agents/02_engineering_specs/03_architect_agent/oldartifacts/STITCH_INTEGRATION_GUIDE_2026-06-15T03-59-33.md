# Stitch Integration Guide

**Generated**: 2026-06-15T03:59:33.067Z
**Version**: 2026-06-15T03-59-33

## Overview
Stitch (Talend) integration for ETL workflows connecting PeteMart platform data sources.

## Data Sources
- Supabase PostgreSQL
- Vercel Analytics
- WhatsApp Business API
- ShipRocket/Razorpay APIs

## Integration Points
1. Merchant data sync (daily)
2. Order reconciliation (hourly)
3. Inventory updates (real-time via webhook)
4. Revenue auditing (daily batch)

## Security
- All connections use TLS 1.3
- API keys stored in GitHub Secrets / Vercel Environment Variables
- Audit logging enabled for all ETL jobs