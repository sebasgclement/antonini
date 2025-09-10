import { Route, Routes, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import RegisterCustomer from './pages/customers/Register'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './layout/Layout'
import ReceptionCreate from './pages/receptions/Create'
import CustomersList from './pages/customers/List'
import CustomerEdit from './pages/customers/Edit'
import UsersList from './pages/admin/users/List'
import UsersCreate from './pages/admin/users/Create'
import UsersEdit from './pages/admin/users/Edit'
import AdminRoute from './components/AdminRoute'


export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Home />
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

      <Route
        path="/recepciones/nueva"
        element={
          <ProtectedRoute>
            <Layout>
              <ReceptionCreate />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* ADMIN: Usuarios */}
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

      <Route path="*" element={<Navigate to="/" replace />} />


    </Routes>

    
  )

  
}
