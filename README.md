# Eclinic2

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.8.

## Development server

## Breakpoints

md: 768px

## Export && Import data of PostgreSQL

1. I use Docker to run PostgreSQL.
   I have not installed PostgreSQL Client tools on my local machine. So I use the following command to export data from PostgreSQL.
   The backup.sql file is created directly on my local machine, the directory is the current directory where I run the command.
   docker exec -it your-container-name-or-container-id pg_dump -U username -d database-name > backup.sql

   ***

2. I use pgAdmin to import data to PostgreSQL.
   Create connection to remote server.
   Right-click on your target database in the browser tree and select "Restore..."
   Data imported successfully.
   ![alt text](./screenshots/import-pgAdmin.png)
