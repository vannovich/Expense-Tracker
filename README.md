# 💰 Expense Tracker (PERN Stack)

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge\&logo=postgresql\&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge\&logo=express\&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge\&logo=react\&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge\&logo=nodedotjs\&logoColor=white)

![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge\&logo=tailwind-css\&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-F5788D?style=for-the-badge\&logo=chartdotjs\&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge\&logo=jsonwebtokens)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge\&logo=postman\&logoColor=white)

---

A full-stack expense tracking application built with the **PERN stack**.
Track your income, monitor expenses, and visualize financial data with interactive charts.

---

## 🚀 Features

* 🔐 Secure Authentication (JWT)
* 🧾 Add, edit, delete transactions
* 📊 Data visualization with Chart.js
* 📅 Expense tracking over time
* 💵 Multi-account support
* 🌍 Currency support
* 📱 Responsive UI (Tailwind CSS)

---

## 🛠️ Tech Stack

### ⚡ Frontend

* React (Vite)
* Tailwind CSS
* Chart.js
* Axios

### ⚙️ Backend

* Node.js
* Express.js
* PostgreSQL
* JWT Authentication
* Bcrypt

---

## 📂 Project Structure

```id="x3j9l2"
expense-tracker/
├── client/
├── server/
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Clone the repo

```bash id="c7k2ad"
git clone https://github.com/your-username/expense-tracker.git
cd expense-tracker
```

---

### 2. Backend

```bash id="m92k3s"
cd server
npm install
```

Create `.env`:

```id="k82ndk"
DATABASE_URI=your_postgresql_connection
JWT_SECRET=your_secret
PORT=5000
```

Run:

```bash id="d8slp1"
npm run dev
```

---

### 3. Frontend

```bash id="z91ksl"
cd client
npm install
npm run dev
```

---

## 🔐 Authentication

* Passwords hashed using bcrypt
* JWT tokens for secure sessions
* Protected API routes

---

## 📊 Charts

* Built with Chart.js
* Displays:

  * Spending trends
  * Category breakdown
  * Income vs expenses

---

## 🌐 Deployment

* Frontend: Vercel / Netlify
* Backend: Render / Railway
* Database: PostgreSQL (Neon / Supabase)

---

## 📸 Screenshots

*Add screenshots or GIFs here*

---

## 👨‍💻 Author

**Awontu Vannovich Ndzifoin**

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
