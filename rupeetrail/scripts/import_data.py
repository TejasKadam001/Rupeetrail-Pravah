"""Rebuild the native D1 input packs from the pinned synthetic Mumbai source.

Inputs are the unmodified CC BY 4.0 files in data/source (commit below).
Run with Python's standard library: python scripts/import_data.py
"""
import base64
import csv
import gzip
import hashlib
import json
import math
import statistics
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "source"
OUT = ROOT / "db" / "import"
COMMIT = "81d22806af98bded38bc15b0e7be248e4fbdfd3b"
VERSION = COMMIT[:12] + "-v1"
PACK_LIMIT = 80000
INT_RAW = set("""upvotes gps_accuracy_m likes_or_forwards empanelled_since beds_or_students
    flood_threshold_mm_per_day avg_water_depth_cm years_flagged_last_5 segment_no lanes length_m
    peak_hour_vehicles bus_routes_count two_wheeler_share_pct standard_rate_inr population_est
    engineering_crews monsoon_repair_budget_inr_2025 cost_inr sla_hours""".split())
REAL_RAW = set("""lat lon start_lat start_lon end_lat end_lon centroid_lat centroid_lon
    avg_recession_hours rainfall_mm height_m avg_peak_speed_kmph congestion_index_0_10
    approx_area_km2 low_lying_index area_sqm""".split())
FIELD_ORDER = {
    "source_catalog": "file table_name rows sha256",
    "complaint_links": "complaint_id work_order_id",
    "traceability": "id ward ward_source locality locality_text received issue status channel linked followup work_ids search",
    "accountability": "id ward road road_name contractor contractor_name issue method assigned completed area qty unit rate billed benchmark variance variance_pct price_flag sla_met sla_hours elapsed reopened dlp duplicate linked raw_score case_score rain_mm search",
    "next_rupee": "id ward name segment lat1 lon1 lat2 lon2 orders linked reopened billed dlp score tier station heavy wet_days compound hotspot hotspot_name dist_m flood_points traffic_points safety_points access_points history_points vehicles congestion accidents road_accidents severe facilities hospitals schools action method unit qty rate method_reopen estimate search",
    "import_state": "version cursor",
}
INT_FIELDS = set("""rows cursor linked followup price_flag sla_met sla_hours reopened dlp
    segment orders heavy wet_days compound vehicles accidents road_accidents severe facilities hospitals schools
    rate billed benchmark variance estimate""".split())
REAL_FIELDS = set("""area qty variance_pct elapsed raw_score case_score rain_mm score lat1 lon1 lat2 lon2
    dist_m flood_points traffic_points safety_points access_points history_points congestion method_reopen""".split())
KEYS = {
    "accidents": ["accident_id"], "complaints": ["complaint_id"], "complaints_sample_200": ["complaint_id"],
    "contractors": ["contractor_id"], "facilities": ["facility_id"], "flood_hotspots": ["hotspot_id"],
    "localities": ["locality", "ward_code"], "rainfall_daily": ["date", "station"],
    "rate_card": ["repair_method"], "roads": ["road_id"], "social_posts": ["post_id"],
    "tides": ["date", "high_tide_time"], "traffic": ["road_id"], "wards": ["ward_code"],
    "work_orders": ["work_order_id"], "source_catalog": ["file"], "complaint_links": ["complaint_id","work_order_id"],
    "traceability": ["id"], "accountability": ["id"], "next_rupee": ["id"], "import_state": ["version"],
}
INDEX = {
    "complaint_links": ["work_order_id"], "traceability": ["ward", "received"],
    "accountability": ["ward", "contractor", "road", "assigned"],
    "next_rupee": ["ward", "score"], "work_orders": ["road_id"], "accidents": ["road_id"],
    "facilities": ["ambulance_entry_road"]
}
RISK_CAUSES = {"Pothole", "Waterlogged road", "Uneven road / open chamber"}
DATE = datetime.fromisoformat

def text_key(value):
    return " ".join(unicodedata.normalize("NFKC", value or "").casefold().split())

def source_load():
    tables, catalog, columns = {}, [], {}
    for path in sorted(SOURCE.iterdir()):
        if path.suffix not in {".csv", ".geojson"}:
            continue
        if path.suffix == ".csv":
            with path.open(newline="", encoding="utf-8-sig") as fp:
                reader = csv.DictReader(fp)
                columns[path.stem] = list(reader.fieldnames)
                rows = []
                for row in reader:
                    for key,value in row.items():
                        if value == "":
                            row[key] = None
                        elif key in INT_RAW:
                            row[key] = int(value)
                        elif key in REAL_RAW:
                            row[key] = float(value)
                    rows.append(row)
                tables[path.stem] = rows
            count = len(rows)
        else:
            count = len(json.loads(path.read_text())["features"])
        catalog.append({"file":path.name,"table_name":path.stem if path.suffix == ".csv" else None,
                        "rows":count,"sha256":hashlib.sha256(path.read_bytes()).hexdigest()})
    tables["source_catalog"] = catalog
    return tables,columns

def group(rows, field):
    groups = defaultdict(list)
    for row in rows:
        groups[row[field]].append(row)
    return groups

def lookup(rows, key):
    d = {row[key]:row for row in rows}
    assert len(d) == len(rows), key
    return d

def distance_m(lat, lon, lat1, lon1, lat2=None, lon2=None):
    """Shortest distance to a segment in a local tangent-plane projection, in metres."""
    lat2,lon2 = (lat1 if lat2 is None else lat2),(lon1 if lon2 is None else lon2)
    coslat = math.cos(math.radians(lat))
    x1 = 111320 * (lon1-lon) * coslat
    x2 = 111320 * (lon2-lon) * coslat
    y1 = 111320 * (lat1-lat)
    y2 = 111320 * (lat2-lat)
    dx,dy = x2-x1,y2-y1
    k = min(1,max(0,-(x1*dx+y1*dy)/(dx*dx+dy*dy))) if dx or dy else 0
    return math.hypot(x1+k*dx,y1+k*dy)

def build_products(t):
    road = lookup(t["roads"],"road_id"); wards=lookup(t["wards"],"ward_code")
    rates = lookup(t["rate_card"],"repair_method"); contractors = lookup(t["contractors"],"contractor_id")
    complaints = lookup(t["complaints"],"complaint_id"); works = lookup(t["work_orders"],"work_order_id")
    locality_names = defaultdict(list)
    gazetteer = lookup(t["localities"],"locality")
    for loc in t["localities"]:
        for alias in [loc["locality"]]+(loc["aliases"] or "").split(";"):
            if alias.strip(): locality_names[text_key(alias)].append(loc)
    stations = {"Colaba":gazetteer["Colaba"],"Santacruz":gazetteer["Santacruz West"]}
    def station_for(lat,lon):
        return min(stations,key=lambda key:distance_m(lat,lon,stations[key]["lat"],stations[key]["lon"]))
    gauges = {r["road_id"]:station_for((r["start_lat"]+r["end_lat"])/2,(r["start_lon"]+r["end_lon"])/2) for r in road.values()}
    rain = {(d["station"],d["date"]):d["rainfall_mm"] for d in t["rainfall_daily"]}
    rain_by_station = group(t["rainfall_daily"],"station")
    tides = {date:max(r["height_m"] for r in ds) for date,ds in group(t["tides"],"date").items()}
    links = []
    work_ids = defaultdict(list)
    complaint_ids = defaultdict(list)
    for w in works.values():
        for cid in dict.fromkeys((w["linked_complaint_ids"] or "").split("|")):
            if cid:
                assert cid in complaints
                links.append({"complaint_id":cid,"work_order_id":w["work_order_id"]})
                work_ids[cid].append(w["work_order_id"]); complaint_ids[w["work_order_id"]].append(cid)
    t["complaint_links"] = links
    trace = []
    for cid,c in complaints.items():
        ids=work_ids[cid]; ws=[works[i] for i in ids]
        raw_locality = c["locality_text"] or ""
        raw_ward=c["ward_code"]; linked_ward=ws[0]["ward_code"] if ws else None
        working_ward=raw_ward or linked_ward
        choices=[x for x in locality_names.get(text_key(raw_locality),[]) if not working_ward or x["ward_code"]==working_ward]
        if not choices and raw_locality:
            prefix=text_key(raw_locality)+" "
            choices=[x for x in gazetteer.values() if text_key(x["locality"]).startswith(prefix) and (not working_ward or x["ward_code"]==working_ward)]
        loc=choices[0] if len(choices)==1 else None
        ward=working_ward or (loc["ward_code"] if loc else None)
        prov="Complaint" if raw_ward else "Work order" if linked_ward else "Locality" if loc else "Unknown"
        category=c["category_reported"]; loc_name=loc["locality"] if loc else None
        search=" ".join(str(s) for s in [cid,raw_locality,loc_name,ward,category,c["description"],c["language"],c["channel"],c["status"]]+ids+[q for w in ws for q in (w["road_id"],road[w["road_id"]]["road_name"],w["contractor_name"],w["repair_method"],w["work_type"])] if s)
        trace.append(dict(id=cid,ward=ward,ward_source=prov,locality=loc_name,locality_text=raw_locality,received=c["received_at"],issue=category,status=c["status"],channel=c["channel"],linked=len(ids),followup=int(not ids and c["status"] in {"Open","In Progress"}),work_ids="|".join(ids),search=text_key(search)))
    t["traceability"]=trace
    # Match only later, unlinked jobs to complaint-linked jobs of the same scope. Never remove source bills.
    def key(w):
        return tuple(w[s] for s in ("road_id","contractor_id","work_type","repair_method","area_sqm"))
    prior=defaultdict(list); dup={}
    for w in sorted(works.values(),key=lambda r:(r["assigned_at"],r["work_order_id"])):
        if w["linked_complaint_ids"]:
            prior[key(w)].append(w); continue
        possible=[p for p in prior[key(w)] if 0 < (DATE(w["assigned_at"])-DATE(p["assigned_at"])).total_seconds()/86400 <= 7 and p["cost_inr"]>0 and abs(w["cost_inr"]-p["cost_inr"])/p["cost_inr"]<=.05]
        if possible: dup[w["work_order_id"]]=possible[-1]["work_order_id"]
    accounts=[]; cohorts=defaultdict(list)
    for oid,w in works.items():
        r=road[w["road_id"]]; wa=wards[w["ward_code"]]; ct=contractors[w["contractor_id"]]
        tariff=rates[w["repair_method"]]; unit=tariff["unit"]; qty=w["area_sqm"] if unit=="per sqm" else 1
        benchmark=round(qty*tariff["standard_rate_inr"]); billed=w["cost_inr"]; variance=billed-benchmark; pct=100*variance/benchmark
        price=int(pct>30); met=int(w["sla_met"]=="Y"); reopened=int(w["reopened_within_30d"]=="Y")
        raw=40*met+35*(1-reopened)+25*(1-price)
        g=gauges[r["road_id"]]; rain_mm=rain.get((g,w["assigned_at"][:10]))
        cohort=(w["work_type"],wa["low_lying_index"]>=.6,"unknown" if rain_mm is None else "heavy" if rain_mm>=64.5 else "normal")
        cohorts[cohort].append(raw)
        ids=complaint_ids[oid]; elapsed=None
        if ids:
            elapsed=round((DATE(w["completed_at"])-min(DATE(complaints[c]["received_at"]) for c in ids)).total_seconds()/3600,2)
        search=text_key(" ".join(str(f) for f in [oid,w["ward_code"],r["road_id"],r["road_name"],ct["contractor_id"],ct["contractor_name"],w["work_type"],w["repair_method"],w["engineer_remark"],dup.get(oid)]+ids if f))
        accounts.append(dict(id=oid,ward=w["ward_code"],road=r["road_id"],road_name=r["road_name"],contractor=ct["contractor_id"],contractor_name=ct["contractor_name"],issue=w["work_type"],method=w["repair_method"],assigned=w["assigned_at"],completed=w["completed_at"],area=w["area_sqm"],qty=qty,unit=unit,rate=tariff["standard_rate_inr"],billed=billed,benchmark=benchmark,variance=variance,variance_pct=round(pct,2),price_flag=price,sla_met=met,sla_hours=w["sla_hours"],elapsed=elapsed,reopened=reopened,dlp=int(r["under_dlp"]=="Y" and billed>0),duplicate=dup.get(oid),linked=len(ids),raw_score=raw,cohort=cohort,rain_mm=rain_mm,search=search))
    city=statistics.mean(a["raw_score"] for a in accounts)
    for a in accounts:
        scores=cohorts[a.pop("cohort")]
        expected=(sum(scores)+20*city)/(len(scores)+20)
        a["case_score"]=round(expected,4)
    t["accountability"]=accounts
    by_road=group(accounts,"road"); methods=group(accounts,"method"); traffic=lookup(t["traffic"],"road_id")
    incidents=group(t["accidents"],"road_id"); facilities=group(t["facilities"],"ambulance_entry_road")
    nexts=[]
    for rid,r in road.items():
        wa=wards[r["ward_code"]]; g=gauges[rid]; observations=rain_by_station[g]
        heavy=sum(d["rainfall_mm"]>=64.5 for d in observations)
        tr=traffic[rid]; history=by_road[rid]; crash=incidents[rid]; fac=facilities[rid]
        arr=sorted(((distance_m(h["lat"],h["lon"],r["start_lat"],r["start_lon"],r["end_lat"],r["end_lon"]),h) for h in t["flood_hotspots"]),key=lambda pair:(pair[0],pair[1]["hotspot_id"]))
        dist,nearest=arr[0]; match=nearest if dist<=1000 else None
        wet=[] if not match else [d for d in observations if d["rainfall_mm"]>=match["flood_threshold_mm_per_day"]]
        compound=sum(tides[x["date"]]>=4.5 for x in wet) if match and match["tide_sensitive"]=="Y" else 0
        wet_days=len(wet); n=len(history); reopen=sum(a["reopened"] for a in history)
        related=[c for c in crash if c["probable_cause"] in RISK_CAUSES]; severe=sum(c["severity"] in {"Grievous","Fatal"} for c in related)
        hospitals=sum(f["type"]=="Hospital" for f in fac); schools=sum(f["type"]=="School" for f in fac)
        flood=9*wa["low_lying_index"]+3*min(heavy/25,1)
        if match: flood+=7*(1-dist/1000)+8*min(wet_days/20,1)+3*min(compound/6,1)
        parts=[round(k,1) for k in (flood,12*min(tr["peak_hour_vehicles"]/4200,1)+8*min(tr["congestion_index_0_10"]/10,1),20*min((len(related)+severe)/5,1),15*min((2*hospitals+schools)/3,1),10*min(reopen/5,1)+5*min(n/20,1))]
        score=round(sum(parts),1)
        issue=Counter(h["issue"] for h in history).most_common(1)
        main=issue[0][0] if issue else ""
        if (match and wet_days>=6) or main in {"Waterlogging","Choked drain / nullah overflow"}:
            method,action="Drain desilting","Inspect drainage and clear obstructed inlets"
        elif main=="Road cave-in": method,action="Excavation, pipeline repair, PQC patch","Inspect the subsurface and confirm repair scope"
        elif main=="Broken paver blocks": method,action="Paver blocks relaid","Inspect and reset damaged pavers"
        elif main=="Open or broken manhole": method,action="Manhole cover replaced + grating","Inspect chamber and replace damaged cover"
        elif tr["peak_hour_vehicles"]>=3000 and reopen>=2:
            method,action="Mastic asphalt","Inspect recurrent surface damage and scope a durable patch"
        else: method,action="Hot mix patch","Inspect the surface and scope a patch"
        tariff=rates[method]; qty=round(statistics.median(a["area"] for a in methods[method]),2) if tariff["unit"]=="per sqm" else 1
        dlp=int(r["under_dlp"]=="Y")
        nexts.append(dict(id=rid,ward=r["ward_code"],name=r["road_name"],segment=r["segment_no"],lat1=r["start_lat"],lon1=r["start_lon"],lat2=r["end_lat"],lon2=r["end_lon"],orders=n,linked=sum(a["linked"] for a in history),reopened=reopen,billed=sum(a["billed"] for a in history),dlp=dlp,score=score,tier="High" if score>=60 else "Elevated" if score>=35 else "Routine",station=g,heavy=heavy,wet_days=wet_days,compound=compound,hotspot=match["hotspot_id"] if match else None,hotspot_name=match["name"] if match else None,dist_m=round(dist,1) if match else None,flood_points=parts[0],traffic_points=parts[1],safety_points=parts[2],access_points=parts[3],history_points=parts[4],vehicles=tr["peak_hour_vehicles"],congestion=tr["congestion_index_0_10"],accidents=len(crash),road_accidents=len(related),severe=severe,facilities=len(fac),hospitals=hospitals,schools=schools,action=action,method=method,unit=tariff["unit"],qty=qty,rate=tariff["standard_rate_inr"],method_reopen=round(100*statistics.mean(a["reopened"] for a in methods[method]),2),estimate=round(qty*tariff["standard_rate_inr"]),search=text_key(" ".join(str(v) for v in (rid,r["ward_code"],wa["ward_name"],r["road_name"],main,method,action,match["name"] if match else "",g)))))
    t["next_rupee"]=nexts
    return city

def compact(v):
    return json.dumps(v,ensure_ascii=False,separators=(",",":"),allow_nan=False)

def schema(columns):
    lines=['// Generated by scripts/import_data.py from the pinned source headers and explicit product types.',
           'import { sqliteTable, text, integer, real, primaryKey, index } from "drizzle-orm/sqlite-core";','']
    for table,cols in columns.items():
        keys=KEYS[table]; raw=table not in FIELD_ORDER
        lines.append(f'export const {table} = sqliteTable("{table}", {{')
        for col in cols:
            kind="integer" if col in (INT_RAW if raw else INT_FIELDS) else "real" if col in (REAL_RAW if raw else REAL_FIELDS) else "text"
            expr=f'{kind}("{col}")'
            if col in keys: expr+=".primaryKey()" if len(keys)==1 else ".notNull()"
            lines.append(f'  {col}: {expr},')
        constraints=[]
        if len(keys)>1:constraints.append('primaryKey({ columns: ['+', '.join('t.'+k for k in keys)+'] })')
        for name in INDEX.get(table,[]):constraints.append(f'index("{table}_{name}_idx").on(t.{name})')
        if constraints:
            lines.append('}, (t) => [');lines.extend('  '+c+',' for c in constraints);lines.append(']);')
        else:lines.append('});')
        lines.append('')
    (ROOT/'db'/'schema.ts').write_text('\n'.join(lines))

def build():
    tables,columns=source_load()
    city=build_products(tables)
    columns.update({t:c.split() for t,c in FIELD_ORDER.items()})
    for t,rows in tables.items():
        keys=KEYS[t]; assert len(set(tuple(row[k] for k in keys) for row in rows))==len(rows),t
    assert len(tables['traceability'])==len(tables['complaints'])==6501
    assert len(tables['accountability'])==len(tables['work_orders'])==2499
    assert len(tables['next_rupee'])==len(tables['roads'])==291
    assert len(tables['complaint_links'])==4948
    assert sum(r['cost_inr'] for r in tables['work_orders'])==sum(r['billed'] for r in tables['accountability'])==sum(r['billed'] for r in tables['next_rupee'])==134328183
    assert sum(r['benchmark'] for r in tables['accountability'])==124041200
    assert sum(bool(r['duplicate']) for r in tables['accountability'])==45
    assert sum(r['road_accidents']<=r['accidents'] for r in tables['next_rupee'])==291
    assert sum(r['facilities'] for r in tables['next_rupee'])==len(tables['facilities'])
    assert sum(r['accidents'] for r in tables['next_rupee'])==len(tables['accidents'])
    packs=[]
    def flush(tab,buff):
        b=('['+','.join(buff)+']').encode()
        assert len(b)<82000
        enc=base64.b64encode(gzip.compress(b,compresslevel=9,mtime=0)).decode()
        packs.append([tab,enc])
    for table,rows in tables.items():
        cols=columns[table]; buff=[]; size=2
        for row in rows:
            item=compact([row[c] for c in cols]); n=len(item.encode())+1
            if buff and size+n>PACK_LIMIT:flush(table,buff);buff=[];size=2
            buff.append(item);size+=n
        if buff:flush(table,buff)
    schema(columns)
    OUT.mkdir(exist_ok=True,parents=True)
    (OUT/'seed.json').write_text(compact(dict(version=VERSION,columns=columns,packs=packs)))
    counts={table:len(rows) for table,rows in tables.items()}
    (OUT/'meta.json').write_text(compact(dict(commit=COMMIT,cityScore=city,counts=counts)))
    print('Products',counts['traceability'],counts['accountability'],counts['next_rupee'],'Packs',len(packs),'City',round(city,4))
    print('Tiers',dict(Counter(r['tier'] for r in tables['next_rupee'])), 'RD0077', next((r['score'],r['estimate']) for r in tables['next_rupee'] if r['id']=='RD0077'))

if __name__=='__main__':build()
