import { X, Check } from 'lucide-react'
import { useState, useRef } from 'react'

const RulesModal = ({ isOpen, onClose, onAccept }) => {
  const [hasScrolled, setHasScrolled] = useState(false)
  const contentRef = useRef(null)

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 20
    if (bottom && !hasScrolled) {
      setHasScrolled(true)
    }
  }

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`}>
      <div className="modal-content" style={{ padding: '2rem' }}>
        <div className="modal-header">
          <h3>Regelwerk 📜</h3>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        
        <div 
          className="rules-container" 
          ref={contentRef} 
          onScroll={handleScroll}
        >
          <p>
            Trage dich bitte nur in die Liste ein, wenn du vorhast, die folgenden Hausregeln zu befolgen.
          </p>

          <h4>1. Lärm &amp; Nachbarn</h4>
          <p>Bitte achte auf die Lautstärke, um unsere Nachbarn nicht zu stören. Die Lautstärke ist zu folgenden Zeiten zu reduzieren:</p>
          <ul>
            <li><strong>Morgens</strong></li>
            <li><strong>Mittagsruhe:</strong> 13:00 - 16:00 Uhr</li>
            <li><strong>Nachtruhe:</strong> Ab 24:00 Uhr (Mitternacht)</li>
          </ul>
          
          <p>
            <strong>⚠️ Motorrad-Geräusche:</strong> Sind auf das absolut Notwendige zu reduzieren (nur beim Verlassen und Betreten des Grundstücks). Das Grundstück ist leider keine Motocross-Strecke!
          </p>

          <p>Zusätzliche Bitten der Nachbarn bezüglich der Lautstärke sind ausnahmslos zu berücksichtigen.</p>

          <h4>2. Sauberkeit, Müll &amp; Abwasch</h4>
          <p>Jeder räumt seinen eigenen Müll und Abwasch eigenständig weg. Wir trennen unseren Müll:</p>
          <ul>
            <li>Glas</li>
            <li>Papier</li>
            <li>Plastik</li>
            <li>Restmüll</li>
          </ul>
          <p>Der Müll wird unten am Parkplatz in den Mülltonnen entsorgt. Hinterlasst alles nach Benutzen (z.B. Küche, Grill, Bad, Schlafplatz) so, wie ihr es vorgefunden habt.</p>

          <h4>3. Haftung</h4>
          <p>Mit dieser Registrierung akzeptierst du automatisch unseren Haftungsausschluss: <br/>
          👉 <a href="/Haftungsausschluss.pdf" target="_blank" rel="noopener noreferrer" style={{color: 'var(--color-brand)', fontWeight: 'bold'}}>Haftungsausschluss (PDF) ansehen</a></p>
          <p>Zudem musst du diesen noch vor Ort unterschreiben. Wer etwas kaputt macht, muss auch dafür geradestehen.</p>

          <h4>4. Notfälle</h4>
          <p>Bei wichtigen Problemen wendet euch direkt an die Kontaktdaten, welche in deiner Bestätigung (SMS) angegeben sind.</p>
          
          <br/>
          <p style={{fontStyle: 'italic', textAlign: 'center', color: 'var(--color-text-muted)'}}>
            Bitte scrolle bis ganz nach unten, um zuzustimmen.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
          <button 
            className="btn btn-primary" 
            onClick={onAccept}
            disabled={!hasScrolled}
            style={{ opacity: hasScrolled ? 1 : 0.5, cursor: hasScrolled ? 'pointer' : 'not-allowed' }}
          >
            <Check size={16} />
            Gelesen &amp; Akzeptiert
          </button>
        </div>
      </div>
    </div>
  )
}

export default RulesModal
