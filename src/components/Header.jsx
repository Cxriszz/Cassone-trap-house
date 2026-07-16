import { MapPin } from 'lucide-react'

const Header = () => {
  const googleMapsLink = "https://www.google.com/maps/place/45%C2%B044'04.8%22N+10%C2%B047'31.2%22E/"
  
  return (
    <header className="header-area">
      <h1 className="title">Casa Cassone Aperta 🏍️</h1>
      <div className="subtitle-container">
        <span className="subtitle">Gästeliste &amp; Planer</span>
        <a 
          href={googleMapsLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="coordinates-pill"
        >
          <MapPin size={14} />
          {"45°44'04.8\"N 10°47'31.2\"E"}
        </a>
      </div>
    </header>
  )
}

export default Header
