import { useState, useEffect } from 'react'
import { Plus, Lock, Unlock, Send, Settings } from 'lucide-react'
import { differenceInDays, parseISO, isValid } from 'date-fns'
import Header from './components/Header'
import ParticipantsTable from './components/ParticipantsTable'
import AddParticipantForm from './components/AddParticipantForm'
import EditParticipantForm from './components/EditParticipantForm'
import RulesModal from './components/RulesModal'
import { supabase } from './supabaseClient'
import InfoModal from './components/InfoModal'
import DonationModal from './components/DonationModal'

function App() {
  const [participants, setParticipants] = useState([])
  const [isRulesOpen, setIsRulesOpen] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Admin State
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [adminPhone1, setAdminPhone1] = useState('')
  const [adminPhone2, setAdminPhone2] = useState('')
  const [adminPhone3, setAdminPhone3] = useState('')
  const [notifyAdmin, setNotifyAdmin] = useState(true)
  const [showAdminSettings, setShowAdminSettings] = useState(false)
  
  // Edit State
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [participantToEdit, setParticipantToEdit] = useState(null)

  // Floating notifications state
  const [alerts, setAlerts] = useState([])

  const addAlert = (msg) => {
    const id = Date.now()
    setAlerts(prev => [...prev, { id, msg }])
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id))
    }, 8000)
  }

  // Fetch data from Supabase on mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoaded(false)
    
    // Fetch public columns of participants (excludes id and phone)
    const { data: pData, error: pError } = await supabase
      .from('participants')
      .select('name, start_location, arrival_date, departure_date, transport_mode, has_seats, schlafplatz, status, notes, created_at')
      .order('created_at', { ascending: true })
      
    if (pData) {
      setParticipants(pData)
    }

    // Check if user is trying to edit their own booking (URL has ?edit=UUID)
    const urlParams = new URLSearchParams(window.location.search)
    const editId = urlParams.get('edit')
    if (editId) {
      const { data: guestData, error: guestError } = await supabase
        .rpc('get_participant_by_id', { participant_id: editId })
        
      if (guestData && guestData.length > 0) {
        setParticipantToEdit(guestData[0])
        setIsEditFormOpen(true)
      } else {
        addAlert("⚠️ Eintrag nicht gefunden oder abgelaufen.")
      }
    }
    
    setIsLoaded(true)
  }

  const handleStartSignUp = () => {
    setIsRulesOpen(true)
  }

  const handleRulesAccepted = () => {
    setIsRulesOpen(false)
    setIsFormOpen(true)
  }

  const handleAddParticipant = async (newParticipant) => {
    // Send data to the secure Guest Signup RPC endpoint
    const { data: newId, error } = await supabase.rpc('register_participant_guest', {
      p_name: newParticipant.name,
      p_start_location: newParticipant.start_location,
      p_arrival_date: newParticipant.arrival_date,
      p_departure_date: newParticipant.departure_date,
      p_transport_mode: newParticipant.transport_mode,
      p_has_seats: newParticipant.has_seats,
      p_schlafplatz: newParticipant.schlafplatz,
      p_phone: newParticipant.phone,
      p_hide_phone: newParticipant.hide_phone,
      p_notes: newParticipant.notes
    })
    
    if (error) {
      alert("Fehler beim Eintragen: " + error.message)
      return
    }

    setIsFormOpen(false)
    setIsDonationModalOpen(true)
    
    // Reload public list
    fetchData()
  }

  const handleEditSubmit = async (updatedParticipant) => {
    // Send data to the secure Guest Edit RPC endpoint
    const { error } = await supabase.rpc('update_participant_guest', {
      participant_id: updatedParticipant.id,
      p_name: updatedParticipant.name,
      p_start_location: updatedParticipant.start_location,
      p_arrival_date: updatedParticipant.arrival_date,
      p_departure_date: updatedParticipant.departure_date,
      p_transport_mode: updatedParticipant.transport_mode,
      p_has_seats: updatedParticipant.has_seats,
      p_schlafplatz: updatedParticipant.schlafplatz,
      p_phone: updatedParticipant.phone,
      p_hide_phone: updatedParticipant.hide_phone,
      p_notes: updatedParticipant.notes
    })

    if (error) {
      alert("Fehler beim Speichern der Änderungen: " + error.message)
      return
    }

    setIsEditFormOpen(false)
    setParticipantToEdit(null)
    addAlert("Eintrag erfolgreich aktualisiert!")
    
    // Clear url parameter (?edit=...)
    window.history.replaceState({}, document.title, window.location.pathname)
    
    // Reload data
    fetchData()
  }

  const handleDeleteParticipant = async (id) => {
    if (isAdmin && adminPassword) {
      if (window.confirm('Möchtest du diesen Eintrag wirklich löschen?')) {
        const { error } = await supabase.rpc('delete_participant_admin', {
          admin_password: adminPassword,
          participant_id: id
        })
        
        if (!error) {
          setParticipants(participants.filter(p => p.id !== id))
          addAlert("Eintrag gelöscht.")
        } else {
          alert("Fehler beim Löschen: " + error.message)
        }
      }
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    if (isAdmin && adminPassword) {
      const { error } = await supabase.rpc('update_participant_status_admin', {
        admin_password: adminPassword,
        participant_id: id,
        new_status: newStatus
      })
      
      if (!error) {
        setParticipants(participants.map(p => 
          p.id === id ? { ...p, status: newStatus } : p
        ))
        addAlert(`Status auf "${newStatus}" geändert.`)
      } else {
        alert("Fehler beim Ändern des Status: " + error.message)
      }
    }
  }

  const handleSaveAdminSettings = async () => {
    if (isAdmin && adminPassword) {
      const { error } = await supabase.rpc('save_admin_settings_admin', {
        admin_password: adminPassword,
        phone1: adminPhone1,
        phone2: adminPhone2,
        phone3: adminPhone3,
        notify: notifyAdmin
      })
      
      if (!error) {
        alert("Admin-Einstellungen in der Datenbank gespeichert!")
      } else {
        alert("Fehler beim Speichern: " + error.message)
      }
    }
  }

  const handleAdminToggle = async () => {
    if (isAdmin) {
      setIsAdmin(false)
      setAdminPassword('')
      setShowAdminSettings(false)
      setAdminPhone1('')
      setAdminPhone2('')
      setAdminPhone3('')
      // Reload public data
      fetchData()
      return
    }
    
    const pwd = window.prompt("Bitte Admin-Passwort eingeben:")
    if (pwd) {
      // 1. Verify password server-side
      const { data: isPasswordCorrect, error: verifyError } = await supabase
        .rpc('verify_admin', { entered_password: pwd })
        
      if (isPasswordCorrect) {
        setIsAdmin(true)
        setAdminPassword(pwd)
        
        // 2. Load complete database details with IDs and phone numbers
        const { data: pData } = await supabase.rpc('get_participants_admin', { admin_password: pwd })
        if (pData) {
          setParticipants(pData)
        }
        
        // 3. Load Admin phone settings
        const { data: aData } = await supabase.rpc('get_admin_settings_admin', { admin_password: pwd })
        if (aData && aData.length > 0) {
          const primary = aData.find(a => a.is_primary)
          const others = aData.filter(a => !a.is_primary)
          if (primary) setAdminPhone1(primary.phone)
          if (others[0]) setAdminPhone2(others[0].phone)
          if (others[1]) setAdminPhone3(others[1].phone)
          
          setNotifyAdmin(aData[0].receive_sms)
        }
        
        addAlert("🔑 Admin-Modus aktiviert.")
      } else {
        alert("Falsches Passwort!")
      }
    }
  }

  const visibleParticipants = participants.filter(p => {
    if (isAdmin) return true;
    
    if (!p.departure_date || p.departure_date === 'offen') return true;
    
    const depDate = parseISO(p.departure_date);
    if (!isValid(depDate)) return true;
    
    const daysSinceDeparture = differenceInDays(new Date(), depDate);
    return daysSinceDeparture <= 1;
  });

  return (
    <div className="app-container">
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
          <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="checkbox-group">
                <input 
                  type="checkbox" 
                  id="notifyAdmin" 
                  checked={notifyAdmin} 
                  onChange={(e) => setNotifyAdmin(e.target.checked)} 
                />
                <label htmlFor="notifyAdmin" style={{ color: 'white' }}>SMS bei neuen Buchungen / Änderungen erhalten</label>
              </div>
              <button className="btn btn-primary" onClick={handleSaveAdminSettings}>Speichern</button>
            </div>
          </div>
        </div>
      )}

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

      <DonationModal 
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
      />
    </div>
  )
}

export default App
