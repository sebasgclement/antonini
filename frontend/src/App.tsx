import { Route, Routes, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import RegisterCustomer from './pages/customers/Register'
import CustomersList from './pages/customers/List'
import CustomerEdit from './pages/customers/Edit'
import UsersList from './pages/admin/users/List'
import UsersCreate from './pages/admin/users/Create'
import UsersEdit from './pages/admin/users/Edit'
import VehiclesList from './pages/vehicles/List'
import RegisterVehicle from './pages/vehicles/Register'
import VehicleEdit from './pages/vehicles/Edit'
import RolesList from './pages/admin/roles/List'
import RolesCreate from './pages/admin/roles/Create'
import RolesEdit from './pages/admin/roles/Edit'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Layout from './layout/Layout'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Home */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Home />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Clientes */}
      <Route
        path="/clientes"
        element={
          <ProtectedRoute>
            <Layout>
              <CustomersList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes/registro"
        element={
          <ProtectedRoute>
            <Layout>
              <RegisterCustomer />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes/:id/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <CustomerEdit />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Admin: Usuarios */}
      <Route
        path="/admin/usuarios"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <UsersList />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/usuarios/crear"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <UsersCreate />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/usuarios/:id/editar"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <UsersEdit />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      {/* Admin: Roles */}
      <Route
        path="/admin/roles"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <RolesList />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/roles/crear"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <RolesCreate />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/roles/:id/editar"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <RolesEdit />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      {/* Vehículos */}
      <Route
        path="/vehiculos"
        element={
          <ProtectedRoute>
            <Layout>
              <VehiclesList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehiculos/registro"
        element={
          <ProtectedRoute>
            <Layout>
              <RegisterVehicle />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehiculos/:id/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <VehicleEdit />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
