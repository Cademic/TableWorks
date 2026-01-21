# Tableworks Project Requirements

## Contents

1. [Why do we need Requirements?](#why-do-we-need-requirements)
2. [Project Overview](#project-overview)
   - 2.1 [Project Purpose](#project-purpose)
   - 2.2 [Key Features](#key-features)
   - 2.3 [Target Users](#target-users)
   - 2.4 [Technology Stack](#technology-stack)
   - 2.5 [Project Goals](#project-goals)
3. [Design Planning Summary](#design-planning-summary)
   - 3.1 [Architecture Overview](#architecture-overview)
   - 3.2 [Design Principles](#design-principles)
   - 3.3 [Frontend Design Approach](#frontend-design-approach)
   - 3.4 [Backend Design Approach](#backend-design-approach)
   - 3.5 [Database Design Strategy](#database-design-strategy)
   - 3.6 [Security Design](#security-design)
   - 3.7 [Collaboration Design](#collaboration-design)
   - 3.8 [Testing Strategy](#testing-strategy)
   - 3.9 [Deployment Planning](#deployment-planning)
   - 3.10 [Future Expansion Planning](#future-expansion-planning)
4. [User Stories](#user-stories)
5. [Functional Requirements](#functional-requirements)
   - 5.1 [FR1: Quick Note Writing](#fr1-quick-note-writing)
   - 5.2 [FR2: Note Organization](#fr2-note-organization)
   - 5.3 [FR3: Collaborative Projects with Date/Time Constraints](#fr3-collaborative-projects-with-datetime-constraints)
   - 5.4 [FR4: Light/Dark Mode](#fr4-lightdark-mode)
   - 5.5 [FR5: Admin User and Note Viewing](#fr5-admin-user-and-note-viewing)
   - 5.6 [FR6: Admin Moderation Interface](#fr6-admin-moderation-interface)
6. [Nonfunctional Requirements](#nonfunctional-requirements)
   - 6.1 [NFR1: Performance Requirements](#nfr1-performance-requirements)
   - 6.2 [NFR2: Security Requirements](#nfr2-security-requirements)
   - 6.3 [NFR3: Scalability Requirements](#nfr3-scalability-requirements)
   - 6.4 [NFR4: Usability and Accessibility Requirements](#nfr4-usability-and-accessibility-requirements)
   - 6.5 [NFR5: Reliability and Availability Requirements](#nfr5-reliability-and-availability-requirements)
   - 6.6 [NFR6: Compatibility Requirements](#nfr6-compatibility-requirements)
   - 6.7 [NFR7: Data Integrity and Backup Requirements](#nfr7-data-integrity-and-backup-requirements)
   - 6.8 [NFR8: Maintainability Requirements](#nfr8-maintainability-requirements)
   - 6.9 [NFR9: Portability Requirements](#nfr9-portability-requirements)
   - 6.10 [NFR10: Notification and Real-time Requirements](#nfr10-notification-and-real-time-requirements)

## Why do we need Requirements?
- These Use Cases help desgin and plan the way for the developers to create the application. Allowing for faster deployment with less time wasted.

## Project Overview

TableWorks is a modern web application designed to serve as a comprehensive productivity platform that combines note-taking, project management, and collaboration capabilities. The application addresses the need for a unified workspace where users can quickly capture ideas, organize information efficiently, and collaborate with team members on time-sensitive projects.

### Project Purpose
The primary purpose of TableWorks is to provide users with a fast, intuitive, and organized way to manage their personal and professional productivity needs. The application eliminates the need for multiple tools by integrating note-taking, project planning, and collaboration features into a single platform.

### Key Features
- **Quick Note Creation**: Rapid note-taking with keyboard shortcuts and auto-save functionality
- **Advanced Organization**: Notes organized using folders, tags, and table layouts with sorting and filtering capabilities
- **Collaborative Projects**: Team-based project management with date/time constraints, role-based access, and real-time collaboration
- **Theme Customization**: Light/dark mode support with system preference detection
- **Admin Management**: Comprehensive admin dashboard for user management and content moderation

### Target Users
- **Primary Users**: Individuals and professionals who need efficient note-taking and project management tools
- **Collaborative Teams**: Groups working on shared projects with deadlines and milestones
- **Administrators**: Platform administrators who need oversight and moderation capabilities

### Technology Stack
- **Frontend**: React with TypeScript, built using Vite
- **Backend**: ASP.NET (C#) RESTful API
- **Database**: PostgreSQL or MongoDB
- **Future Platforms**: Desktop applications (Windows, macOS, Linux) and iOS mobile app

### Project Goals
1. Provide a fast and intuitive user experience for note creation and management
2. Enable efficient data organization through table layouts and advanced filtering
3. Facilitate seamless collaboration on projects with multiple users
4. Ensure scalability and performance for growing user base
5. Maintain security and data integrity for user information
6. Support future expansion to desktop and mobile platforms

## Design Planning Summary

### Architecture Overview
TableWorks follows a three-tier architecture pattern:
1. **Presentation Layer**: React-based frontend providing the user interface
2. **Application Layer**: ASP.NET backend API handling business logic and data processing
3. **Data Layer**: Database (PostgreSQL/MongoDB) for persistent data storage

### Design Principles
- **User-Centric Design**: All features prioritize user experience and ease of use
- **Performance First**: Optimized for speed with auto-save, efficient queries, and responsive UI
- **Scalability**: Architecture designed to support horizontal scaling and future growth
- **Security**: Multi-layered security approach with authentication, authorization, and data encryption
- **Accessibility**: WCAG 2.1 Level AA compliance for inclusive design
- **Maintainability**: Modular architecture with clear separation of concerns

### Frontend Design Approach
- **Component-Based Architecture**: Reusable React components for consistent UI/UX
- **State Management**: Centralized state management for user data, notes, and projects
- **Responsive Design**: Mobile-first approach supporting desktop, tablet, and mobile devices
- **Theme System**: CSS variables and theme context for seamless light/dark mode switching
- **Performance Optimization**: Code splitting, lazy loading, and efficient rendering strategies

### Backend Design Approach
- **RESTful API**: Standard REST endpoints for all operations (GET, POST, PUT, DELETE)
- **Layered Architecture**: Separation of controllers, services, and data access layers
- **Authentication & Authorization**: JWT-based authentication with role-based access control (RBAC)
- **Error Handling**: Comprehensive error handling with appropriate HTTP status codes
- **API Versioning**: Support for API versioning to maintain backward compatibility

### Database Design Strategy
- **Normalized Schema**: Well-structured database schema to minimize data redundancy
- **Indexing Strategy**: Strategic indexes on frequently queried fields (user IDs, dates, tags)
- **Data Relationships**: Proper foreign key relationships ensuring referential integrity
- **Audit Logging**: Separate tables for tracking user actions and admin operations
- **Backup & Recovery**: Automated backup strategy with point-in-time recovery capabilities

### Security Design
- **Authentication**: Secure token-based authentication (JWT) with refresh token mechanism
- **Password Security**: Strong hashing algorithms (bcrypt/Argon2) with salt
- **HTTPS Enforcement**: All communications encrypted in transit
- **Input Validation**: Server-side validation for all user inputs
- **SQL Injection Prevention**: Parameterized queries and ORM usage
- **XSS Protection**: Content sanitization and secure rendering practices
- **CSRF Protection**: Token-based CSRF protection for state-changing operations

### Collaboration Design
- **Real-time Updates**: WebSocket or Server-Sent Events for live collaboration updates
- **Conflict Resolution**: Operational transformation or last-write-wins strategy for concurrent edits
- **Role Management**: Granular permission system (owner, editor, viewer) for project access
- **Notification System**: In-app and email notifications for project events and deadlines

### Testing Strategy
- **Unit Testing**: Component and function-level testing for frontend and backend
- **Integration Testing**: API endpoint testing and database interaction testing
- **End-to-End Testing**: Complete user workflow testing
- **Performance Testing**: Load testing for concurrent users and response time validation
- **Security Testing**: Vulnerability scanning and penetration testing

### Deployment Planning
- **Development Environment**: Local development setup with hot-reload capabilities
- **Staging Environment**: Pre-production environment for testing and validation
- **Production Environment**: Scalable cloud infrastructure with load balancing
- **CI/CD Pipeline**: Automated build, test, and deployment processes
- **Monitoring**: Application performance monitoring and error tracking

### Future Expansion Planning
- **Desktop Application**: Electron or similar framework for cross-platform desktop apps
- **iOS Application**: Native iOS development using Swift/SwiftUI
- **API Extensibility**: Design API to support future mobile and desktop clients
- **Feature Extensibility**: Modular design allowing easy addition of new features

## User Stories
- As a **User** I want to access to write notes quickly.
- As a **User** I want my notes to be easily orgranized.
- As a **User** I want to create projects with date/time constraints with other users.
- As a **User** I want Light/Dark mode features.
- As an **Admin** I want to view all users information and notes.
- As an **Admin** I want an easy backend UI for moderation.

## Functional Requirements

### FR1: Quick Note Writing (User Story: "As a User I want to access to write notes quickly.")
- **FR1.1**: The system shall provide a quick note creation interface accessible from any page via a keyboard shortcut or floating action button.
- **FR1.2**: The system shall allow users to create notes with a minimal number of clicks (maximum 2 clicks from any page).
- **FR1.3**: The system shall auto-save notes as the user types, with a save indicator showing the last saved timestamp.
- **FR1.4**: The system shall support keyboard shortcuts for quick note creation (e.g., Ctrl+N or Cmd+N).
- **FR1.5**: The system shall allow users to create notes without requiring a title initially (title can be auto-generated or added later).
- **FR1.6**: The system shall provide a quick note template with basic formatting options (bold, italic, lists).

### FR2: Note Organization (User Story: "As a User I want my notes to be easily organized.")
- **FR2.1**: The system shall allow users to organize notes into folders, collections, or categories.
- **FR2.2**: The system shall support tagging notes with multiple tags for cross-categorization.
- **FR2.3**: The system shall provide a search functionality that allows users to search notes by title, content, tags, or date.
- **FR2.4**: The system shall allow users to sort notes by date created, date modified, title (alphabetically), or custom order.
- **FR2.5**: The system shall display notes in a table layout format as specified in the project goals, with sortable columns.
- **FR2.6**: The system shall allow users to filter notes by tags, folders, date range, or project association.
- **FR2.7**: The system shall support bulk operations on notes (e.g., move multiple notes, delete multiple notes, tag multiple notes).

### FR3: Collaborative Projects with Date/Time Constraints (User Story: "As a User I want to create projects with date/time constraints with other users.")
- **FR3.1**: The system shall allow users to create projects with a name, description, and date/time constraints (start date, end date, deadlines).
- **FR3.2**: The system shall allow project creators to invite other users to collaborate on projects via email or username.
- **FR3.3**: The system shall support role-based access control for project collaborators (e.g., owner, editor, viewer).
- **FR3.4**: The system shall send notifications to users when they are invited to a project or when project deadlines are approaching.
- **FR3.5**: The system shall allow project members to add tasks, notes, and lists to the project.
- **FR3.6**: The system shall display project timelines and deadlines in a calendar or timeline view.
- **FR3.7**: The system shall allow users to set reminders for project milestones and deadlines.
- **FR3.8**: The system shall track project progress and display completion status.

### FR4: Light/Dark Mode (User Story: "As a User I want Light/Dark mode features.")
- **FR4.1**: The system shall provide a theme toggle button accessible from the main navigation or user settings.
- **FR4.2**: The system shall support three theme modes: Light mode, Dark mode, and System preference (auto-detect).
- **FR4.3**: The system shall persist the user's theme preference across sessions and devices.
- **FR4.4**: The system shall apply theme changes immediately without requiring a page refresh.
- **FR4.5**: The system shall ensure all UI components, including tables, forms, and modals, properly adapt to the selected theme.

### FR5: Admin User and Note Viewing (User Story: "As an Admin I want to view all users information and notes.")
- **FR5.1**: The system shall provide an admin dashboard accessible only to users with admin role.
- **FR5.2**: The system shall display a list of all registered users with basic information (username, email, registration date, account status).
- **FR5.3**: The system shall allow admins to view detailed user information including profile data, activity logs, and account statistics.
- **FR5.4**: The system shall allow admins to view all notes created by any user, with filtering options by user, date, or content.
- **FR5.5**: The system shall provide search functionality for admins to find specific users or notes.
- **FR5.6**: The system shall display user statistics such as total notes created, projects participated in, and last login date.

### FR6: Admin Moderation Interface (User Story: "As an Admin I want an easy backend UI for moderation.")
- **FR6.1**: The system shall provide a dedicated admin moderation panel with intuitive navigation and clear sections.
- **FR6.2**: The system shall allow admins to suspend, activate, or delete user accounts with appropriate confirmation dialogs.
- **FR6.3**: The system shall allow admins to delete, hide, or flag inappropriate notes or content.
- **FR6.4**: The system shall provide bulk moderation actions for efficient management (e.g., bulk user suspension, bulk content deletion).
- **FR6.5**: The system shall maintain an audit log of all admin moderation actions (who performed the action, what action, when, and on which user/content).
- **FR6.6**: The system shall provide filters and sorting options in the moderation interface for easy content review.
- **FR6.7**: The system shall display flagged content or reported items in a separate queue for priority review.

## Nonfunctional Requirements

### NFR1: Performance Requirements
- **NFR1.1**: The system shall load the initial page within 2 seconds under normal network conditions (3G or better).
- **NFR1.2**: The system shall respond to user actions (button clicks, form submissions) within 500 milliseconds.
- **NFR1.3**: The system shall support auto-save operations without noticeable performance degradation, with saves occurring at most every 2 seconds during active typing.
- **NFR1.4**: The system shall support search operations that return results within 1 second for queries on up to 10,000 notes per user.
- **NFR1.5**: The system shall handle table rendering and sorting operations smoothly for tables containing up to 1,000 rows without pagination delays.
- **NFR1.6**: The system shall support concurrent operations from multiple users on the same project without data conflicts or significant performance degradation.

### NFR2: Security Requirements
- **NFR2.1**: The system shall implement secure authentication using industry-standard protocols (e.g., JWT tokens, OAuth 2.0).
- **NFR2.2**: The system shall encrypt all passwords using strong hashing algorithms (e.g., bcrypt, Argon2) with appropriate salt.
- **NFR2.3**: The system shall enforce HTTPS for all communications between client and server.
- **NFR2.4**: The system shall implement role-based access control (RBAC) to ensure users can only access data they are authorized to view or modify.
- **NFR2.5**: The system shall protect against common security vulnerabilities including SQL injection, XSS (Cross-Site Scripting), and CSRF (Cross-Site Request Forgery) attacks.
- **NFR2.6**: The system shall implement session management with secure session tokens that expire after a period of inactivity (default: 30 minutes).
- **NFR2.7**: The system shall log all authentication attempts, including failed login attempts, for security auditing purposes.
- **NFR2.8**: The system shall encrypt sensitive data at rest in the database.

### NFR3: Scalability Requirements
- **NFR3.1**: The system shall support at least 1,000 concurrent users without performance degradation.
- **NFR3.2**: The system architecture shall be designed to scale horizontally to support future growth to 10,000+ concurrent users.
- **NFR3.3**: The system shall handle database growth to support millions of notes and thousands of projects.
- **NFR3.4**: The system shall implement efficient database indexing to maintain query performance as data volume increases.
- **NFR3.5**: The system shall support load balancing for high availability and performance distribution.

### NFR4: Usability and Accessibility Requirements
- **NFR4.1**: The system shall comply with WCAG 2.1 Level AA accessibility standards to ensure usability for users with disabilities.
- **NFR4.2**: The system shall provide keyboard navigation support for all interactive elements.
- **NFR4.3**: The system shall support screen reader compatibility for visually impaired users.
- **NFR4.4**: The system shall provide clear error messages and user feedback for all user actions.
- **NFR4.5**: The system shall maintain consistent UI/UX patterns throughout the application.
- **NFR4.6**: The system shall provide tooltips and help text for complex features.
- **NFR4.7**: The system shall support responsive design for optimal viewing on desktop, tablet, and mobile devices (minimum viewport width: 320px).

### NFR5: Reliability and Availability Requirements
- **NFR5.1**: The system shall maintain 99.5% uptime availability (approximately 3.65 days of downtime per year).
- **NFR5.2**: The system shall implement automatic error handling and graceful degradation when non-critical features fail.
- **NFR5.3**: The system shall provide data backup mechanisms with daily automated backups.
- **NFR5.4**: The system shall support data recovery with a maximum data loss window of 24 hours in case of system failure.
- **NFR5.5**: The system shall implement transaction rollback capabilities to maintain data integrity during failures.
- **NFR5.6**: The system shall provide health check endpoints for monitoring system status.

### NFR6: Compatibility Requirements
- **NFR6.1**: The system shall support modern web browsers including Chrome (latest 2 versions), Firefox (latest 2 versions), Safari (latest 2 versions), and Edge (latest 2 versions).
- **NFR6.2**: The system shall be compatible with desktop operating systems (Windows 10+, macOS 10.15+, Linux).
- **NFR6.3**: The system shall function correctly on mobile browsers (iOS Safari 14+, Chrome Mobile).
- **NFR6.4**: The system shall maintain backward compatibility with API versions for at least 6 months after new versions are released.

### NFR7: Data Integrity and Backup Requirements
- **NFR7.1**: The system shall implement database constraints to ensure referential integrity.
- **NFR7.2**: The system shall validate all user inputs on both client and server side to prevent invalid data entry.
- **NFR7.3**: The system shall maintain audit trails for critical operations (note creation, deletion, project modifications, admin actions).
- **NFR7.4**: The system shall implement automated daily backups with retention of at least 30 days.
- **NFR7.5**: The system shall support point-in-time recovery capabilities.

### NFR8: Maintainability Requirements
- **NFR8.1**: The system codebase shall follow consistent coding standards and best practices for both frontend and backend.
- **NFR8.2**: The system shall include comprehensive code documentation and API documentation.
- **NFR8.3**: The system shall implement logging mechanisms for debugging and monitoring (application logs, error logs, access logs).
- **NFR8.4**: The system architecture shall be modular to facilitate future updates and feature additions.
- **NFR8.5**: The system shall support automated testing with unit tests, integration tests, and end-to-end tests.

### NFR9: Portability Requirements
- **NFR9.1**: The system architecture shall be designed to facilitate future migration to desktop applications (Windows, macOS, Linux).
- **NFR9.2**: The system architecture shall be designed to facilitate future migration to iOS mobile applications.
- **NFR9.3**: The system shall use platform-agnostic technologies and APIs where possible to support cross-platform deployment.

### NFR10: Notification and Real-time Requirements
- **NFR10.1**: The system shall deliver notifications to users within 5 seconds of the triggering event.
- **NFR10.2**: The system shall support email notifications for project invitations and deadline reminders.
- **NFR10.3**: The system shall implement in-app notifications that do not disrupt user workflow.
- **NFR10.4**: The system shall support real-time updates for collaborative features (e.g., multiple users editing the same project) with conflict resolution mechanisms.