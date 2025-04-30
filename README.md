# Eclinic2

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.8.

## Development server

## Breakpoints

middle-size: 768px

## CI/CD, Deployment Automation

- Utilized GitHub Actions workflow for building and testing.
- The project was deployed via Azure static web app. [mini-clinic-online](https://mango-sand-0eb22740f.6.azurestaticapps.net)

## Export && Import data of PostgreSQL

1. I use Docker to run PostgreSQL.
   I have not installed PostgreSQL Client tools on my local machine. So I use the following command to export data from PostgreSQL.
   The backup.sql file is created directly on my local machine, the directory is the current directory where I run the command.
   `docker exec -it your-container-name-or-container-id pg_dump -U username -d database-name > backup.sql`

   ***

2. I use pgAdmin to import data to PostgreSQL.
   Create connection to remote server.
   Right-click on your target database in the browser tree and select "Restore..."
   Data imported successfully.
   ![alt text](./screenshots/import-pgAdmin.png)

## Server-Client communication approachs

1. SSE (Server-Sent Events)
2. SignalR

## Screenshots

1, login
![login](/screenshots/1-login.png)
2, dark mode
![dark mode](/screenshots/2-darkmode.png)
3, light mode
![light mode](/screenshots/3-lightmode.png)
4, internationalization
![internationalization](/screenshots/4-internationallize.png)
5, data crud
![data crud](/screenshots/5-crud.png)
6, chatroom(signalR)
![chatroom](/screenshots/6-chatroom-signalR.png)
7, responsive UI (big screen)
![responsive UI](/screenshots/7-responsive-big.png)
8, responsive UI (small screen)
![responsive UI](/screenshots/7-responsive-small.png)
9, route guard (Admin role can access admin page)
![route guard](/screenshots/8-login-log-admin.png)
10, route guard (User role can not access admin page)
![route guard](/screenshots/8-login-log-non-admin.png)
11, book appointment
![book appointment](/screenshots/11-booking.png)
12, check in
![check in](/screenshots/12-checkin.png)
13, consultation
![consultation](/screenshots/13-consulation.png)
14, real-time admission notification via SSE (server-sent events)
![admission](/screenshots/14-admission-real-time-sse.png)
15, assign bed
![assign bed](/screenshots/15-assign-bed.png)
16, deployed as Azure static web app
![static web app](/screenshots/16-website.png)
