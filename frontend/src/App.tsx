import { Link, Route, Routes } from "react-router";
import Home from "./pages/Home";
import Recipes from "./pages/Recipes";
import Signup from "./auth/Signup";
import Login from "./auth/Login";

function App() {
  return (
    <>
      <nav>
        <Link to="/">Home</Link>{" "}
        <Link to="/recipes">Recipes</Link>{" "}
        <Link to="/signup">Signup</Link>{" "}
        <Link to="/login">Login</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
}

export default App;