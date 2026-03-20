# Customer Portal & Ticket Management System

## Real Estate Flat Owner Portal (MySQL Based)

This document describes the architecture for a **Customer Portal
System** where flat owners can log in, view their property details, and
raise service tickets. The system will support **Admin, Staff, and End
User (Flat Owner)** roles and will be accessible through both **Web
Portal and Mobile App**.

------------------------------------------------------------------------

# 1. System Purpose

The goal of this system is to provide a centralized portal for property
owners and management to handle:

-   Flat owner login access
-   Property details visibility
-   Complaint / issue ticket management
-   Issue tracking
-   Communication between owners and management
-   Admin control panel
-   Staff assignment workflow

------------------------------------------------------------------------

# 2. User Roles

## Admin

Full system control.

Permissions: - Create projects - Add flats - Assign owners - Create
staff accounts - Manage tickets - Generate reports - Send notifications

------------------------------------------------------------------------

## Staff

Maintenance or CRM team members.

Permissions: - View assigned tickets - Update ticket status - Add
comments - Upload work updates - Close tickets

------------------------------------------------------------------------

## End User (Flat Owner)

Permissions: - Login to portal - View flat details - Raise service
tickets - Track ticket status - Upload attachments - Communicate with
support

------------------------------------------------------------------------

# 3. System Platforms

## Web Portal

Used by: - Admin - Staff - Customers

Example URL:

portal.yourproject.com

------------------------------------------------------------------------

## Mobile App

Customer mobile application with:

-   Login
-   Ticket creation
-   Ticket tracking
-   Notifications
-   Communication

Recommended framework: - Flutter or React Native

------------------------------------------------------------------------

# 4. Technology Stack

Frontend - React.js / Next.js

Backend - Node.js (Express) OR Laravel (PHP)

Database - MySQL

Mobile App - Flutter / React Native

Hosting - AWS / DigitalOcean / VPS

Authentication - JWT or Session Authentication

------------------------------------------------------------------------

# 5. Database Structure (MySQL)

## Users Table

## users

id name email mobile password role created_at updated_at

Roles:

-   admin
-   staff
-   customer

------------------------------------------------------------------------

## Projects Table

## projects

id project_name location builder_name created_at

------------------------------------------------------------------------

## Flats Table

## flats

id project_id tower floor flat_number area owner_id created_at

------------------------------------------------------------------------

## Tickets Table

## tickets

id ticket_number user_id flat_id title description category priority
status assigned_staff created_at updated_at

Ticket status:

-   Open
-   In Progress
-   Resolved
-   Closed

------------------------------------------------------------------------

## Ticket Updates Table

## ticket_updates

id ticket_id message updated_by attachment created_at

------------------------------------------------------------------------

# 6. Ticket Workflow

Customer raises issue:

Customer Login ↓ Create Ticket ↓ Admin assigns staff ↓ Staff works on
issue ↓ Status updates ↓ Customer tracks progress ↓ Issue resolved

------------------------------------------------------------------------

# 7. Core Features

### Customer Dashboard

Displays:

-   Flat information
-   Open tickets
-   Ticket history
-   Notifications

------------------------------------------------------------------------

### Ticket Management

Features:

-   Issue creation
-   Priority selection
-   Image upload
-   Staff assignment
-   Status updates

------------------------------------------------------------------------

### Admin Dashboard

Admin can:

-   Manage users
-   Manage flats
-   Manage tickets
-   Generate reports
-   Monitor system activity

------------------------------------------------------------------------

# 8. Notifications

The system can send:

-   Email notifications
-   WhatsApp notifications
-   Push notifications (mobile app)

Examples:

-   Ticket created
-   Ticket assigned
-   Ticket resolved

------------------------------------------------------------------------

# 9. Folder Structure (Example)

project-root

backend/ controllers/ models/ routes/ services/

frontend/ pages/ components/ dashboard/

mobile-app/ screens/ widgets/ services/

database/ migrations/ schema.sql

------------------------------------------------------------------------

# 10. Minimum Viable Product (MVP)

Phase 1

-   User authentication
-   Flat owner portal
-   Ticket creation
-   Ticket tracking
-   Admin panel

Phase 2

-   Staff assignment
-   Notifications
-   Attachments

Phase 3

-   Mobile app
-   Analytics dashboard

------------------------------------------------------------------------

# 11. Future Features

Possible upgrades:

-   Maintenance payment system
-   Document center
-   Visitor management
-   Society announcements
-   WhatsApp integration
-   AI support assistant

------------------------------------------------------------------------

# 12. Development Notes

Recommended workflow when using Claude AI inside Visual Studio / VS
Code:

1.  Generate backend API
2.  Build database schema
3.  Create admin panel
4.  Build customer dashboard
5.  Integrate ticket system
6.  Build mobile app

------------------------------------------------------------------------

# End of Document
