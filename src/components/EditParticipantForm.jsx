import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { parseISO, isBefore, isValid } from 'date-fns'

const EditParticipantForm = ({ isOpen, onClose, onSubmit, participants = [], initialData = null }) => {
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

  // Set form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        isDepartureOpen: initialData.departure_date === 'offen'
      })
    }
  }, [initialData])

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

  // Calculate remaining spots (excluding the current participant's own spot)
  const otherParticipants = participants.filter(p => p.id !== initialData?.id)
  const newDep = formData.isDepartureOpen ? 'offen' : formData.departure_date;
  const overlappingParticipants = otherParticipants.filter(p => 
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

    const finalData = { ...formData }
    if (finalData.isDepartureOpen) {
      finalData.departure_date = 'offen'
    }
    delete finalData.isDepartureOpen
    
    onSubmit(finalData)
  }

  const showSeatsOption = formData.transport_mode === 'Auto' || formData.transport_mode === 'Motorrad'

  if (!initialData) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={(e) => {
      if(e.target.className.includes('modal-overlay')) onClose();
    }}>
      <div className="modal-content glass-panel" style={{ padding: '2rem' }}>
        <div className="modal-header">
          <h3>Eintrag bearbeiten</h3>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit}>
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
                min={new Date().toISOString().split('T')[0]}
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
                  type="checkbox" id="edit_isDepartureOpen" name="isDepartureOpen" 
                  checked={formData.isDepartureOpen} onChange={handleChange}
                />
                <label htmlFor="edit_isDepartureOpen">Rückfahrt noch offen</label>
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
                    type="checkbox" id="edit_has_seats" name="has_seats" 
                    checked={formData.has_seats} onChange={handleChange}
                  />
                  <label htmlFor="edit_has_seats">Ich habe noch Platz im Fahrzeug</label>
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
                <option value="Reggae Hut" disabled={reggaeHutFull && formData.schlafplatz !== 'Reggae Hut'}>
                  🛖 Reggae Hut {reggaeHutFull && formData.schlafplatz !== 'Reggae Hut' ? '(Ausgebucht)' : `(noch ${reggaeHutMax - reggaeHutCount} frei)`}
                </option>
                <option value="Haus" disabled={hausFull && formData.schlafplatz !== 'Haus'}>
                  🏠 Haus {hausFull && formData.schlafplatz !== 'Haus' ? '(Ausgebucht)' : `(noch ${hausMax - hausCount} frei)`}
                </option>
                <option value="Eigenes Zelt">⛺ Eigenes Zelt</option>
                <option value="Hotel">🏨 Hotel</option>
              </select>
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
              <Save size={18} />
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditParticipantForm
