import { Routes, Route } from "react-router-dom";
import Layout from "./pages/FeedPrincipal/FeedPrincipal";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}></Route>
      </Routes>
    </>
  );
}

export default App;
