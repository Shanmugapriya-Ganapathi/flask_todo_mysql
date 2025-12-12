from flask import Flask, render_template, request, redirect, jsonify
import mysql.connector
import os

app = Flask(__name__)

db_config = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", "Shanmu_166"),
    "database": os.getenv("DB_NAME", "todo_db"),
}


def get_conn():
    return mysql.connector.connect(**db_config)


@app.route("/")
def index():
    # Initial render; data is fetched via JS from /tasks
    return render_template("index.html")


def fetch_tasks(priority=None, sort="created_at_desc"):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)

    where_clause = ""
    params = []
    if priority and priority in ("imp", "mid", "low"):
        where_clause = "WHERE priority = %s"
        params.append(priority)

    sort_map = {
        "created_at_desc": "created_at DESC",
        "created_at_asc": "created_at ASC",
        "priority": "FIELD(priority, 'imp', 'mid', 'low'), created_at DESC",
    }
    order_clause = sort_map.get(sort, "created_at DESC")

    query = f"SELECT id, content, priority, created_at FROM tasks {where_clause} ORDER BY {order_clause}"
    cur.execute(query, params)
    tasks = cur.fetchall()
    cur.close()
    conn.close()
    return tasks


@app.route("/tasks", methods=["GET"])
def list_tasks():
    priority = request.args.get("priority")
    sort = request.args.get("sort", "created_at_desc")
    tasks = fetch_tasks(priority, sort)
    return jsonify({"tasks": tasks})


@app.route("/add", methods=["POST"])
def add():
    content = request.form.get("content", "").strip()
    priority = request.form.get("priority", "low")
    if not content:
        return redirect("/")

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("INSERT INTO tasks (content, priority) VALUES (%s, %s)", (content, priority))
    task_id = cur.lastrowid
    conn.commit()
    cur.close()
    conn.close()
    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        return jsonify({"success": True, "id": task_id})
    return redirect("/")


@app.route("/tasks", methods=["POST"])
def add_task_json():
    data = request.get_json(force=True, silent=True) or {}
    content = (data.get("content") or "").strip()
    priority = data.get("priority") or "low"
    if not content or priority not in ("imp", "mid", "low"):
        return jsonify({"success": False, "error": "Invalid content or priority"}), 400

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("INSERT INTO tasks (content, priority) VALUES (%s, %s)", (content, priority))
    task_id = cur.lastrowid
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"success": True, "id": task_id})


@app.route("/tasks/<int:task_id>", methods=["PATCH"])
def update_task(task_id):
    data = request.get_json(force=True, silent=True) or {}
    content = data.get("content")
    priority = data.get("priority")

    if content is not None:
        content = content.strip()
        if not content:
            return jsonify({"success": False, "error": "Content required"}), 400
    if priority is not None and priority not in ("imp", "mid", "low"):
        return jsonify({"success": False, "error": "Invalid priority"}), 400

    fields = []
    params = []
    if content is not None:
        fields.append("content = %s")
        params.append(content)
    if priority is not None:
        fields.append("priority = %s")
        params.append(priority)

    if not fields:
        return jsonify({"success": False, "error": "Nothing to update"}), 400

    params.append(task_id)

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"UPDATE tasks SET {', '.join(fields)} WHERE id = %s", params)
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"success": True})


@app.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM tasks WHERE id = %s", (task_id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"success": True})


if __name__ == "__main__":
    app.run(debug=True)

