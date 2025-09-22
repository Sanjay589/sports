import pyodbc  # pyright: ignore[reportMissingImports]
import os
from dotenv import load_dotenv  # pyright: ignore[reportMissingImports]

load_dotenv()

class DatabaseConnection:
    def __init__(self):
        # SQL Server connection string
        self.connection_string = (
            "DRIVER={ODBC Driver 17 for SQL Server};"
            "SERVER=localhost,1433;"
            "DATABASE=gitam2025;"
            "UID=SA;"
            "PWD=Sanjay@25;"
            "Encrypt=yes;"
            "TrustServerCertificate=yes;"
        )
        self.connection = None

    def connect(self):
        """Establish database connection"""
        try:
            self.connection = pyodbc.connect(self.connection_string)
            print("✅ Database connection established successfully")
            return True
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return False

    def disconnect(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            print("Database connection closed")

    def execute_query(self, query, params=None):
        """Execute a SELECT query and return results"""
        try:
            if not self.connection:
                if not self.connect():
                    return None
            
            cursor = self.connection.cursor()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            columns = [column[0] for column in cursor.description]
            results = []
            for row in cursor.fetchall():
                results.append(dict(zip(columns, row)))
            
            cursor.close()
            return results
        except Exception as e:
            print(f"❌ Query execution failed: {e}")
            return None

    def execute_update(self, query, params=None):
        """Execute an INSERT, UPDATE, or DELETE query"""
        try:
            if not self.connection:
                if not self.connect():
                    return False
            
            cursor = self.connection.cursor()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Update execution failed: {e}")
            if self.connection:
                self.connection.rollback()
            return False

    def create_users_table(self):
        """Create users table if it doesn't exist"""
        create_table_query = """
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
        CREATE TABLE users (
            id INT IDENTITY(1,1) PRIMARY KEY,
            username NVARCHAR(50) UNIQUE NOT NULL,
            password NVARCHAR(255) NOT NULL,
            email NVARCHAR(100) UNIQUE NOT NULL,
            first_name NVARCHAR(50),
            last_name NVARCHAR(50),
            age INT,
            gender NVARCHAR(10),
            height DECIMAL(5,2),
            weight DECIMAL(5,2),
            fitness_level NVARCHAR(20),
            health_issues NVARCHAR(500),
            fitness_goals NVARCHAR(500),
            emergency_contact NVARCHAR(100),
            phone NVARCHAR(20),
            profile_completed BIT DEFAULT 0,
            created_at DATETIME2 DEFAULT GETDATE(),
            updated_at DATETIME2 DEFAULT GETDATE()
        )
        """
        return self.execute_update(create_table_query)

    def create_sessions_table(self):
        """Create user sessions table if it doesn't exist"""
        create_table_query = """
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_sessions' AND xtype='U')
        CREATE TABLE user_sessions (
            id INT IDENTITY(1,1) PRIMARY KEY,
            user_id INT NOT NULL,
            session_token NVARCHAR(255) UNIQUE NOT NULL,
            created_at DATETIME2 DEFAULT GETDATE(),
            expires_at DATETIME2 NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """
        return self.execute_update(create_table_query)

    def create_exercise_sessions_table(self):
        """Create exercise sessions table if it doesn't exist"""
        create_table_query = """
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='exercise_sessions' AND xtype='U')
        CREATE TABLE exercise_sessions (
            id INT IDENTITY(1,1) PRIMARY KEY,
            user_id INT NOT NULL,
            exercise_type NVARCHAR(50) NOT NULL,
            video_path NVARCHAR(500),
            sit_up_count INT DEFAULT 0,
            form_score INT DEFAULT 0,
            feedback NVARCHAR(1000),
            created_at DATETIME2 DEFAULT GETDATE(),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """
        return self.execute_update(create_table_query)

    def initialize_database(self):
        """Initialize database with required tables"""
        print("🔧 Initializing database tables...")
        
        if not self.connect():
            return False
        
        # Create tables
        tables_created = (
            self.create_users_table() and
            self.create_sessions_table() and
            self.create_exercise_sessions_table()
        )
        
        if tables_created:
            print("✅ Database tables created successfully")
        else:
            print("❌ Failed to create database tables")
        
        self.disconnect()
        return tables_created

# Global database instance
db = DatabaseConnection()
