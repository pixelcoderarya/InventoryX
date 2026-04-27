# Changelog

All notable changes to the **InventoryX** project will be documented in this file.

## [1.0.1] - 2026-04-28

### Fixed
- **Database Schema**: Aligned `Product`, `Supplier`, `Transaction`, and `User` entities with physical MySQL schema.
- **Authentication**: Resolved `403 Forbidden` errors on `POST` and `DELETE` requests for user management.
- **Serialization**: Fixed infinite recursion loops in JSON API responses using `@JsonIgnore`.
- **Enum Mapping**: Added legacy support for `IN` and `OUT` transaction types to prevent system crashes.
- **User Management**: Added default field handling for `email` and `full_name` in `UserService`.

### Added
- Standard `.gitignore` for Maven projects.
- Auditing support via `createdAt` and `updatedAt` lifecycle hooks.
