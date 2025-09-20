import { Routes, Route, Navigate } from "react-router-dom";
import FeedPrincipal from "./pages/FeedPrincipal/FeedPrincipal";
import MiActividad from "./pages/MiActividad/MiActividad";
import Follows from "./pages/Follows/Follows";
import BuscarAmigos from "./pages/BuscarAmigos/BuscarAmigos";

import { UserContext } from "../UserContex";

function App() {
  const testUserId = "68c363128ebed5110d10e09f"; // ID de usuario de prueba
  //const testUserId = "68c363128ebed5110d10e09f"; // ID de usuario de prueba

  return (
    <>
      <UserContext.Provider value={{ userId: testUserId }}>
        <Routes>
          {/* Redirigir /index.html a la ruta raíz */}
          <Route path="/index.html" element={<Navigate to="/" replace />} />

          {/* Tus rutas existentes */}
          <Route path="/" element={<FeedPrincipal />}></Route>
          <Route path="/mi-actividad" element={<MiActividad />}></Route>
          <Route path="/follows" element={<Follows />}></Route>
          <Route path="/buscar-amigos" element={<BuscarAmigos />}></Route>

          {/* Ruta para manejar 404 - debe estar al final */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </UserContext.Provider>
    </>
  );
}

export default App;
