---
slug: migrating-wordpress-sites-without-plugins
title: Migrating WordPress Sites (Without Plugins)
summary: A WordPress migration guide for moving a site manually without relying on migration plugins.
kind: guide
topic: codes
category: software-tools
createdAt: 2025-05-01T10:00:00.000Z
updatedAt: 2026-03-06T21:40:12.000Z
articleId: COD-GUI-MIG
tags:
  - hosting
  - web
  - wordpress
featuredImage:
  src: /images/COD-GUI-MIG/image_2023-03-16_195731649.png
  alt: 
---


Migrating a WordPress website from one site to another can be a daunting task, but it’s something that needs to be done occasionally. In this article, we will go through the step-by-step process of migrating one WordPress website to another.

## Step 1: Download WordPress Files

The first step is to download all the WordPress files from the old website using an FTP client like Cyberduck or FileZilla. Once you have downloaded the files, create a backup of the site in case anything goes wrong during the migration.

## Step 2: Export the Database

Next, you need to export the database of the old website using phpMyAdmin. You can access phpMyAdmin through your hosting account dashboard. Go to the Export tab, select the database, and choose the SQL format to export it.

## Step 3: Find and Replace Old Site References

After exporting the database, you need to find and replace all references to the old site with the new site address. You can do this using a text editor like Sublime Text or Atom, or you can use a plugin like Better Search Replace. Replace all instances of the old site URL with the new site URL.

## Step 4: Import the SQL File

Now that you have the edited SQL file, you need to import it into the new database. Create a new database on the new website and import the SQL file into it using phpMyAdmin.

## Step 5: Get WPConfig Details of the New Database

In this step, you need to get the database details of the new website, which can be found in the wp-config.php file. You need the database name, username, password, and host to connect WordPress to the new database.

## Step 6: Upload WordPress Files to the New Site Directory

Upload all the WordPress files that you downloaded from the old site to the new site directory using an FTP client. You need to make sure that the files are uploaded to the correct directory on the new website.

## Step 7: Update WPConfig with New Database Details

Finally, update the wp-config.php file with the new database details you obtained in step 5. Replace the old database details with the new database details.

Once you have completed all the steps, your new WordPress site should be up and running with all the content from the old site. Make sure to test everything thoroughly to ensure that everything is working as it should be.

## Conclusion

Migrating a WordPress website from one site to another can seem overwhelming at first, but by following these steps, you can make the process smoother and less stressful. Remember to always create a backup of your site before beginning the migration process and test everything thoroughly after completing the migration.
