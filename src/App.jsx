import { Routes, Route } from "react-router-dom";
import FeedPrincipal from "./pages/FeedPrincipal/FeedPrincipal";
import MiActividad from "./pages/MiActividad/MiActividad";
import Follows from "./pages/Follows/Follows";
import BuscarAmigos from "./pages/BuscarAmigos/BuscarAmigos";

import { UserContext } from "../UserContex";

function App() {
  const testUserId = "68c38ea990da6680f3814a1d"; // ID de usuario de prueba

  return (
    <>
      <UserContext.Provider value={{ userId: testUserId }}>
        <Routes>
          <Route path="/" element={<FeedPrincipal />}></Route>
          <Route path="/mi-actividad" element={<MiActividad />}></Route>
          <Route path="/follows" element={<Follows />}></Route>
          <Route path="/buscar-amigos" element={<BuscarAmigos />}></Route>
        </Routes>
      </UserContext.Provider>
    </>
  );
}

export default App;
