#!/usr/bin/env python3
"""
PeteMart â€” Pete Market Analysis Engine
========================================
Analyzes 558 Pete merchants from pete_businesses.csv and produces:
1. Full statistical report (category counts, area density, avg ratings, digital readiness)
2. Priority merchant outreach list (sorted by reviews Ã— rating composite score)
3. Enhanced pete_priority_outreach_enhanced.csv
4. Merchant density heatmap data
5. Structured analysis JSON (pete_structural_analysis.json)

Outputs to: agents\01_front_office\01_ideation_agent\
"""

import csv
import json
import os
import re
import math
from collections import defaultdict, Counter
from datetime import datetime

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(SCRIPT_DIR, "pete_businesses.csv")
OUT_CSV = os.path.join(SCRIPT_DIR, "pete_priority_outreach_enhanced.csv")
OUT_JSON = os.path.join(SCRIPT_DIR, "pete_structural_analysis.json")
OUT_HEATMAP = os.path.join(SCRIPT_DIR, "pete_density_heatmap.json")

# Known Pete areas for classification
PETE_AREAS = [
    "Chickpet", "Balepet", "Mamulpet", "Tharagpet", "Cubbonpet",
    "Avenue Road", "Raja Market", "Sultanpet", "KR Market", "Kumbarpete",
    "SP Road", "SJP Road", "Huriopet", "Basettyetpet", "BVK Iyengar Road",
    "Akkipete", "RT Street", "Kilari Road", "Santhusapet", "Cottonpet",
    "Sowrastra Pet", "Nagarathpete", "Anchepet", "Ganigarpet",
    "Dodpete", "Ballapurpet", "Thigalarpet", "Gollarpet",
    "Halsurpete", "Manivartapete", "Ragipet", "Sowrashtrapet",
    "Upparpete", "Jolly Mohalla", "Ranasinghpete", "Medarpet",
    "O.T.Pet", "New Tharagupet", "Old Tharagupet"
]

PETE_AREA_ALIASES = {
    "chickpet": "Chickpet", "chickpete": "Chickpet", "chikpete": "Chickpet",
    "balepet": "Balepet", "balepete": "Balepet",
    "mamulpet": "Mamulpet",
    "tharagpet": "Tharagpet", "tharagupet": "Tharagpet",
    "cubbonpet": "Cubbonpet", "cubbonpete": "Cubbonpet",
    "avenue road": "Avenue Road",
    "raja market": "Raja Market",
    "sultanpet": "Sultanpet", "sultanpete": "Sultanpet",
    "kr market": "KR Market",
    "kumbarpete": "Kumbarpete", "kumbarpet": "Kumbarpete",
    "sp road": "SP Road",
    "sjp road": "SJP Road",
    "huriopet": "Huriopet",
    "basettyetpet": "Basettyetpet", "basettypet": "Basettyetpet",
    "bvk iyengar road": "BVK Iyengar Road", "bvk iyengar rd": "BVK Iyengar Road",
    "akkipete": "Akkipete", "akkipet": "Akkipete",
    "rt street": "RT Street",
    "kilari road": "Kilari Road", "killari road": "Kilari Road",
    "santhusapet": "Santhusapet",
    "cottonpet": "Cottonpet", "cottonpete": "Cottonpet",
    "sowrastra pet": "Sowrastra Pet", "sowrashtra": "Sowrastra Pet",
    "nagarathpete": "Nagarathpete", "nagarathpet": "Nagarathpete",
}


def classify_area(address, pete_areas=PETE_AREAS, aliases=PETE_AREA_ALIASES):
    """Classify a merchant address into a known Pete area."""
    if not address:
        return "Other"
    addr_lower = address.lower()
    
    # Check area keywords in address
    area_keywords = {
        "Chickpet": ["chickpet", "chickpete", "chikpete"],
        "Balepet": ["balepet", "balepete"],
        "Mamulpet": ["mamulpet"],
        "Tharagpet": ["tharagpet", "tharagupet", "old tharagupet", "new tharagupet"],
        "Cubbonpet": ["cubbonpet", "cubbonpete"],
        "Avenue Road": ["avenue road"],
        "Raja Market": ["raja market"],
        "Sultanpet": ["sultanpet", "sultanpete"],
        "KR Market": ["kr market"],
        "Kumbarpete": ["kumbarpete", "kumbarpet"],
        "SP Road": ["sp road", "s p road", "sardar patrappa"],
        "SJP Road": ["sjp road", "s j p road"],
        "Huriopet": ["huriopet"],
        "Basettyetpet": ["basettyetpet", "basettypet"],
        "BVK Iyengar Road": ["bvk iyengar"],
        "Akkipete": ["akkipete", "akkipet"],
        "RT Street": ["rt street", "r.t. street"],
        "Kilari Road": ["kilari", "killari"],
        "Santhusapet": ["santhusapet"],
        "Cottonpet": ["cottonpet", "cottonpete"],
        "Sowrastra Pet": ["sowrastra", "sowrashtra"],
        "Nagarathpete": ["nagarathpete", "nagarathpet"],
        "Anchepet": ["anchepet"],
        "Ganigarpet": ["ganigarpet"],
        "Dodpete": ["dodpete"],
        "Ballapurpet": ["ballapurpet"],
        "Thigalarpet": ["thigalarpet"],
        "Gollarpet": ["gollarpet"],
        "Manivartapete": ["manivartapete"],
        "Ragipet": ["ragipet"],
        "Upparpete": ["upparpete"],
        "Jolly Mohalla": ["jolly mohalla"],
        "Ranasinghpete": ["ranasinghpete"],
        "Sowrashtrapet": ["sowrashtrapet"],
    }
    
    scores = {}
    for area, keywords in area_keywords.items():
        score = 0
        for kw in keywords:
            if kw in addr_lower:
                score += len(kw)
        if score > 0:
            scores[area] = score
    
    if scores:
        return max(scores, key=scores.get)
    return "Other"


def is_digitally_active(website, row=None):
    """Determine digital readiness from website/social fields."""
    if not website or website.strip() == "":
        return "no_presence"
    
    website = website.strip().lower()
    
    # Check for actual websites (not just instagram/youtube)
    social_domains = [
        "instagram.com", "facebook.com", "youtube.com", "youtu.be",
        "wa.me", "whatsapp.com", "t.me", "twitter.com", "linkedin.com"
    ]
    
    # Check for platform-hosted stores
    platform_domains = [
        "dgtechsoln.com", "quickeselling.com", "netlify.app",
        "grexa.site", "store.com"
    ]
    
    for sd in social_domains:
        if sd in website:
            return "social_only"
    
    for pd in platform_domains:
        if pd in website:
            return "platform_hosted"
    
    if website.startswith("http") or website.startswith("www.") or "." in website:
        return "website"
    
    return "undetermined"


def compute_composite_score(reviews, rating):
    """Compute outreach priority score = reviews * rating with log normalization."""
    if reviews == 0 or rating == 0:
        return 0
    # Use log scale for reviews to prevent dominance by outliers
    log_reviews = math.log1p(float(reviews))
    return round(log_reviews * float(rating), 2)


def main():
    print("=" * 60)
    print("PeteMart Market Analysis Engine v3.0")
    print(f"Started: {datetime.now().isoformat()}")
    print("=" * 60)
    
    # â”€â”€ 1. Read CSV â”€â”€
    merchants = []
    total_rows = 0
    with open(CSV_PATH, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_rows += 1
            merchants.append(row)
    
    print(f"\nâœ“ Read {total_rows} rows from {CSV_PATH}")
    print(f"âœ“ Valid merchant records: {len(merchants)}")
    
    # â”€â”€ 2. Category Distribution â”€â”€
    categories = Counter()
    for m in merchants:
        cat = m.get("category", "Unknown").strip()
        if not cat:
            cat = "Unknown"
        categories[cat] += 1
    
    print("\nâ”€â”€â”€ Category Distribution â”€â”€â”€")
    cat_sorted = categories.most_common()
    for cat, count in cat_sorted:
        pct = count / len(merchants) * 100
        print(f"  {cat:25s}: {count:4d} ({pct:5.1f}%)")
    
    # â”€â”€ 3. Area Classification â”€â”€
    print("\nâ”€â”€â”€ Classifying Pete Areas â”€â”€â”€")
    area_counter = Counter()
    for m in merchants:
        address = m.get("address", "") + " " + m.get("name", "")
        area = classify_area(address)
        m["_pete_area"] = area
        area_counter[area] += 1
    
    print(f"  Total unique areas detected: {len(area_counter)}")
    area_sorted = area_counter.most_common()
    for area, count in area_sorted:
        pct = count / len(merchants) * 100
        print(f"  {area:25s}: {count:4d} ({pct:5.1f}%)")
    
    # â”€â”€ 4. Digital Readiness â”€â”€
    print("\nâ”€â”€â”€ Digital Readiness Analysis â”€â”€â”€")
    digital = Counter()
    for m in merchants:
        website = m.get("website", "")
        readiness = is_digitally_active(website, m)
        m["_digital_readiness"] = readiness
        digital[readiness] += 1
    
    digital_labels = {
        "website": "Has Dedicated Website",
        "social_only": "Social Media Only",
        "platform_hosted": "Platform-Hosted Store",
        "no_presence": "No Online Presence",
        "undetermined": "Undetermined"
    }
    
    for key, count in digital.most_common():
        label = digital_labels.get(key, key)
        pct = count / len(merchants) * 100
        print(f"  {label:30s}: {count:4d} ({pct:5.1f}%)")
    
    # Category Ã— Digital Readiness cross-tab
    print("\nâ”€â”€â”€ Category Ã— Digital Readiness Cross-Tab (Top 10 categories) â”€â”€â”€")
    for cat, _ in cat_sorted[:10]:
        total = categories[cat]
        web = sum(1 for m in merchants if m.get("_pete_area") and m.get("_digital_readiness") == "website" and m.get("category","").strip() == cat)
        soc = sum(1 for m in merchants if m.get("_digital_readiness") == "social_only" and m.get("category","").strip() == cat)
        none_ = sum(1 for m in merchants if m.get("_digital_readiness") == "no_presence" and m.get("category","").strip() == cat)
        web_pct = web / total * 100 if total else 0
        print(f"  {cat:25s}: Total={total:3d} | Website={web:3d}({web_pct:4.0f}%) | Social={soc:2d} | None={none_:3d}")
    
    # â”€â”€ 5. Rating Analysis â”€â”€
    print("\nâ”€â”€â”€ Rating Analysis â”€â”€â”€")
    ratings = [float(m.get("rating", 0)) for m in merchants if m.get("rating")]
    avg_rating = sum(ratings) / len(ratings) if ratings else 0
    print(f"  Average rating: {avg_rating:.2f} (from {len(ratings)} rated merchants)")
    
    rating_buckets = Counter()
    for r in ratings:
        if r >= 4.5:
            rating_buckets["4.5-5.0"] += 1
        elif r >= 4.0:
            rating_buckets["4.0-4.4"] += 1
        elif r >= 3.5:
            rating_buckets["3.5-3.9"] += 1
        else:
            rating_buckets["<3.5"] += 1
    
    for bucket, count in rating_buckets.most_common():
        pct = count / len(ratings) * 100
        print(f"  {bucket:10s}: {count:4d} ({pct:5.1f}%)")
    
    # Average rating by area
    print("\nâ”€â”€â”€ Average Rating by Pete Area â”€â”€â”€")
    area_ratings = defaultdict(list)
    for m in merchants:
        area = m.get("_pete_area", "Other")
        try:
            r = float(m.get("rating", 0))
            if r > 0:
                area_ratings[area].append(r)
        except (ValueError, TypeError):
            pass
    
    for area in sorted(area_ratings.keys()):
        r_list = area_ratings[area]
        if r_list:
            avg_r = sum(r_list) / len(r_list)
            print(f"  {area:25s}: avg={avg_r:.2f} (n={len(r_list)})")
    
    # â”€â”€ 6. Commerce Mode Distribution â”€â”€
    print("\nâ”€â”€â”€ Commerce Mode Distribution (A=Retail, B=Wholesale, C=Premium) â”€â”€â”€")
    mode_counter = Counter()
    for m in merchants:
        mode = m.get("commerce_mode", "U").strip().upper()
        if mode not in ("A", "B", "C"):
            mode = "U"
        mode_counter[mode] += 1
    
    for mode in ("A", "B", "C", "U"):
        count = mode_counter.get(mode, 0)
        pct = count / len(merchants) * 100
        mode_name = {"A": "Retail/Direct", "B": "Wholesale/B2B", "C": "Premium/Visit", "U": "Unknown"}[mode]
        print(f"  Mode {mode} ({mode_name:20s}): {count:4d} ({pct:5.1f}%)")
    
    # â”€â”€ 7. Priority Outreach â€” Composite Score â”€â”€
    print("\nâ”€â”€â”€ Computing Priority Outreach Scores â”€â”€â”€")
    
    for m in merchants:
        try:
            reviews = float(m.get("reviews", 0))
            rating = float(m.get("rating", 0))
        except (ValueError, TypeError):
            reviews = 0
            rating = 0
        m["_composite_score"] = compute_composite_score(reviews, rating)
        m["_log_reviews"] = round(math.log1p(reviews), 2) if reviews > 0 else 0
    
    # Sort by composite score descending
    merchants_sorted = sorted(merchants, key=lambda m: m["_composite_score"], reverse=True)
    
    # â”€â”€ 8. Export Enhanced Priority CSV â”€â”€
    print(f"\nâ”€â”€â”€ Exporting Enhanced Priority CSV â†’ {OUT_CSV} â”€â”€â”€")
    fieldnames_out = [
        "priority_rank", "name", "category", "commerce_mode", "rating",
        "reviews", "composite_score", "digital_readiness", "pete_area",
        "phone", "address", "website", "google_maps_url", "onboarding_status"
    ]
    
    with open(OUT_CSV, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames_out)
        writer.writeheader()
        for idx, m in enumerate(merchants_sorted, 1):
            writer.writerow({
                "priority_rank": idx,
                "name": m.get("name", ""),
                "category": m.get("category", ""),
                "commerce_mode": m.get("commerce_mode", ""),
                "rating": m.get("rating", ""),
                "reviews": m.get("reviews", ""),
                "composite_score": m["_composite_score"],
                "digital_readiness": m["_digital_readiness"],
                "pete_area": m["_pete_area"],
                "phone": m.get("phone", ""),
                "address": m.get("address", ""),
                "website": m.get("website", ""),
                "google_maps_url": m.get("google_maps_url", ""),
                "onboarding_status": m.get("onboarding_status", "pending")
            })
    
    print(f"  âœ“ Exported {len(merchants)} merchants sorted by priority")
    
    # Print top 20 priority merchants
    print("\nâ”€â”€â”€ Top 20 Priority Merchants for Outreach â”€â”€â”€")
    print(f"{'Rank':<5} {'Name':<35} {'Area':<20} {'Rating':<7} {'Reviews':<8} {'Score':<8} {'Digital':<15}")
    print("-" * 100)
    for i, m in enumerate(merchants_sorted[:20], 1):
        name = m.get("name", "")[:34]
        area = m.get("_pete_area", "")[:19]
        rating = m.get("rating", "")
        reviews = m.get("reviews", "")
        score = m["_composite_score"]
        dig = digital_labels.get(m["_digital_readiness"], m["_digital_readiness"])[:14]
        print(f"{i:<5} {name:<35} {area:<20} {str(rating):<7} {str(reviews):<8} {score:<8.2f} {dig:<15}")
    
    # â”€â”€ 9. Density Heatmap Data â”€â”€
    print(f"\nâ”€â”€â”€ Generating Density Heatmap â†’ {OUT_HEATMAP} â”€â”€â”€")
    
    heatmap_data = {
        "schema_version": "1.0",
        "generated_at": datetime.now().isoformat(),
        "data_source": "pete_businesses.csv",
        "total_merchants_analyzed": len(merchants),
        "total_categories": len(categories),
        "total_pete_areas": len(area_counter),
        "area_density": [],
        "category_area_matrix": [],
        "digital_readiness_summary": {
            label: {
                "count": digital.get(key, 0),
                "pct": round(digital.get(key, 0) / len(merchants) * 100, 1)
            }
            for key, label in digital_labels.items()
        },
        "rating_summary": {
            "average_rating": round(avg_rating, 2),
            "rated_merchants": len(ratings),
            "buckets": {k: v for k, v in rating_buckets.most_common()}
        }
    }
    
    # Area density with breakdown
    for area, count in area_sorted:
        area_merchants = [m for m in merchants if m.get("_pete_area") == area]
        area_digital = Counter(m["_digital_readiness"] for m in area_merchants)
        area_ratings_list = [float(m.get("rating", 0)) for m in area_merchants if m.get("rating")]
        area_avg_rating = sum(area_ratings_list) / len(area_ratings_list) if area_ratings_list else 0
        area_categories = Counter(m.get("category", "Unknown") for m in area_merchants)
        
        heatmap_data["area_density"].append({
            "area": area,
            "merchant_count": count,
            "pct_of_total": round(count / len(merchants) * 100, 1),
            "avg_rating": round(area_avg_rating, 2),
            "digital_readiness": {
                "has_website": area_digital.get("website", 0),
                "social_only": area_digital.get("social_only", 0),
                "no_presence": area_digital.get("no_presence", 0),
                "platform_hosted": area_digital.get("platform_hosted", 0),
                "digital_readiness_pct": round(area_digital.get("website", 0) / count * 100, 1) if count else 0
            },
            "top_categories": area_categories.most_common(5)
        })
    
    # Category Ã— Area matrix (top categories)
    for cat, _ in cat_sorted:
        cat_merchants = [m for m in merchants if m.get("category", "").strip() == cat]
        if not cat_merchants:
            continue
        area_breakdown = Counter(m["_pete_area"] for m in cat_merchants)
        heatmap_data["category_area_matrix"].append({
            "category": cat,
            "total_in_category": len(cat_merchants),
            "avg_rating_in_category": round(
                sum(float(m.get("rating", 0)) for m in cat_merchants if m.get("rating")) / 
                max(sum(1 for m in cat_merchants if m.get("rating")), 1), 2
            ),
            "top_areas": area_breakdown.most_common(5),
            "digital_breakdown": {
                "has_website": sum(1 for m in cat_merchants if m["_digital_readiness"] == "website"),
                "no_presence": sum(1 for m in cat_merchants if m["_digital_readiness"] == "no_presence")
            }
        })
    
    with open(OUT_HEATMAP, mode="w", encoding="utf-8") as f:
        json.dump(heatmap_data, f, indent=2, ensure_ascii=False, default=str)
    
    # â”€â”€ 10. Full Structural Analysis JSON â”€â”€
    print(f"\nâ”€â”€â”€ Exporting Structural Analysis â†’ {OUT_JSON} â”€â”€â”€")
    
    # Summary stats
    merchants_with_website = sum(1 for m in merchants if m["_digital_readiness"] == "website")
    merchants_social_only = sum(1 for m in merchants if m["_digital_readiness"] == "social_only")
    merchants_no_presence = sum(1 for m in merchants if m["_digital_readiness"] == "no_presence")
    merchants_platform_hosted = sum(1 for m in merchants if m["_digital_readiness"] == "platform_hosted")
    
    analysis = {
        "schema_version": "3.0",
        "generated_at": datetime.now().isoformat(),
        "data_source": "pete_businesses.csv",
        "summary": {
            "total_merchants_analyzed": len(merchants),
            "total_categories": len(categories),
            "total_pete_areas": len(area_counter),
            "average_rating": round(avg_rating, 2),
            "total_reviews": sum(int(m.get("reviews", 0) or 0) for m in merchants),
            "digital_readiness": {
                "has_website": {"count": merchants_with_website, "pct": round(merchants_with_website / len(merchants) * 100, 1)},
                "social_only": {"count": merchants_social_only, "pct": round(merchants_social_only / len(merchants) * 100, 1)},
                "platform_hosted": {"count": merchants_platform_hosted, "pct": round(merchants_platform_hosted / len(merchants) * 100, 1)},
                "no_presence": {"count": merchants_no_presence, "pct": round(merchants_no_presence / len(merchants) * 100, 1)},
            },
            "commerce_mode_distribution": {
                "Mode_A_Retail": mode_counter.get("A", 0),
                "Mode_B_Wholesale": mode_counter.get("B", 0),
                "Mode_C_Premium": mode_counter.get("C", 0),
            }
        },
        "category_distribution": [
            {"category": cat, "count": count, "pct": round(count / len(merchants) * 100, 1)}
            for cat, count in cat_sorted
        ],
        "area_density": heatmap_data["area_density"],
        "category_area_matrix": heatmap_data["category_area_matrix"],
        "priority_merchants_top_50": [
            {
                "rank": i + 1,
                "name": m.get("name", ""),
                "category": m.get("category", ""),
                "area": m["_pete_area"],
                "rating": m.get("rating", ""),
                "reviews": int(float(m.get("reviews", 0))) if m.get("reviews") else 0,
                "composite_score": m["_composite_score"],
                "digital_readiness": m["_digital_readiness"],
                "phone": m.get("phone", ""),
                "has_website": bool(m.get("website", ""))
            }
            for i, m in enumerate(merchants_sorted[:50])
        ],
        "heatmap_data": heatmap_data,
        "methodology_notes": {
            "area_classification": "Address-based keyword matching with 21+ known Pete areas and aliases",
            "digital_readiness": "Website field analyzed for custom domain (website), social platform (social_only), platform-hosted store (platform_hosted), empty (no_presence)",
            "composite_score": "log1p(reviews) * rating â€” log-normalized to prevent outliers from dominating",
            "rating_buckets": "Bucketed as 4.5-5.0 (Excellent), 4.0-4.4 (Good), 3.5-3.9 (Average), <3.5 (Below Average)"
        }
    }
    
    with open(OUT_JSON, mode="w", encoding="utf-8") as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"  âœ“ Exported structural analysis to {OUT_JSON}")
    
    # â”€â”€ Final Summary â”€â”€
    print("\n" + "=" * 60)
    print("ANALYSIS COMPLETE â€” Summary")
    print("=" * 60)
    print(f"  Merchants Analyzed:          {len(merchants)}")
    print(f"  Categories Detected:         {len(categories)}")
    print(f"  Pete Areas Identified:       {len(area_counter)}")
    print(f"  Average Rating:              {avg_rating:.2f}")
    print(f"  Digital Adoption Rate:       {digital.get('website',0)}/{len(merchants)} ({digital.get('website',0)/len(merchants)*100:.1f}%)")
    print(f"  No Digital Presence:         {digital.get('no_presence',0)}/{len(merchants)} ({digital.get('no_presence',0)/len(merchants)*100:.1f}%)")
    print(f"  Top Category:                {cat_sorted[0][0]} ({cat_sorted[0][1]})")
    print(f"  Top Area:                    {area_sorted[0][0]} ({area_sorted[0][1]})")
    print(f"  Mode B (Wholesale):          {mode_counter.get('B',0)}/{len(merchants)} ({mode_counter.get('B',0)/len(merchants)*100:.1f}%)")
    print(f"  Outreach CSV Exported:       {OUT_CSV}")
    print(f"  Structural JSON Exported:    {OUT_JSON}")
    print(f"  Density Heatmap Exported:    {OUT_HEATMAP}")
    print(f"\n  Ready for Agent 02 (Requirement Agent) consumption.")
    print("=" * 60)


if __name__ == "__main__":
    main()
