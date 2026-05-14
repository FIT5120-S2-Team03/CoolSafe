import psycopg2

DATABASE_URL = "postgresql://neondb_owner:npg_JOqe1RiXHc9Y@ep-dry-cloud-a7136g4i-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

POSTCODE_SUBURBS = {
    "3000": "Melbourne CBD",
    "3002": "East Melbourne",
    "3003": "West Melbourne",
    "3004": "Melbourne (St Kilda Rd)",
    "3006": "Southbank",
    "3008": "Docklands",
    "3011": "Footscray",
    "3013": "Yarraville",
    "3015": "Newport",
    "3031": "Kensington",
    "3032": "Moonee Ponds",
    "3051": "North Melbourne",
    "3052": "Parkville",
    "3053": "Carlton",
    "3054": "Carlton North",
    "3055": "Brunswick South",
    "3056": "Brunswick",
    "3065": "Fitzroy",
    "3066": "Collingwood",
    "3121": "Richmond",
    "3141": "South Yarra",
    "3181": "Prahran",
    "3205": "South Melbourne",
    "3207": "Port Melbourne",
}

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

for postcode, suburb in POSTCODE_SUBURBS.items():
    cur.execute(
        "UPDATE zone SET zone_name = %s WHERE postcode = %s",
        (suburb, postcode)
    )
    print(f"  {postcode} → {suburb}")

conn.commit()
conn.close()
print("✅ Done")