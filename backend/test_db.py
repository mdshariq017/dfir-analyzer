from pymongo import MongoClient

# --- Your MongoDB connection details ---
MONGODB_URI = "mongodb+srv://dfir_app:qazplmedc100@finance-tracker.wvcboup.mongodb.net/dfir?retryWrites=true&w=majority&appName=finance-tracker"
DB_NAME = "dfir"

try:
    # Connect to MongoDB
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]

    # Ping the server to confirm connection
    client.admin.command("ping")
    print("✅ MongoDB connected successfully!")
    print(f"📂 Using database: {DB_NAME}")

    # Optional: create a test collection and insert one document
    result = db.test_connection.insert_one({"message": "Hello from DFIR Analyzer!"})
    print(f"🆔 Test document inserted with id: {result.inserted_id}")

    # Retrieve the inserted document
    doc = db.test_connection.find_one({"_id": result.inserted_id})
    print(f"📄 Retrieved document: {doc}")

except Exception as e:
    print("❌ Connection failed:")
    print(e)
