import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { testFirebaseConnection } from './test/firebaseTest';

createRoot(document.getElementById("root")!).render(<App />);
testFirebaseConnection();
