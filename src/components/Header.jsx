import { MapPin } from 'lucide-react'

const Header = () => {
  const googleMapsLink = "https://www.google.com/maps/place/45%C2%B044'04.8%22N+10%C2%B047'31.2%22E/"
  
  return (
    <header className="header-area">
      <h1 className="title">Cassone Trap House 🇮🇹</h1>
      <p className="subtitle">
        <MapPin size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
        <a 
          href={googleMapsLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="location-link"
        >
          45°44'04.8"N 10°47'31.2"E
        </a>
      </p>
    </header>
  )
}

export default Header
