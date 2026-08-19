import csv, json, collections

rows = []
with open("agents/01_front_office/01_ideation_agent/pete_businesses.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for r in reader:
        rows.append(r)

cats = collections.defaultdict(list)
for r in rows:
    cats[r["category"]].append(r)

print("=== Category Analysis ===")
for cat, items in sorted(cats.items(), key=lambda x: -len(x[1])):
    ratings = [float(r["rating"]) for r in items if r["rating"]]
    has_website = sum(1 for r in items if r["website"].strip())
    total = len(items)
    print(f"{cat:30s} | Count: {total:3d} | Avg Rating: {sum(ratings)/len(ratings):.2f} | Website%: {has_website/total*100:5.1f}%")

areas = collections.defaultdict(list)
for r in rows:
    addr = r["address"].lower()
    area_assigned = None
    for keyword in ["chickpet","balepet","mamulpet","tharagupet","tharagpet","cubbonpet","avenue road","raja market","sultanpet","kr market","kumbarpet","sp road","sjp road","huriopet","basettyetpet","bvk iyengar","akkipete","rt street","kilari","santhusapet","cottonpet","sowrastra","nagarathpete"]:
        if keyword in addr:
            area_assigned = keyword.title()
            break
    if area_assigned:
        areas[area_assigned].append(r)

print("\n=== Area Analysis (from address parsing) ===")
for area, items in sorted(areas.items(), key=lambda x: -len(x[1])):
    ratings = [float(r["rating"]) for r in items if r["rating"]]
    has_website = sum(1 for r in items if r["website"].strip())
    total = len(items)
    top_cats = collections.Counter(r["category"] for r in items).most_common(3)
    print(f"{area:25s} | Count: {total:3d} | Avg Rating: {sum(ratings)/len(ratings):.2f} | Website%: {has_website/total*100:5.1f}% | Top: {[c[0] for c in top_cats]}")

platforms = collections.Counter()
for r in rows:
    w = r["website"].strip().lower()
    if not w: continue
    if "shopify" in w: platforms["Shopify"] += 1
    elif "instagram.com" in w: platforms["Instagram"] += 1
    elif "facebook.com" in w: platforms["Facebook"] += 1
    elif "quickeselling" in w: platforms["QuickESelling"] += 1
    elif "dgtechsoln" in w: platforms["DG Tech Soln"] += 1
    elif "google" in w: platforms["Google Sites"] += 1
    elif "youtube" in w: platforms["YouTube"] += 1
    elif "wordpress" in w or "wp" in w: platforms["WordPress"] += 1
    else: platforms["Custom/Other"] += 1

print("\n=== Website Platform Distribution ===")
for p, c in platforms.most_common():
    print(f"{p:20s}: {c}")

# Digital readiness
status_keywords = {
    "E-commerce Ready": ["shopify","quickeselling","wordpress","kumarstores","vaibhavstores","sagarstores","leafnutz","manakmewa","arvindmewa"],
    "Social Media Only": ["instagram","facebook","youtube"],
    "Basic Website": []
}
for r in rows:
    w = r["website"].strip().lower()
    if not w:
        r["_digital"] = "No Digital Presence"
    elif any(k in w for k in status_keywords["E-commerce Ready"]):
        r["_digital"] = "E-commerce Ready"
    elif any(k in w for k in status_keywords["Social Media Only"]):
        r["_digital"] = "Social Media Only"
    else:
        r["_digital"] = "Basic Website"

dig = collections.Counter(r["_digital"] for r in rows)
print("\n=== Digital Readiness Distribution ===")
for k, v in dig.most_common():
    print(f"{k:25s}: {v} ({v/len(rows)*100:.1f}%)")

ratings = [float(r["rating"]) for r in rows if r["rating"]]
print(f"\n=== Rating Distribution ===")
print(f"Total with ratings: {len(ratings)}")
print(f"Avg: {sum(ratings)/len(ratings):.2f}")
print(f"4.5+: {sum(1 for r in ratings if r >= 4.5)} ({sum(1 for r in ratings if r >= 4.5)/len(ratings)*100:.1f}%)")
print(f"4.0-4.49: {sum(1 for r in ratings if 4.0 <= r < 4.5)}")
print(f"3.0-3.99: {sum(1 for r in ratings if 3.0 <= r < 4.0)}")
print(f"<3.0: {sum(1 for r in ratings if r < 3.0)}")

total_websites = sum(1 for r in rows if r["website"].strip())
total_social = sum(1 for r in rows if any(s in r["website"].lower() for s in ["instagram","facebook","youtube"]))
total_ecom = sum(1 for r in rows if any(s in r["website"].lower() for s in ["shopify","quickeselling","wordpress","kumarstores","vaibhavstores","sagarstores","leafnutz","manakmewa","arvindmewa"]))
print(f"\n=== Summary ===")
print(f"Total merchants: {len(rows)}")
print(f"With website: {total_websites}")
print(f"Social media only: {total_social}")
print(f"E-commerce platform: {total_ecom}")
print(f"No digital presence: {len(rows) - total_websites}")
