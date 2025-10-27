import { Routes, Route, Navigate } from "react-router-dom";
import FeedPrincipal from "./pages/FeedPrincipal/FeedPrincipal";
import Follows from "./pages/Follows/Follows";
import Login from "./pages/Login/Login";
import ProtectedRoute from "./config/ProtectedRoute";
import MiActividad from "./pages/MiActividad/MiActividad";

import { UserContext } from "../UserContex";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/feed"
        element={
          <ProtectedRoute>
            <FeedPrincipal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/follows"
        element={
          <ProtectedRoute>
            <Follows />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mi-actividad"
        element={
          <ProtectedRoute>
            <MiActividad />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
export default App;
