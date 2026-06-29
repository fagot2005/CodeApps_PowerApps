import { useEffect, useState } from "react";
import OverviewScreen from "./screens/OverviewScreen";
import SplashScreen from "./screens/SplashScreen";
import "./App.css";

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 6000);

    return () => window.clearTimeout(timer);
  }, []);

  return showSplash ? <SplashScreen /> : <OverviewScreen />;
}

export default App;
