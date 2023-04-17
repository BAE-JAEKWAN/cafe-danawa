import { Routes, Route } from "react-router-dom";
import Old from "./pages/old";
import Refactor from "./pages/refactor";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Refactor />} />
      <Route path="/old" element={<Old />} />
    </Routes>
  );
}

export default App;
