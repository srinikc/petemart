#!/usr/bin/env python3
"""PeteMart — Deep Structural Market Analysis Engine
Analyzes pete_businesses.csv (558 merchants) for:
- Category × commerce mode cross-tabulation
- Digital readiness by category
- Phone availability by category
- Top merchant conversion targets (high rating + phone + no website)
- Category-level platform value estimation
- Rating × reviews correlation heatmap data
"""

import csv, json, math, os
from collections import defaultdict, Counter

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(SCRIPT_DIR, "pete_businesses.csv")

rows = []
with open(CSV_PATH, 'r', encoding='utf-8') as f:
    for r in csv.DictReader(f):
        rows.append(r)

N = len(rows)
cats = Counter(r['category'] for r in rows)
modes = Counter(r['commerce_mode'] for r in rows)
print(f"=== PETE MART STRUCTURAL MARKET ANALYSIS ===")
print(f"Total merchants: {N}")
print()

# 1. Category × commerce mode cross-tab
print("=== 1. CATEGORY vs COMMERCE MODE ===")
cat_mode = defaultdict(lambda: Counter())
for r in rows:
    cat_mode[r['category']][r['commerce_mode']] += 1
    
cross_tab_rows = []
for c in sorted(cat_mode.keys()):
    total = sum(cat_mode[c].values())
    a = cat_mode[c].get('A', 0)
    b = cat_mode[c].get('B', 0)
    c_val = cat_mode[c].get('C', 0)
    b_pct = (100 * b / total) if total > 0 else 0
    a_pct = (100 * a / total) if total > 0 else 0
    c_pct = (100 * c_val / total) if total > 0 else 0
    cross_tab_rows.append({'category': c, 'mode_a': a, 'mode_b': b, 'mode_c': c_val, 
                           'total': total, 'b_pct': round(b_pct, 1)})
    print(f"{c:25s} | A={a:3d} B={b:3d} C={c_val:3d} | B%={b_pct:.0f}%")

# Export cross-tab
with open(os.path.join(SCRIPT_DIR, "category_mode_crosstab.json"), 'w') as f:
    json.dump(cross_tab_rows, f, indent=2)

# 2. Digital readiness by category
print("\n=== 2. DIGITAL READINESS BY CATEGORY ===")
web_types = defaultdict(lambda: {'website': 0, 'instagram': 0, 'youtube': 0, 'platform': 0, 'none': 0, 'phone': 0, 'total': 0})
for r in rows:
    c = r['category']
    web_types[c]['total'] += 1
    if r['phone'].strip():
        web_types[c]['phone'] += 1
    w = r['website'].strip().lower()
    if not w:
        web_types[c]['none'] += 1
    else:
        web_types[c]['website'] += 1
        if 'instagram' in w:
            web_types[c]['instagram'] += 1
        if 'youtu' in w:
            web_types[c]['youtube'] += 1
        if any(x in w for x in ['quickeselling', 'dgtechsoln', 'site.dgtechsoln']):
            web_types[c]['platform'] += 1

digital_readiness_rows = []
for c in sorted(web_types.keys()):
    wt = web_types[c]
    online_pct = round(100 * wt['website'] / wt['total'], 1)
    phone_pct = round(100 * wt['phone'] / wt['total'], 1)
    digital_readiness_rows.append({
        'category': c, 'total': wt['total'], 'has_website': wt['website'],
        'has_instagram': wt['instagram'], 'has_youtube': wt['youtube'],
        'platform_hosted': wt['platform'], 'no_online': wt['none'],
        'has_phone': wt['phone'], 'online_pct': online_pct, 'phone_pct': phone_pct
    })
    print(f"{c:25s} | Online: {wt['website']:3d}/{wt['total']:3d} ({online_pct:.0f}%) | Phone: {wt['phone']:3d} ({phone_pct:.0f}%)")

with open(os.path.join(SCRIPT_DIR, "digital_readiness_by_category.json"), 'w') as f:
    json.dump(digital_readiness_rows, f, indent=2)

# 3. Top conversion targets
print("\n=== 3. TOP CONVERSION TARGETS (High Rating + Phone + No Website) ===")
targets = []
for r in rows:
    if r['rating'].strip() and r['phone'].strip() and not r['website'].strip():
        rat = float(r['rating'])
        rev = int(float(r['reviews'])) if r['reviews'].strip() else 0
        comp = rat * math.log(rev + 1)
        targets.append({
            'name': r['name'], 'category': r['category'], 'commerce_mode': r['commerce_mode'],
            'rating': rat, 'reviews': rev, 'phone': r['phone'], 'composite_score': round(comp, 1)
        })
targets.sort(key=lambda x: -x['composite_score'])
for t in targets[:30]:
    print(f"{t['name'][:45]:45s} | R:{t['rating']:.1f} | Rev:{t['reviews']:5d} | Cat:{t['category']:20s} | Ph:{t['phone']:15s}")

with open(os.path.join(SCRIPT_DIR, "conversion_targets.json"), 'w') as f:
    json.dump(targets[:100], f, indent=2)
print(f"\nTotal high-value conversion targets: {len(targets)}")

# 4. Category platform value estimation
print("\n=== 4. ESTIMATED PLATFORM VALUE BY CATEGORY ===")
est_orders = {'A': 30, 'B': 15, 'C': 5}
est_aov = {'A': 800, 'B': 5000, 'C': 20000}
commission_rates = {'A': 0.02, 'B': 0.005, 'C': 0.0}
sub_rates = {'A': 499, 'B': 0, 'C': 0}

cat_value = defaultdict(lambda: {'merchants': 0, 'commission': 0.0, 'subscription': 0.0, 'total': 0.0})
mode_breakdown = defaultdict(lambda: defaultdict(int))

for r in rows:
    m = r['commerce_mode']
    c = r['category']
    cat_value[c]['merchants'] += 1
    mode_breakdown[c][m] += 1
    tpv = est_orders[m] * est_aov[m]  # total platform value per merchant per month
    comm = tpv * commission_rates[m]
    sub = sub_rates[m]
    cat_value[c]['commission'] += comm
    cat_value[c]['subscription'] += sub
    cat_value[c]['total'] += comm + sub

total_platform_value = sum(v['total'] for v in cat_value.values())
for c, v in sorted(cat_value.items(), key=lambda x: -x[1]['total']):
    pct = 100 * v['total'] / total_platform_value
    print(f"{c:25s} | Modes: {dict(mode_breakdown[c])} | Comm: Rs{v['commission']:,.0f} | Sub: Rs{v['subscription']:,.0f} | Total: Rs{v['total']:,.0f}/mo ({pct:.1f}% of platform)")

print(f"\nTotal estimated platform value: Rs{total_platform_value:,.0f}/mo across {N} merchants")
print(f"Average platform value per merchant: Rs{total_platform_value/N:,.0f}/mo")

# 5. Rating distribution heatmap data
print("\n=== 5. RATING DISTRIBUTION ===")
rating_buckets = defaultdict(int)
for r in rows:
    if r['rating'].strip():
        rat = float(r['rating'])
        bucket = math.floor(rat * 2) / 2
        rating_buckets[f"{bucket:.1f}-{bucket+0.5:.1f}"] += 1
for b in sorted(rating_buckets.keys()):
    print(f"{b:10s}: {rating_buckets[b]:3d} merchants")

# 6. Category concentration analysis (top-N categories)
print("\n=== 6. CATEGORY CONCENTRATION ===")
sorted_cats = sorted(cats.items(), key=lambda x: -x[1])
cumulative = 0
for i, (c, n) in enumerate(sorted_cats, 1):
    cumulative += n
    pct = 100 * cumulative / N
    print(f"Top {i:2d}: {c:25s} ({n:3d}) → cumulative {cumulative:3d}/{N} ({pct:.1f}%)")

# Save summary JSON
summary = {
    'total_merchants': N,
    'categories_count': len(cats),
    'avg_rating': round(sum(float(r['rating']) for r in rows if r['rating'].strip()) / N, 2),
    'total_reviews': sum(int(float(r['reviews'])) for r in rows if r['reviews'].strip()),
    'digital_readiness_pct': round(100 * sum(1 for r in rows if r['website'].strip()) / N, 1),
    'phone_availability_pct': round(100 * sum(1 for r in rows if r['phone'].strip()) / N, 1),
    'commerce_mode_distribution': dict(modes),
    'conversion_targets_count': len(targets),
    'total_platform_value_monthly_inr': round(total_platform_value),
    'avg_platform_value_per_merchant_inr': round(total_platform_value / N) if N > 0 else 0,
}
with open(os.path.join(SCRIPT_DIR, "structural_analysis_summary.json"), 'w') as f:
    json.dump(summary, f, indent=2)

print(f"\n=== ANALYSIS COMPLETE ===")
print(f"Total merchants: {N}")
print(f"Conversion targets (high rating + phone + no website): {len(targets)}")
print(f"Total platform value: Rs{total_platform_value:,.0f}/mo")
print(f"Average per merchant: Rs{total_platform_value/N:,.0f}/mo")
