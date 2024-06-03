### Carls Chat

Welcome to the Carleton College Chat Website, a collaborative project developed by students at Carleton College in Northfield, Minnesota. Created as part of our Software Design, we, Team FAST-Falcons, have crafted a website exclusively for the community of Carleton College in Northfield, Minnesota. This chatting platform offers various features for communication to enhance campus interactivity. Upon logging in, users can select an avatar, and a doodle of the campus map will welcome them, featuring places such as Sayles Hill Campus Center, Gould Library, and the BaldSpot. By clicking on these locations, users can explore various features and engage in different activities. Whether it's participating in global chat discussions in the BaldSpot, virtually navigating the floors of Gould Library with music features, or getting food at the Sayles Campus Center, Carls Chat provides an immersive experience for all members of the Carleton community.

## Introduction

This repository FAST-Falcons hosts the code, images and the documentations for the Carleton College Chat Website. Created by a team of four developers during an advanced software design class, this project aims to enhance the social experience of students at Carleton College through a dynamic and user-friendly online platform.

## Project Overview

Carls Chat features three main locations within the campus:

1. **Sayles Hill Campus Center**: Offering a variety of features including a food menu and one-to-one chat rooms.
2. **Gould Library**: Navigate through different floors, with your avatar appearing on each floor, and enjoy music tailored to the vibe of each floor.
3. **Bald Spot**: Access a global chat room for group conversations and engage with fellow students in real-time discussions.

## Features

### User Registration and Login

- **User Registration**: Create an account to access the website's features.
- **Login**: Securely log in to your account with your credentials.

### Avatar Selection

- Choose from a selection of avatars to represent yourself online.

### Home Page 

- Interactive map of Carleton College with clickable locations.
- Navigation buttons for easy access to different sections of the website.

### Profile Management

- Update your avatar, username, and password to personalize your profile.

### Chat Room Management

- **Global Chat Room**: Engage in group conversations.
- **One-on-One Chat**: Connect with other users for private conversations.

### Real-time Communication

- WebSocket technology for real-time communication.

### Deployment

- Docker.

## Table of Contents(Which files to look into?)

- **Register**: `register.html`, `registerandlogin.css`
- **Login**: `login.html`, `registerandlogin.css`
- **Welcome**: `welcome.html`, `style_welcome.css`
- **Home**: `home.html`, `style_home.css`
- **Sayles**: `sayles.html`, `style_sayles.css`
- **Library**: `library.html`, `style_library.css`
- **Profile**: `profile.html`, `style_profile.css`
- **About Us**: `about-us-page.html`, `about-us-page.css`
- **Chat Room**: `chatroom.html`, `style_chatroom.css`

Including api.py which is the Flask Application that runs the webvsite.

### Routes and Functions

#### User Management

- **Registration (/register)**: Handles user registration, checks for username uniqueness, and stores user information.
- **Login (/login)**: Verifies user credentials and redirects to the homepage upon successful login.
- **Logout (/logout)**: Logs the user out and redirects to the login page.

#### Profile Management

- **Update Username (/update_username)**: Allows users to update their username.
- **Update Password (/update_password)**: Allows users to update their password.

#### Chat Room Management

- **Global Chat Room**: Manages global chat functionality, including sending and editing messages.
- **One-on-One Chat**: Facilitates private conversations between users.

#### Real-time Communication

- **WebSocket Management**: Handles WebSocket connections for real-time updates.

#### Avatar Management

- **Save Avatar (/save_avatar)**: Saves the user's selected avatar path to the database.

#### Utility Functions

- **Database Utilities**: Various utility functions for database operations.

### Technologies Used

- **Frontend**: HTML, CSS, JavaScript, Adobe Fresco for doodling and GIF creation.
- **Backend**: Flask, Flask-SocketIO, HTML Templates, JSON, Session Management, Threading (via `threading.Lock`), Static and Dynamic Data Handling.
- **Database**: MySQL (via `mysql-connector-python`).
- **Real-time Communication**: Socket.io for chat functionalities.
- **Deployment**: Docker.

### Collaborators (Look into About-us page for more information)

- **Daniel Lumbu**
- **Kritika Pandit**
- **Daniel Estrada**
- **Alex Wcislo**
- **Palmy Klangsathorn**

## How to Contribute to our website

If you're interested in contributing to our website, feel free to fork this repository, make your changes, and submit a pull request. We welcome any enhancements in the website, bug fixes, or new features that can improve the user experience of our platform.

## Acknowledgments

We are immensely grateful to the Carleton College community for their invaluable support and feedback throughout the entire journey of developing this project. Their support, whether it was assisting us in choosing colors, suggesting alternative locations, or simply providing the encouragement to continue with the project. We owe a special gratitude to our professor, Matthew Lepinski, whose guidance and support have been significant. Matthew's mentorship has not only helped us navigate the complexities of our project, but a motivation to work everyday on this prpject. Even in moments of uncertainty, Matthew stood by us, offering encouragement. His dedication to our success has been a driving force behind our project achievementss.