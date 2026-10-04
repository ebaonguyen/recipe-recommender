import { useEffect, useState } from "react";

function Home() {
  const [msg, setMsg] = useState("loading...");

  useEffect(() => {
    fetch("http://localhost:8000/")
      .then((r) => r.json())
      .then((data) => setMsg(data.message))
      .catch(() => setMsg("failed to reach backend"));
  }, []);

  return <h1>Home Page: {msg}</h1>;
}

export default Home;