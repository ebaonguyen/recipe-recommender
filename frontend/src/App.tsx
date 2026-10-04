import { Link, Route, Routes } from "react-router";
import Home from "./pages/Home";
import Recipes from "./pages/Recipes";

function App() {
  return (
    <>
      <nav>
        <Link to="/">Home</Link>{" "}
        <Link to="/recipes">Recipes</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recipes" element={<Recipes />} />
      </Routes>
    </>
  );
}

export default App;