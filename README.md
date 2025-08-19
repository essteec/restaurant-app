# 🍽️ Restaurant Management System - Frontend

<div align="center">

![Vite](https://img.shields.io/badge/Vite-B73BFE?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?logo=bootstrap&logoColor=white)

</div>

---

## 📝 Overview

This is the frontend for the Modern Minimal Restaurant System, built with React and Vite. It provides a responsive, user-friendly interface for all restaurant interactions, including customer ordering, staff management, and administrative oversight.

This application communicates with its corresponding [Spring Boot backend](https://github.com/essteec/restaurant) to handle business logic and data persistence.

---

## ✨ Features

- **Customer Interface:** Browse the menu, manage a shopping cart, place orders, and view order history.
- **Authentication:** Secure user registration and login for customers and employees.
- **Staff Dashboards:** Dedicated views for different roles:
  - **Admin:** Manage users, food items, categories, tables, and view call requests.
  - **Waiter:** View and manage orders, tables, and respond to customer call requests.
  - **Chef:** View incoming orders to prepare.
- **Responsive Design:** A clean and modern UI that works on both desktop and mobile devices using Bootstrap.

---

## 🔧 Technology Stack

| Technology          | Description                               |
|---------------------|-------------------------------------------|
| [Vite](https://vitejs.dev/)                | Next-generation frontend tooling and build tool. |
| [React](https://reactjs.org/)               | A JavaScript library for building user interfaces. |
| [React Router](https://reactrouter.com/)        | For client-side routing and navigation.     |
| [Axios](https://axios-http.com/)               | For making HTTP requests to the backend API. |
| [Bootstrap](https://getbootstrap.com/)           | CSS framework for styling and layout.       |
| [React-Bootstrap](https://react-bootstrap.github.io/)   | Reusable Bootstrap components for React.    |
| [ESLint](https://eslint.org/)              | For identifying and fixing problems in code.  |

---
## 🚀 Project setup

Follow these steps to run the project locally.

Installation
```bash
git clone <your-repository-url>
cd restaurant-app
npm install
npm run dev
```

Note
- The committed `.env.development` and `.env.production` files are provided for general setup. Update any values (API URLs, credentials, etc.) as needed for your environment.

```bash
# .env.development — include the following for the app to work:
VITE_API_BASE_URL=http://localhost:8080/rest/api
VITE_IMAGE_BASE_URL=http://localhost:8080/images
```

## 📜 Available Scripts

In the project directory, you can run:

- `npm run dev`: Runs the app in development mode.
- `npm run build`: Builds the app for production into the `dist` folder.
- `npm run lint`: Lints the code to find and fix issues.
- `npm run preview`: Serves the production build locally to preview it.