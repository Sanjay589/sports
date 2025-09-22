#!/usr/bin/env python3
"""
Database setup script for SAP Sports Analysis Platform
This script will create the necessary tables in SQL Server
"""

import sys
from database import db

def main():
    print("🚀 SAP Database Setup")
    print("=" * 30)
    
    print("📊 Connecting to SQL Server database...")
    print("Database: gitam2025")
    print("Server: localhost:1433")
    
    # Test connection
    if not db.connect():
        print("❌ Failed to connect to database")
        print("Please ensure:")
        print("1. SQL Server is running on localhost:1433")
        print("2. Database 'gitam2025' exists")
        print("3. User 'SA' has correct password 'Sanjay@25'")
        print("4. ODBC Driver 17 for SQL Server is installed")
        sys.exit(1)
    
    print("✅ Database connection successful!")
    
    # Initialize tables
    print("\n🔧 Creating database tables...")
    if db.initialize_database():
        print("✅ Database setup completed successfully!")
        print("\n📋 Created tables:")
        print("  - users (user accounts)")
        print("  - user_sessions (login sessions)")
        print("  - exercise_sessions (workout history)")
    else:
        print("❌ Database setup failed!")
        sys.exit(1)
    
    db.disconnect()
    print("\n🎉 SAP database is ready for use!")

if __name__ == "__main__":
    main()
