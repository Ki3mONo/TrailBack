# TrailBack - Aplikacja do Zapisywania Wspomnień Geograficznych

**TrailBack** to aplikacja webowa umożliwiająca tworzenie i udostępnianie wspomnień powiązanych z konkretnymi lokalizacjami geograficznymi.  
Łączy funkcje interaktywnej mapy, galerii zdjęć i sieci społecznościowej, pozwalając użytkownikom budować własną mapę wspomnień i dzielić się nimi ze znajomymi.

> ℹ️ **Uwaga:**  
> W przypadku korzystania z aplikacji w wersji wdrożonej na Vercel ([TrailBack Live](https://trailback.vercel.app/)), pierwszy dostęp po dłuższym czasie bezczynności może być wolniejszy. Wynika to z ograniczeń darmowego planu Render – backend (FastAPI) może przejść w stan uśpienia ("idle") i wymaga kilkunastu sekund na "obudzenie" ([zobacz dokumentację Render](https://render.com/docs/free#spinning-down-on-idle)).

> **W związku z tym zalecam najpierw się zalogować, aby backend został wybudzony, a następnie zapoznać się z dokumentacją funkcji aplikacji i możliwościami TrailBack.**

## Technologie i Stack

### Frontend (Hostowany na Vercelu: [TrailBack Live](https://trailback.vercel.app/))
- **Framework**: React z TypeScript
- **Build Tool**: Vite
- **Mapy**: React Map GL / Mapbox
- **Stylowanie**: Tailwind CSS
- **Uwierzytelnianie**: Supabase Auth
- **Hosting**: Vercel

### Backend (hostowany na Render)
- **Framework**: FastAPI (Python 3.10+)
- **Deployment**: Render

### Baza Danych (Supabase)
- **Silnik**: PostgreSQL + PostGIS (dla danych geograficznych)
- **Storage**: Supabase Storage (przechowywanie zdjęć)
- **Autoryzacja**: Supabase Auth
- **Real-time**: Obsługa zmian w czasie rzeczywistym

## System Uprawnień

TrailBack wykorzystuje następujący system uprawnień:

### Poziomy użytkowników
1. **Goście** (niezalogowani):
   - Brak dostępu do funkcji aplikacji
   - Możliwość rejestracji lub logowania

2. **Zalogowani użytkownicy**:
   - Tworzenie własnych wspomnień
   - Dodawanie zdjęć do własnych wspomnień
   - Przeglądanie własnych wspomnień
   - Edycja nazwy i opisu własnych wspomnień
   - Przeglądanie udostępnionych wspomnień
   - Usuwanie (tylko swoich) zdjęć z udostępnionych wspomnień
   - Usuwanie (tylko swoich) wspomnień
   - Wyszukiwanie użytkowników
   - Wysyłanie zaproszeń do znajomych
   - Akceptowanie zaproszeń do znajomych


### Uprawnienia do wspomnień
- **Twórca wspomnienia**:
  - Edytowanie i usuwanie wspomnienia
  - Zarządzanie zdjęciami
  - Udostępnianie znajomym i cofanie udostępnienia

- **Znajomi z udostępnieniem**:
  - Przeglądanie opisu wspomnienia i zdjęć
  - Dodawanie własnych zdjęć
  - Usuwanie własnych zdjęć

- **Pozostali użytkownicy**:
  - Brak dostępu

### Relacje społecznościowe
- Wysyłanie i akceptowanie zaproszeń
- Możliwość usuwania znajomych
- Udostępnianie wspomnień tylko znajomym
- Możliwość dodania zdjęcia i nazwy profilu

## Funkcje

- Interaktywna mapa do przeglądania i dodawania wspomnień, z możliwością włączenia szlaków z [Waymarked Trails](https://hiking.waymarkedtrails.org)
- Zarządzanie wspomnieniami (tworzenie, edycja, usuwanie)
- Zarządzanie zdjęciami we wspomnieniach
- Wyszukiwanie lokalizacji
- System znajomych i zaproszeń
- Udostępnianie wspomnień znajomym
- Responsywny interfejs z trybem jasnym/ciemnym

## Instalacja i Uruchomienie

### Wymagania
- Node.js 16+
- Python 3.10+
- Konto Supabase
- Konto Mapbox (dla klucza API)
- Konta na Vercel i Render

### Lokalne uruchomienie

#### Backend
1. Stwórz wirtualne środowisko Pythona:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   ```

2. Zainstaluj zależności:
   ```bash
   pip install -r requirements.txt
   ```

3. Skonfiguruj plik `.env` w katalogu `backend/`:

	```
	SUPABASE_URL=Twój_URL_Supabase
	SUPABASE_SERVICE_ROLE_KEY=Twój_Service_Role_Key_Supabase
	DATABASE_URL=Adres_URL_bazy_danych
	ALLOWED_ORIGINS=Adres_frontendu (np. http://localhost:5173)
	```


4. Uruchom serwer:
   ```bash
   uvicorn backend.main:app --reload
   ```

#### Frontend
1. Zainstaluj zależności:
   ```bash
   cd frontend
   npm install
   ```

2. Skonfiguruj plik `.env` w katalogu `frontend/` (dla uruchomienia lokalnego):
	```
	VITE_BACKEND_URL=http://localhost:8000
	VITE_MAPBOX_TOKEN=Twój_token_Mapbox
	VITE_SUPABASE_URL=Twój_URL_Supabase
	VITE_SUPABASE_ANON_KEY=Twój_anonimowy_klucz_Supabase
	```

3. Uruchom aplikację developerską:
   ```bash
   npm run dev
   ```

### Wdrożenie

#### Backend (Render)
- Połącz repozytorium GitHub z Render
- Utwórz Web Service typu Python
- Dodaj zmienne środowiskowe
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

#### Frontend (Vercel)
- Połącz repozytorium GitHub z Vercel
- Wybierz preset "Vite"
- Dodaj zmienne środowiskowe
- Wdrożenia automatyczne po każdym pushu na główną gałąź

## Struktura Projektu

```
TrailBack/
├── backend/              # Backend FastAPI
│   ├── core/             # Konfiguracja i ustawienia aplikacji
│   ├── db/               # Połączenia z bazą danych i operacje DB
│   ├── models/           # Modele ORM
│   ├── routes/           # Endpointy API
│   ├── schemas/          # Schematy Pydantic (walidacja danych)
│   ├── services/         # Logika biznesowa i operacje na danych
│   └── main.py           # Główny plik aplikacji FastAPI
│
└── frontend/             # Frontend React
    ├── public/           # Statyczne zasoby
    └── src/
        ├── components/   # Komponenty React
        │   ├── auth/     # Autentykacja użytkownika
        │   ├── common/   # Wspólne komponenty
        │   ├── map/      # Komponenty mapy
        │   ├── memories/ # Komponenty wspomnień
        │   └── social/   # Komponenty społecznościowe
        ├── hooks/        # Własne hooki
        ├── services/     # Serwisy API
        ├── types/        # Typy TypeScript
        ├── utils/        # Funkcje pomocnicze
        └── App.tsx       # Główny komponent
```

## Autor

[Maciej Kmąk](https://github.com/Ki3mONo)
