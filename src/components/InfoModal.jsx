import { X } from 'lucide-react'

const InfoModal = ({ isOpen, onClose }) => {
  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`}>
      <div className="modal-content glass-panel" style={{ padding: '2rem', maxWidth: '800px' }}>
        <div className="modal-header">
          <h3>Infos ℹ️</h3>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>
        
        <div className="rules-container">
          <h4>Mitbringen</h4>
          <p>Badesachen, Wanderschuhe, Sonnencreme, leichte Klamotten + Regenjacke, Schlaf-Equipment, gute Laune, Handtuch, Geschirrtuch, Taschenlampe, Kopfbedeckung und evtl. kleiner Rucksack.</p>

          <h4>Im Haus</h4>
          <ul>
            <li>Küche ist voll nutzbar mit Gasherd-Platten</li>
            <li>Dusche drinnen ganz normal, dazu eine kalte Außendusche an der Nordseite</li>
            <li>Warmwasser braucht ca. 30 Min. Anlaufzeit</li>
            <li>Toilette</li>
            <li>Kaffeemaschine</li>
            <li>Kühlschrank (nicht groß) und Coolbox (groß)</li>
          </ul>

          <h4>Aktivitäten am Gardasee</h4>
          <ul>
            <li><strong>Schwimmen & Chillen am See</strong> – direkt vor der Haustür</li>
            <li><strong>SUP fahren</strong> – super Möglichkeit, den See vom Wasser aus zu erleben (nur nach Absprache möglich!)</li>
            <li><strong>Wandern</strong> – direkt vom Haus starten, Richtung Malcesine oder südlich für die beste Aussicht</li>
            <li><strong>Klettern</strong> – nicht weit entfernt an Klippen und Boulders</li>
            <li><strong>Fahrrad fahren</strong> – tolle Strecken rund um den See</li>
            <li><strong>Motorrad fahren</strong> – Es gibt zahlreiche Straßen und Trails für alle Schwierigkeitsgrade in der Umgebung</li>
            <li><strong>Bootstour mit dem Touri-Boot</strong> – von Cassone aus zu anderen Dörfern am See schippern, lohnt sich für einen Tagesausflug</li>
            <li><strong>Hängematten-Chiller</strong> – im Garten zwischen den Bäumen</li>
            <li><strong>Events in der Region</strong> – öfters öffentliche Partys, Wochenmärkte und mehr, immer aktuell unter: 👉 <a href="https://gardalombardia.com/de/gebiet/veranstaltungen" target="_blank" rel="noopener noreferrer" style={{color: 'var(--color-brand)', fontWeight: 'bold'}}>Garda Lombardia Events</a></li>
            <li>Viele weitere!</li>
          </ul>

          <h4>Einkaufen</h4>
          <ul>
            <li><strong>Tante-Emma-Laden in Cassone</strong>, direkt am Wasser – für die Basics wie Wein, Bier, Snacks</li>
            <li><strong>Kleiner Spar in Val di Sogno</strong> (einen Ort weiter) – etwas größere Auswahl</li>
            <li><strong>Großer Supermarkt in Malcesine</strong> – für den großen Wocheneinkauf</li>
          </ul>

          <h4>Essen & Trinken</h4>
          <ul>
            <li><strong>Pizzeria Stella in Cassone</strong>, nahe am Ufer – absoluter Geheimtipp, sehr empfehlenswert</li>
            <li><strong>Kuta Bar in Cassone</strong>, ebenfalls nahe am Ufer – perfekt für einen Drink mit Seeblick</li>
          </ul>

          <p style={{ marginTop: '1.5rem', fontWeight: 'bold' }}>Bei Fragen gerne melden!</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="btn btn-primary" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  )
}

export default InfoModal
