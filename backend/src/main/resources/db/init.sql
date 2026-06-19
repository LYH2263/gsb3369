CREATE DATABASE IF NOT EXISTS bookstore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bookstore;
SET NAMES utf8mb4;

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL
);

CREATE TABLE books (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_cart_book FOREIGN KEY (book_id) REFERENCES books(id)
);

CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_order_items_book FOREIGN KEY (book_id) REFERENCES books(id)
);

INSERT INTO users (username, password, role) VALUES
('admin', '123456', 'ADMIN'),
('user1', '123456', 'USER'),
('user2', '123456', 'USER'),
('user3', '123456', 'USER'),
('user4', '123456', 'USER'),
('user5', '123456', 'USER');

INSERT INTO books (name, author, price, stock) VALUES
('深入理解Java虚拟机', '周志明', 88.00, 50),
('Spring实战', 'Craig Walls', 69.00, 40),
('MyBatis从入门到精通', '刘增杰', 59.00, 60),
('重构：改善既有代码的设计', 'Martin Fowler', 99.00, 30),
('Effective Java 第3版', 'Joshua Bloch', 108.00, 40),
('Java并发编程实战', 'Brian Goetz', 89.00, 35),
('Java编程思想（第4版）', 'Bruce Eckel', 128.00, 20),
('Spring Boot实战', 'Craig Walls', 79.00, 45),
('Spring Cloud微服务实战', '周立', 75.00, 38),
('高性能MySQL（第3版）', 'Baron Schwartz', 119.00, 25),
('SQL必知必会', 'Ben Forta', 49.00, 80),
('图解HTTP', '上野宣', 58.00, 70),
('代码大全（第2版）', 'Steve McConnell', 118.00, 22),
('设计模式：可复用面向对象软件的基础', 'Erich Gamma 等', 99.00, 33),
('算法（第4版）', 'Robert Sedgewick', 109.00, 28),
('程序员修炼之道：通向务实的最高境界', 'Andrew Hunt', 88.00, 32),
('Head First 设计模式（中文版）', 'Eric Freeman', 79.00, 40),
('重构与模式', 'Joshua Kerievsky', 85.00, 35),
('领域驱动设计：软件核心复杂性应对之道', 'Eric Evans', 128.00, 20),
('实现领域驱动设计', 'Vaughn Vernon', 138.00, 18),
('整洁架构：软件结构与设计之道', 'Robert C. Martin', 99.00, 26),
('整洁Coder：代码整洁之道实践指南', 'Robert C. Martin', 89.00, 28),
('微服务设计', 'Sam Newman', 89.00, 30),
('Kubernetes权威指南', '郭旭', 119.00, 24),
('深入理解计算机系统（原书第3版）', 'Randal E. Bryant', 138.00, 22),
('编译原理（龙书）', 'Alfred V. Aho', 129.00, 16),
('UNIX环境高级编程（第3版）', 'W. Richard Stevens', 138.00, 18),
('Linux命令行与shell脚本编程大全', 'Richard Blum', 99.00, 34),
('JavaScript高级程序设计（第4版）', 'Matt Frisbie', 128.00, 27),
('你不知道的JavaScript（上卷）', 'Kyle Simpson', 69.00, 45),
('深入React技术栈', '程墨', 79.00, 36),
('深入浅出Vue.js', '刘博文', 75.00, 32),
('CSS世界', '张鑫旭', 88.00, 29),
('Python编程：从入门到实践', 'Eric Matthes', 89.00, 50),
('流畅的Python', 'Luciano Ramalho', 138.00, 20),
('Go语言实战', 'William Kennedy', 89.00, 30),
('Rust权威指南', 'Steve Klabnik', 109.00, 18),
('深入理解JVM字节码', '某某', 69.00, 40);

INSERT INTO cart_items (user_id, book_id, quantity) VALUES
(2, 1, 2), (2, 5, 1), (2, 12, 1),
(3, 3, 1), (3, 7, 2), (3, 15, 1),
(4, 2, 3), (4, 10, 1),
(5, 8, 1), (5, 20, 2),
(6, 1, 1), (6, 25, 1);

INSERT INTO orders (user_id, total_amount, status) VALUES
(2, 88.00, 'CREATED'), (2, 196.00, 'CREATED'), (2, 265.00, 'CREATED'), (2, 157.00, 'CREATED'), (2, 88.00, 'CREATED'),
(2, 177.00, 'CREATED'), (2, 108.00, 'CREATED'), (2, 246.00, 'CREATED'), (2, 59.00, 'CREATED'), (2, 88.00, 'CREATED'),
(3, 69.00, 'CREATED'), (3, 256.00, 'CREATED'), (3, 335.00, 'CREATED'), (3, 158.00, 'CREATED'), (3, 69.00, 'CREATED'),
(3, 147.00, 'CREATED'), (3, 226.00, 'CREATED'), (3, 88.00, 'CREATED'), (3, 167.00, 'CREATED'),
(4, 207.00, 'CREATED'), (4, 119.00, 'CREATED'), (4, 296.00, 'CREATED'), (4, 188.00, 'CREATED'), (4, 69.00, 'CREATED'),
(5, 79.00, 'CREATED'), (5, 391.00, 'CREATED'), (5, 178.00, 'CREATED'),
(6, 88.00, 'CREATED'), (6, 128.00, 'CREATED');

INSERT INTO order_items (order_id, book_id, quantity, price) VALUES
(1, 1, 1, 88.00),
(2, 1, 1, 88.00), (2, 5, 1, 108.00),
(3, 7, 1, 128.00), (3, 8, 1, 79.00), (3, 12, 1, 58.00),
(4, 5, 1, 108.00), (4, 11, 1, 49.00),
(5, 1, 1, 88.00),
(6, 10, 1, 119.00), (6, 12, 1, 58.00),
(7, 5, 1, 108.00),
(8, 13, 1, 118.00), (8, 7, 1, 128.00),
(9, 3, 1, 59.00),
(10, 1, 1, 88.00),
(11, 2, 1, 69.00),
(12, 7, 2, 128.00),
(13, 5, 1, 108.00), (13, 6, 1, 89.00), (13, 19, 1, 138.00),
(14, 8, 2, 79.00),
(15, 2, 1, 69.00),
(16, 1, 1, 88.00), (16, 3, 1, 59.00),
(17, 13, 1, 118.00), (17, 5, 1, 108.00),
(18, 1, 1, 88.00),
(19, 14, 1, 99.00), (19, 5, 1, 108.00),
(20, 10, 1, 119.00),
(21, 5, 1, 108.00), (21, 6, 1, 89.00), (21, 14, 1, 99.00),
(22, 8, 1, 79.00), (22, 15, 1, 109.00),
(23, 2, 1, 69.00), (23, 3, 1, 59.00), (23, 4, 1, 99.00),
(24, 2, 1, 69.00),
(25, 8, 1, 79.00),
(26, 17, 1, 79.00), (26, 18, 1, 85.00), (26, 19, 1, 128.00), (26, 20, 1, 99.00),
(27, 3, 1, 59.00), (27, 10, 1, 119.00),
(28, 1, 1, 88.00),
(29, 27, 1, 128.00);
