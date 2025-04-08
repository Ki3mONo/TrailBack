import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

function App() {
    return (
        <div className="map-wrapper">
            <MapContainer
                center={[52.2297, 21.0122]}
                zoom={6}
                scrollWheelZoom={true}
                style={{ height: '100vh', width: '100%' }}
            >
                {/* Warstwa bazowa: DarkMatter */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    maxZoom={20}
                    minZoom={0}
                    attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* Warstwa szlaków: Waymarked Trails */}
                <TileLayer
                    url="https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png"
                    maxZoom={18}
                    attribution= 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Map style: &copy; <a href="https://waymarkedtrails.org">waymarkedtrails.org</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
                />
            </MapContainer>
        </div>
    )
}

export default App