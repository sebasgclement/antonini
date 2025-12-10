import { Route, Routes, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
// ... (Tus imports de páginas siguen igual, no los borres) ...
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Layout from './layout/Layout'

// Importaciones de páginas (Resumidas para el ejemplo, usá las tuyas)
import RegisterCustomer from './pages/customers/Register'
import CustomersList from './pages/customers/List'
import CustomerEdit from './pages/customers/Edit'
import CustomerView from './pages/customers/View'
import UsersList from './pages/admin/users/List'
import UsersCreate from './pages/admin/users/Create'
import UsersEdit from './pages/admin/users/Edit'
import RolesList from './pages/admin/roles/List'
import RolesCreate from './pages/admin/roles/Create'
import RolesEdit from './pages/admin/roles/Edit'
import VehiclesList from './pages/vehicles/List'
import RegisterVehicle from './pages/vehicles/Register'
import VehicleEdit from './pages/vehicles/Edit'
import VehicleView from './pages/vehicles/VehicleView'
import VehicleExpensesForm from './pages/vehicles/ExpensesForm'
import ReservationsList from './pages/reservations/List'
import RegisterReservation from './pages/reservations/Register'
import ReservationView from "./pages/reservations/View"
import ReportsDashboard from "./pages/admin/reports/Dashboard"
import ChangePassword from './pages/profile/ChangePassword'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Home */}
      <Route path="/" element={<ProtectedRoute><Layout><Home /></Layout></ProtectedRoute>} />

      {/* Clientes */}
      <Route path="/clientes" element={<ProtectedRoute><Layout><CustomersList /></Layout></ProtectedRoute>} />
      <Route path="/clientes/registro" element={<ProtectedRoute><Layout><RegisterCustomer /></Layout></ProtectedRoute>} />
      <Route path="/clientes/:id/edit" element={<ProtectedRoute><Layout><CustomerEdit /></Layout></ProtectedRoute>} />
      <Route path="/clientes/:id/ver" element={<ProtectedRoute><Layout><CustomerView /></Layout></ProtectedRoute>} />

      {/* Admin: Usuarios */}
      <Route path="/admin/usuarios" element={<ProtectedRoute><AdminRoute><Layout><UsersList /></Layout></AdminRoute></ProtectedRoute>} />
      <Route path="/admin/usuarios/crear" element={<ProtectedRoute><AdminRoute><Layout><UsersCreate /></Layout></AdminRoute></ProtectedRoute>} />
      <Route path="/admin/usuarios/:id/editar" element={<ProtectedRoute><AdminRoute><Layout><UsersEdit /></Layout></AdminRoute></ProtectedRoute>} />

      {/* Admin: Roles */}
      <Route path="/admin/roles" element={<ProtectedRoute><AdminRoute><Layout><RolesList /></Layout></AdminRoute></ProtectedRoute>} />
      <Route path="/admin/roles/crear" element={<ProtectedRoute><AdminRoute><Layout><RolesCreate /></Layout></AdminRoute></ProtectedRoute>} />
      <Route path="/admin/roles/:id/editar" element={<ProtectedRoute><AdminRoute><Layout><RolesEdit /></Layout></AdminRoute></ProtectedRoute>} />
      
      {/* Admin: Reportes */}
      <Route path="/admin/reportes" element={<ProtectedRoute><AdminRoute><Layout><ReportsDashboard /></Layout></AdminRoute></ProtectedRoute>} />

      {/* Perfil */}
      <Route path="/perfil/password" element={<ProtectedRoute><Layout><ChangePassword /></Layout></ProtectedRoute>} />

      {/* Vehículos */}
      <Route path="/vehiculos" element={<ProtectedRoute><Layout><VehiclesList /></Layout></ProtectedRoute>} />
      <Route path="/vehiculos/registro" element={<ProtectedRoute><Layout><RegisterVehicle /></Layout></ProtectedRoute>} />
      <Route path="/vehiculos/:id/edit" element={<ProtectedRoute><Layout><VehicleEdit /></Layout></ProtectedRoute>} />
      <Route path="/vehiculos/:id/gastos" element={<ProtectedRoute><Layout><VehicleExpensesForm /></Layout></ProtectedRoute>} />
      <Route path="/vehiculos/:id/ver" element={<ProtectedRoute><Layout><VehicleView /></Layout></ProtectedRoute>} />

      {/* Reservas */}
      <Route path="/reservas" element={<ProtectedRoute><Layout><ReservationsList /></Layout></ProtectedRoute>} />
      <Route path="/reservas/nueva" element={<ProtectedRoute><Layout><RegisterReservation /></Layout></ProtectedRoute>} />
      <Route path="/reservas/:id" element={<ProtectedRoute><Layout><ReservationView /></Layout></ProtectedRoute>} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}