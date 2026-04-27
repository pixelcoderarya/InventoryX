# 📦 InventoryX | Premium Inventory Management System

[![Java](https://img.shields.io/badge/Java-17%2B-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**InventoryX** is a high-performance, enterprise-ready inventory management solution built with a robust Spring Boot backend and an interactive Java Swing frontend. It provides full control over stock movements, supplier relationships, and team management with role-based security.

---

## 🚀 Key Features

### 🔐 Advanced Security
- **JWT Authentication**: Secure stateless authentication for all API endpoints.
- **Role-Based Access (RBAC)**: Fine-grained permissions for `ADMIN`, `MANAGER`, and `STAFF`.
- **Encrypted Storage**: Industry-standard BCrypt password hashing.

### 📦 Inventory & Stock
- **Smart Tracking**: Real-time SKU tracking with low-stock alerts.
- **Movement History**: Detailed logs for every Stock In, Stock Out, Purchase, and Sale.
- **Batch Management**: Support for batch numbers, lot tracking, and manufacturing/expiry dates.

### 🤝 Relationship Management
- **Supplier Database**: Comprehensive vendor management with transaction history.
- **Team Collaboration**: Manage team members, update roles, and track activity.

---

## 🛠️ Tech Stack

- **Backend**: Spring Boot 3.x, Spring Security, JPA/Hibernate
- **Database**: MySQL 8.0
- **Frontend**: Java Swing (Desktop Interface), HTML5/JS (Web API ready)
- **Security**: JSON Web Tokens (JWT), BCrypt
- **Build Tool**: Maven

---

## 🚦 Getting Started

### 1️⃣ Database Initialization
Create a database named `inventory_db` and run the provided SQL script:
```bash
mysql -u root -p inventory_db < database/init.sql
```

### 2️⃣ Configuration
Update `src/main/resources/application.properties` with your MySQL credentials:
```properties
spring.datasource.username=your_user
spring.datasource.password=your_password
```

### 3️⃣ Run the Application
Start the backend server:
```bash
mvn spring-boot:run
```

The system will automatically initialize a default administrator:
- **User**: `admin`
- **Pass**: `admin123`

---

## 📂 Project Structure

```text
com.arya.inventory
├── config/      # Security & JWT Configuration
├── controller/  # REST API Layer
├── entity/      # JPA Models (Product, User, etc.)
├── service/     # Business Logic
├── repository/  # Database Access (Spring Data JPA)
└── frontend/    # Java Swing Desktop UI
```

---

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Developed with ❤️ by the InventoryX Team*
