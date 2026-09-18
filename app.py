"""
OneFocus — Intelligent Single-Task Productivity Web App
Backend: Python 3 with Flask and SQLite3
"""

import os
import sqlite3
from datetime import datetime, date, timedelta
from flask import Flask, request, jsonify, g

DATABASE = os.path.join(os.path.dirname(__file__), 'onefocus.db')

app = Flask(__name__)

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
        db.execute('PRAGMA foreign_keys = ON;')
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
        if os.path.exists(schema_path):
            with open(schema_path, 'r') as f:
                db.cursor().executescript(f.read())
            db.commit()

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "runtime": "Python/Flask"})

@app.route('/api/tasks', methods=['GET'])
def list_tasks():
    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT * FROM tasks ORDER BY status ASC, importance ASC, id ASC')
    tasks = [dict(row) for row in cursor.fetchall()]
    return jsonify({"tasks": tasks})

@app.route('/api/today', methods=['GET'])
def today_focus():
    today = str(date.today())
    db = get_db()
    cursor = db.cursor()
    
    # Check if logged
    cursor.execute('''
        SELECT dl.*, t.name as task_name, t.task_type
        FROM daily_logs dl
        JOIN tasks t ON dl.task_id = t.id
        WHERE dl.date = ?
    ''', (today,))
    log = cursor.fetchone()
    
    # Check committed
    cursor.execute('SELECT task_id FROM daily_focus WHERE date = ?', (today,))
    focus = cursor.fetchone()
    
    committed_task = None
    if focus:
        cursor.execute('SELECT * FROM tasks WHERE id = ?', (focus['task_id'],))
        t = cursor.fetchone()
        if t:
            committed_task = dict(t)
            
    return jsonify({
        "date": today,
        "is_logged": bool(log),
        "logged_entry": dict(log) if log else None,
        "committed_task": committed_task
    })

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
