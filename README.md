# AWS Leave Management System

## Overview

The AWS Leave Management System is a fully serverless web application designed to streamline employee leave request and approval workflows. Employees can submit leave requests, track their leave status, and receive automated email notifications, while managers can review, approve, or reject requests through a centralized dashboard.

The application is built entirely on AWS cloud services using a scalable serverless architecture.

---

## Features

### Employee Portal

* Submit leave requests
* Select leave type
* Choose leave dates
* Provide leave reason
* Track leave request status
* View leave request history

### Manager Portal

* View all leave requests
* Approve leave requests
* Reject leave requests
* Monitor leave statuses
* Manage employee leave workflows

### Notifications

* Automated email notifications using Amazon SES
* Approval notifications
* Rejection notifications



## AWS Services Used

### Amazon S3

* Static website hosting
* Frontend deployment

### Amazon API Gateway

* REST API endpoints
* Request routing

### AWS Lambda

* Business logic execution
* Request processing
* Status updates
* Email triggering

### Amazon DynamoDB

* Leave request storage
* Status tracking
* Employee records

### Amazon SES (Simple Email Service)

* Automated email notifications
* Approval and rejection alerts



---

## System Architecture

```text
Employee / Manager
        │
        ▼
 Amazon S3 Website
        │
        ▼

 Amazon API Gateway
        │
        ▼
 AWS Lambda Functions
        │
        ▼
 Amazon DynamoDB

 AWS SES
    ▲
    │
 Lambda Notifications
```

---

## API Endpoints

### Submit Leave Request

POST `/leave-v2`

### Get All Requests

GET `/requests-v2`

### Get Employee Requests

GET `/my-requests-v2`

### Update Request Status

POST `/update-status-v2`

---

## Workflow

### Employee Workflow

1. Login to the system
2. Submit leave request
3. View request status
4. Receive email notification after approval or rejection

### Manager Workflow

1. Login to manager dashboard
2. Review leave requests
3. Approve or reject requests
4. Employee receives automated notification

---

## Project Highlights

* Fully serverless architecture
* Real-time leave tracking
* Automated approval workflow
* Cloud-native AWS implementation
* Responsive user interface
* Email notification integration
* Scalable and cost-efficient design


## Screenshots

### Home Page
![Home Page](screenshots/Home%20Page.png)

### Employee Portal
![Employee Portal](screenshots/Employee%20Portal.png)

### Employee Portal 2
![Employee Portal 2](screenshots/Employee%20Portal2.png)

### Manager Dashboard
![Manager Dashboard](screenshots/manager%20dashboard.png)

### Manager Dashboard 2
![Manager Dashboard 2](screenshots/Manager%20dashboard2.png)
