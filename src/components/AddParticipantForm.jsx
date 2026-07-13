import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { parseISO, isBefore, isValid } from 'date-fns'

const AddParticipantForm = ({ isOpen, onClose, onSubmit, participants = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    start_location: '',
    arrival_date: '',
    departure_date: '',
    isDepartureOpen: false,
    transport_mode: 'Auto',
    has_seats: false,
    schlafplatz: '',
    phone: '',
    notes: ''
  })

  // Date overlapping logic
  const checkOverlap = (pArrival, pDeparture, newArrival, newDeparture) => {
    if (!newArrival || !pArrival) return false;
    
    // If departure is 'offen', treat it as far in the future
    const end1 = (!pDeparture || pDeparture === 'offen') ? new Date('2099-12-31') : parseISO(pDeparture);
    const end2 = (!newDeparture || newDeparture === 'offen') ? new Date('2099-12-31') : parseISO(newDeparture);
    
    const start1 = parseISO(pArrival);
    const start2 = parseISO(newArrival);
    
    if (!isValid(start1) || !isValid(start2) || !isValid(end1) || !isValid(end2)) return false;

    // Overlap condition: start1 < end2 AND start2 < end1
    return isBefore(start1, end2) && isBefore(start2, end1);
  }

  // Calculate remaining spots only for overlapping dates
  const newDep = formData.isDepartureOpen ? 'offen' : formData.departure_date;
  const overlappingParticipants = participants.filter(p => 
    checkOverlap(p.arrival_date, p.departure_date, formData.arrival_date, newDep)
  );

  const reggaeHutCount = overlappingParticipants.filter(p => p.schlafplatz === 'Reggae Hut').length
  const hausCount = overlappingParticipants.filter(p => p.schlafplatz === 'Haus').length
  
  const reggaeHutMax = 6
  const hausMax = 2
  
  const reggaeHutFull = reggaeHutCount >= reggaeHutMax
  const hausFull = hausCount >= hausMax

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if(!formData.schlafplatz) {
      alert("Bitte wähle einen Schlafplatz aus.")
      return
    }

    if (!formData.isDepartureOpen && formData.arrival_date && formData.departure_date) {
      const start = parseISO(formData.arrival_date)
      const end = parseISO(formData.departure_date)
      if (isBefore(end, start)) {
        alert("Das Abreisedatum darf nicht vor dem Anreisedatum liegen.")
        return
      }
    }

    const finalData = { ...formData }
    if (finalData.isDepartureOpen) {
      finalData.departure_date = 'offen'
    }
    delete finalData.isDepartureOpen
    
    onSubmit(finalData)
    // Reset form
    setFormData({
      name: '',
      start_location: '',
      arrival_date: '',
      departure_date: '',
      isDepartureOpen: false,
      transport_mode: 'Auto',
      has_seats: false,
      schlafplatz: '',
      phone: '',
      hide_phone: false,
      notes: ''
    })
  }

  const showSeatsOption = formData.transport_mode === 'Auto' || formData.transport_mode === 'Motorrad'

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={(e) => {
      if(e.target.className.includes('modal-overlay')) onClose();
    }}>
      <div className="modal-content" style={{ padding: '2rem' }}>
        <div className="modal-header">
          <h3>Ich bin dabei! 🚀</h3>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem 0 0' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Dein Name</label>
              <input 
                type="text" name="name" className="form-input" 
                placeholder="z.B. Anna" required
                value={formData.name} onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Startort</label>
              <input 
                type="text" name="start_location" className="form-input" 
                placeholder="Von wo fährst du los?" required
                value={formData.start_location} onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Anreise Datum</label>
              <input 
                type="date" name="arrival_date" className="form-input" required
                min={new Date().toLocaleDateString('sv-SE')}
                value={formData.arrival_date} onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Abreise Datum</label>
              <input 
                type="date" name="departure_date" className="form-input" 
                required={!formData.isDepartureOpen}
                disabled={formData.isDepartureOpen}
                value={formData.isDepartureOpen ? '' : formData.departure_date} 
                onChange={handleChange}
              />
              <div className="checkbox-group">
                <input 
                  type="checkbox" id="isDepartureOpen" name="isDepartureOpen" 
                  checked={formData.isDepartureOpen} onChange={handleChange}
                />
                <label htmlFor="isDepartureOpen">Rückfahrt noch offen</label>
              </div>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Wie reist du an?</label>
              <select 
                name="transport_mode" className="form-select"
                value={formData.transport_mode} onChange={handleChange}
              >
                <option value="Auto">🚗 Auto</option>
                <option value="Motorrad">🏍️ Motorrad</option>
                <option value="Fahrrad">🚲 Fahrrad</option>
                <option value="Zug">🚂 Zug</option>
                <option value="Flixbus">🚌 Flixbus</option>
                <option value="Suche Transport">❓ Suche Mitfahrgelegenheit</option>
              </select>
              {showSeatsOption && (
                <div className="checkbox-group">
                  <input 
                    type="checkbox" id="has_seats" name="has_seats" 
                    checked={formData.has_seats} onChange={handleChange}
                  />
                  <label htmlFor="has_seats">Ich habe noch Platz im Fahrzeug</label>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Schlafplatz</label>
              <select 
                name="schlafplatz" className="form-select" required
                value={formData.schlafplatz} onChange={handleChange}
              >
                <option value="" disabled>Bitte wählen...</option>
                <option value="Reggae Hut" disabled={reggaeHutFull}>
                  🛖 Reggae Hut {reggaeHutFull ? '(Ausgebucht)' : ''}
                </option>
                <option value="Haus" disabled={hausFull}>
                  🏠 Haus {hausFull ? '(Ausgebucht)' : ''}
                </option>
                <option value="Eigenes Zelt">⛺ Eigenes Zelt</option>
                <option value="Hotel">🏨 Hotel</option>
              </select>

              {formData.arrival_date && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>🛖 Reggae Hut Belegung:</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: reggaeHutFull ? '#ef4444' : 'var(--color-text-muted)' }}>
                      {reggaeHutCount} / {reggaeHutMax}
                    </span>
                  </div>
                  <div className="schlafplatz-vacancy-bar">
                    <div 
                      className="schlafplatz-vacancy-fill" 
                      style={{ 
                        width: `${(reggaeHutCount / reggaeHutMax) * 100}%`,
                        backgroundColor: reggaeHutFull ? '#ef4444' : 'var(--color-brand)' 
                      }}
                    ></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>🏠 Haupthaus Belegung:</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: hausFull ? '#ef4444' : 'var(--color-text-muted)' }}>
                      {hausCount} / {hausMax}
                    </span>
                  </div>
                  <div className="schlafplatz-vacancy-bar">
                    <div 
                      className="schlafplatz-vacancy-fill" 
                      style={{ 
                        width: `${(hausCount / hausMax) * 100}%`,
                        backgroundColor: hausFull ? '#ef4444' : 'var(--color-accent-blue)' 
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Handynummer (für SMS-Bestätigung)</label>
              <input 
                type="tel" name="phone" className="form-input" 
                placeholder="+49 ..." required
                value={formData.phone} onChange={handleChange}
              />
              <div className="checkbox-group" style={{ marginTop: '0.5rem' }}>
                <input 
                  type="checkbox" id="hide_phone" name="hide_phone" 
                  checked={formData.hide_phone} onChange={handleChange}
                />
                <label htmlFor="hide_phone">Meine Handynummer nicht öffentlich in der Tabelle anzeigen</label>
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Notizen / Mitbringsel</label>
            <textarea 
              name="notes" className="form-textarea" rows="2" 
              placeholder="Besonderheiten, Allergien, oder was du mitbringst..."
              value={formData.notes} onChange={handleChange}
            ></textarea>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              Eintragen
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddParticipantForm
