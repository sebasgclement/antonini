import { Route, Routes, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import RegisterCustomer from './pages/customers/Register'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './layout/Layout'
import ReceptionCreate from './pages/receptions/Create'


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
path="/recepciones/nueva"
element={
<ProtectedRoute>
<Layout>
<ReceptionCreate />
</Layout>
</ProtectedRoute>
}
/>


<Route path="*" element={<Navigate to="/" replace />} />
</Routes>
)
}