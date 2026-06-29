import "./SplashScreen.css";

function SplashScreen() {
  return (
    <div className="splash-screen" aria-label="Loading application">
      <div className="splash-content">
        <div className="splash-logo">tieto</div>
        <div className="splash-progress" aria-hidden="true">
          <span />
        </div>
      </div>
      <div className="splash-version">ver. 2.1.014</div>
    </div>
  );
}

export default SplashScreen;
