import React from 'react'
import { Heart, Coffee, Zap, Droplet, Flame, ArrowRight } from 'lucide-react'

const DonationModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const handleDonate = (amount) => {
    const url = `https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=andydressler77@gmail.com&item_name=Unkostenbeitrag+Cassone&amount=${amount}.00&currency_code=EUR`
    window.open(url, '_blank')
    onClose()
  }

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={(e) => {
      if(e.target.className.includes('modal-overlay')) onClose();
    }}>
      <div className="modal-content glass-panel donation-modal" style={{ padding: '2.5rem 2rem', textAlign: 'center', maxWidth: '600px' }}>
        <div style={{ marginBottom: '1.5rem', color: 'var(--color-brand)' }}>
          <Heart size={48} fill="currentColor" style={{ margin: '0 auto' }} />
        </div>
        
        <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Vielen Dank für deine Anmeldung!</h3>
        
        <p style={{ color: 'var(--color-text-light)', lineHeight: 1.6, marginBottom: '2rem' }}>
          Die Unterkunft an sich ist für dich komplett kostenlos! <br/><br/>
          Da das Grundstück uns als Besitzern aber laufende Kosten für 
          <span style={{ color: 'var(--color-white)' }}> <Droplet size={14} style={{verticalAlign: 'middle', margin:'0 2px'}}/> Wasser</span>, 
          <span style={{ color: 'var(--color-white)' }}> <Flame size={14} style={{verticalAlign: 'middle', margin:'0 2px'}}/> Gas</span> und 
          <span style={{ color: 'var(--color-white)' }}> <Zap size={14} style={{verticalAlign: 'middle', margin:'0 2px'}}/> Strom</span> verursacht, 
          freuen wir uns riesig über eine kleine, freiwillige Beteiligung an den Unkosten.
        </p>

        <div className="donation-grid">
          <button className="donation-btn" onClick={() => handleDonate(15)}>
            <span className="amount">15 €</span>
            <span className="desc">Kleiner Beitrag</span>
          </button>
          <button className="donation-btn popular" onClick={() => handleDonate(25)}>
            <span className="badge-popular">Empfohlen</span>
            <span className="amount">25 €</span>
            <span className="desc">Gute Unterstützung</span>
          </button>
          <button className="donation-btn" onClick={() => handleDonate(40)}>
            <span className="amount">40 €</span>
            <span className="desc">Super Support</span>
          </button>
          <button className="donation-btn" onClick={() => handleDonate(60)}>
            <span className="amount">60 €</span>
            <span className="desc">Ehrenmann / Ehrenfrau</span>
          </button>
          <button className="donation-btn" onClick={() => handleDonate(100)}>
            <span className="amount">100 €</span>
            <span className="desc">Legenden-Status 👑</span>
          </button>
        </div>

        <button 
          className="skip-donation-btn" 
          onClick={onClose}
        >
          Nein danke, ich möchte mich nicht beteiligen
        </button>
      </div>
    </div>
  )
}

export default DonationModal
