import { useMapEvents } from "react-leaflet";

// Komponent do przechwytywania kliknięcia na mapie i wybierania lokalizacji
function LocationPicker({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            onSelect(lat, lng);
        },
    });

    return null; // Komponent nie renderuje nic na mapie, tylko obsługuje zdarzenia
}

export default LocationPicker;
