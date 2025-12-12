CREATE DATABASE todo_db;
USE todo_db;

CREATE TABLE tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  content VARCHAR(255) NOT NULL,
  priority ENUM('imp', 'mid', 'low') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

