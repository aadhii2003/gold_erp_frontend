import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { store } from './app/store'
import App from './App'
import Login from './features/auth/Login'
import POS from './features/sales/POS'
import AdminDashboard from './features/admin/AdminDashboard'
import ManagerDashboard from './features/manager/ManagerDashboard'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Login />} />
            <Route path="pos" element={<POS />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="manager" element={<ManagerDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
)
