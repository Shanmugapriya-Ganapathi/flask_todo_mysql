# Flask Priority To-Do List (MySQL)

A minimal Flask app to manage tasks with priority levels stored in MySQL.

## Features
- Add tasks with priority (imp, mid, low)
- List tasks ordered by creation time
- Priority color coding (red/orange/green)
- Client-side validation to avoid empty submissions

## Setup
1) Clone/download and enter the project:
```
cd flask_todo_mysql
```
2) Create venv and install deps:
```
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```
3) Configure MySQL and schema:
```
mysql -u root -p < schema.sql
```
4) (Optional) set env vars for DB:
```
$env:DB_HOST="localhost"
$env:DB_USER="root"
$env:DB_PASSWORD="XXX"
$env:DB_NAME="todo_db"
```
5) Run the app:
```
flask run
# or
python app.py
```

## Screenshots
Add your captures under `screenshots/`:
- `screenshots/header.png`
- `screenshots/list.png`
- `screenshots/footer.png`

## Tech
- Flask, MySQL (mysql-connector-python)
- HTML5, CSS3, Vanilla JS

