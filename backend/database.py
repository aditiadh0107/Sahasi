"""
Database connection for Sahasi API
Simple PostgreSQL connection using psycopg2
"""
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Get a database connection with RealDictCursor for dict-like results"""
    return psycopg2.connect(
        host="localhost",
        database="sahasi_db",
        user="aditidump",
        cursor_factory=RealDictCursor
    )

def execute_query(query, params=None, fetch=True):
    """Helper to execute a query and return results"""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(query, params)
        if fetch:
            result = cur.fetchall()
            conn.commit()
            cur.close()
            conn.close()
            return result
        else:
            conn.commit()
            cur.close()
            conn.close()
            return None
    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()
        raise e
