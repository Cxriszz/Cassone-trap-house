import { useState, useEffect } from 'react'
import { Plus, Lock, Unlock, Send, Settings, User } from 'lucide-react'
import { differenceInDays, parseISO, isValid } from 'date-fns'
import Header from './components/Header'
import ParticipantsTable from './components/ParticipantsTable'
import AddParticipantForm from './components/AddParticipantForm'
import EditParticipantForm from './components/EditParticipantForm'
import RulesModal from './components/RulesModal'
import { mockDataStore } from './supabaseClient'
import InfoModal from './components/InfoModal'

function App() {
  const [participants, setParticipants] = useState([])
  const [isRulesOpen, setIsRulesOpen] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Admin State
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminPhone1, setAdminPhone1] = useState('+49 123 456789')
  const [adminPhone2, setAdminPhone2] = useState('')
  const [adminPhone3, setAdminPhone3] = useState('')
  const [notifyAdmin, setNotifyAdmin] = useState(true)
  const [showAdminSettings, setShowAdminSettings] = useState(false)
  
  // Edit State
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [participantToEdit, setParticipantToEdit] = useState(null)

  // SMS Alert Simulation State
  const [alerts, setAlerts] = useState([])

  const addAlert = (msg) => {
    const id = Date.now()
    setAlerts(prev => [...prev, { id, msg }])
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id))
    }, 8000)
  }

  // Simulate fetching data
  useEffect(() => {
    const timer = setTimeout(() => {
      setParticipants(mockDataStore.participants)
      setIsLoaded(true)
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  const handleStartSignUp = () => {
    setIsRulesOpen(true)
  }

  const handleRulesAccepted = () => {
    setIsRulesOpen(false)
    setIsFormOpen(true)
  }

  const handleAddParticipant = (newParticipant) => {
    const participantWithId = {
      ...newParticipant,
      id: Date.now().toString(),
      status: 'pending'
    }
    setParticipants([...participants, participantWithId])
    setIsFormOpen(false)
    
    // Simulate SMS to Admin
    if (notifyAdmin) {
      const phones = [adminPhone1, adminPhone2, adminPhone3].filter(p => p.trim() !== '')
      phones.forEach(phone => {
        addAlert(`📱 [ADMIN SMS an ${phone}]: Neue Buchung von ${newParticipant.name}. Bitte prüfen!`)
      })
    }
    
    // Simulate SMS to Guest
    // We show a brief notification on top, and also append the "Simulated SMS" to the bottom for testing the link
    alert("Eine Bestätigungs-SMS wurde soeben an dich verschickt!")
    addAlert(
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <strong>📩 [SIMULIERTE SMS an {newParticipant.phone}]:</strong>
        <span>Buchung eingegangen! Dein Status ist in Bearbeitung. Notfallkontakt: {adminPhone1}</span>
        <button 
          onClick={() => handleSimulateEditLink(participantWithId.id)}
          style={{ background: 'var(--color-brand)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', alignSelf: 'flex-start', marginTop: '4px' }}
        >
          Eintrag bearbeiten / löschen (Link)
        </button>
      </div>
    )
  }

  const handleEditSubmit = (updatedParticipant) => {
    const wasApproved = updatedParticipant.status === 'approved'
    // If they were approved, status resets to pending
    const finalParticipant = {
      ...updatedParticipant,
      status: 'pending'
    }
    
    setParticipants(participants.map(p => 
      p.id === updatedParticipant.id ? finalParticipant : p
    ))
    setIsEditFormOpen(false)
    setParticipantToEdit(null)
    
    if (wasApproved && notifyAdmin) {
      const phones = [adminPhone1, adminPhone2, adminPhone3].filter(p => p.trim() !== '')
      phones.forEach(phone => {
        addAlert(`📱 [ADMIN SMS an ${phone}]: ${updatedParticipant.name} hat den Eintrag bearbeitet. Status wieder auf Ausstehend gesetzt!`)
      })
    } else {
      addAlert("Eintrag erfolgreich aktualisiert.")
    }
  }

  const handleSimulateEditLink = (id) => {
    const p = participants.find(x => x.id === id)
    if (p) {
      setParticipantToEdit(p)
      setIsEditFormOpen(true)
    }
  }

  const handleDeleteParticipant = (id) => {
    if (isAdmin) {
      if (window.confirm('Möchtest du diesen Eintrag wirklich löschen?')) {
        setParticipants(participants.filter(p => p.id !== id))
      }
    }
  }

  const handleStatusChange = (id, newStatus) => {
    if (isAdmin) {
      setParticipants(participants.map(p => 
        p.id === id ? { ...p, status: newStatus } : p
      ))
      
      const p = participants.find(x => x.id === id)
      const actionText = newStatus === 'approved' ? 'Genehmigt' : 'Abgelehnt'
      
      // Simulate SMS to Guest
      addAlert(`📱 [GAST SMS an ${p?.phone}]: Hallo ${p?.name}, deine Buchung wurde: ${actionText}!`)
    }
  }

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false)
      setShowAdminSettings(false)
      return
    }
    const pwd = window.prompt("Bitte Admin-Passwort eingeben:")
    if (pwd === "cassone2026") {
      setIsAdmin(true)
    } else if (pwd !== null) {
      alert("Falsches Passwort!")
    }
  }

  // Filter logic: Remove participants whose departure was more than 1 day ago (if not admin)
  const visibleParticipants = participants.filter(p => {
    if (isAdmin) return true; // Admin sees all
    
    if (!p.departure_date || p.departure_date === 'offen') return true;
    
    const depDate = parseISO(p.departure_date);
    if (!isValid(depDate)) return true;
    
    const daysSinceDeparture = differenceInDays(new Date(), depDate);
    // Hide if they left more than 1 day ago
    return daysSinceDeparture <= 1;
  });

  return (
    <div className="app-container">
      {/* Background Sunset Image */}
      <div className="background-drone"></div>

      {isAdmin && (
        <div className="admin-banner animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
          <span>Admin-Modus aktiv: Alle Einträge sichtbar. Du kannst genehmigen und bearbeiten.</span>
          <button 
            onClick={() => setShowAdminSettings(!showAdminSettings)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Settings size={14} /> Einstellungen
          </button>
        </div>
      )}

      {isAdmin && showAdminSettings && (
        <div className="glass-panel animate-fade-in" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <h3>Admin Einstellungen ⚙️</h3>
          <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label className="form-label" style={{ color: 'white', marginBottom: '0' }}>Admin-Telefonnummern (Für SMS)</label>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginTop: '-8px' }}>Admin 1 ist der primäre Notfallkontakt für Gäste</div>
              <input 
                type="text" 
                className="form-input" 
                value={adminPhone1} 
                onChange={(e) => setAdminPhone1(e.target.value)} 
                placeholder="Admin 1: +49 ..."
                style={{ width: '300px' }}
              />
              <input 
                type="text" 
                className="form-input" 
                value={adminPhone2} 
                onChange={(e) => setAdminPhone2(e.target.value)} 
                placeholder="Admin 2: +49 ... (optional)"
                style={{ width: '300px' }}
              />
              <input 
                type="text" 
                className="form-input" 
                value={adminPhone3} 
                onChange={(e) => setAdminPhone3(e.target.value)} 
                placeholder="Admin 3: +49 ... (optional)"
                style={{ width: '300px' }}
              />
            </div>
            <div className="checkbox-group" style={{ marginTop: '1.5rem' }}>
              <input 
                type="checkbox" 
                id="notifyAdmin" 
                checked={notifyAdmin} 
                onChange={(e) => setNotifyAdmin(e.target.checked)} 
              />
              <label htmlFor="notifyAdmin" style={{ color: 'white' }}>SMS bei neuen Buchungen / Änderungen erhalten</label>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Alerts */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {alerts.map(alert => (
          <div key={alert.id} className="custom-alert">
            <Send size={18} style={{ flexShrink: 0 }} />
            <div>{alert.msg}</div>
          </div>
        ))}
      </div>

      <Header />
      
      {isLoaded && (
        <div className="glass-panel animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <div className="flex-between">
            <h2>Interaktive Gästeliste</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setIsInfoOpen(true)}>
                ℹ️ Infos
              </button>
              <button className="btn btn-primary" onClick={handleStartSignUp}>
                <Plus size={18} />
                Ich bin dabei!
              </button>
            </div>
          </div>
          
          <ParticipantsTable 
            participants={visibleParticipants} 
            onDelete={handleDeleteParticipant}
            onStatusChange={handleStatusChange}
            isAdmin={isAdmin}
          />
        </div>
      )}

      {/* Footer Area */}
      <footer className="footer-area animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
        <div className="footer-brand-container">
          <div className="logo-wrapper left">
            <img src="/logo-46.jpg" alt="Fiat Yamaha 46" className="brand-logo" />
          </div>
          
          <div className="admin-login-wrapper">
            <button 
              onClick={handleAdminToggle} 
              className="admin-btn"
            >
              {isAdmin ? <Unlock size={14} /> : <Lock size={14} />}
              {isAdmin ? 'Admin Logout' : 'Admin Login'}
            </button>
          </div>
          
          <div className="logo-wrapper right">
            <img src="/logo-yamaha.jpg" alt="Yamaha Racing" className="brand-logo" />
          </div>
        </div>
      </footer>

      <RulesModal 
        isOpen={isRulesOpen} 
        onClose={() => setIsRulesOpen(false)} 
        onAccept={handleRulesAccepted}
      />

      <InfoModal 
        isOpen={isInfoOpen} 
        onClose={() => setIsInfoOpen(false)} 
      />

      <AddParticipantForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSubmit={handleAddParticipant}
        participants={participants}
      />

      <EditParticipantForm 
        isOpen={isEditFormOpen} 
        onClose={() => setIsEditFormOpen(false)} 
        onSubmit={handleEditSubmit}
        participants={participants}
        initialData={participantToEdit}
      />
    </div>
  )
}

export default App
