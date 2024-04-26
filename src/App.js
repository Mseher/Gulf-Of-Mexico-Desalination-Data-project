import "./App.css";
// import Map from "./components/map";
import Header from "./components/header";
import Map from "./components/map";
import "mapbox-gl/dist/mapbox-gl.css";


function App() {
  return (
    <div className="App">
      <Header />
      <Map></Map>
    </div>
  );
}

export default App;
