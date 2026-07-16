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
import CalendarView from './components/CalendarView'
import DonationModal from './components/DonationModal'


const MOCK_PARTICIPANTS = [
  {
    name: 'Max',
    start_location: 'München',
    arrival_date: '2026-07-10',
    departure_date: '2026-07-18',
    transport_mode: 'Auto',
    has_seats: true,
    schlafplatz: 'Reggae Hut',
    status: 'Genehmigt',
    phone: '+49 170 1111111',
    notes: 'Bringe einen Grill mit 🌭',
    created_at: new Date('2026-07-01').toISOString()
  },
  {
    name: 'Chris',
    start_location: 'Stuttgart',
    arrival_date: '2026-07-12',
    departure_date: '2026-07-20',
    transport_mode: 'Auto',
    has_seats: false,
    schlafplatz: 'Reggae Hut',
    status: 'Genehmigt',
    phone: '+49 170 2222222',
    notes: 'Yamaha T-Shirt ist eingepackt.',
    created_at: new Date('2026-07-02').toISOString()
  },
  {
    name: 'Leonie',
    start_location: 'Berlin',
    arrival_date: '2026-07-14',
    departure_date: '2026-07-17',
    transport_mode: 'Zug',
    has_seats: false,
    schlafplatz: 'Haus',
    status: 'Genehmigt',
    phone: '+49 170 3333333',
    notes: '',
    created_at: new Date('2026-07-03').toISOString()
  },
  {
    name: 'Lukas',
    start_location: 'Hamburg',
    arrival_date: '2026-07-15',
    departure_date: '2026-07-22',
    transport_mode: 'Auto',
    has_seats: true,
    schlafplatz: 'Reggae Hut',
    status: 'Genehmigt',
    phone: '+49 170 4444444',
    notes: 'Habe Platz für 2 Personen.',
    created_at: new Date('2026-07-04').toISOString()
  },
  {
    name: 'Anna',
    start_location: 'Köln',
    arrival_date: '2026-07-19',
    departure_date: '2026-07-25',
    transport_mode: 'Flixbus',
    has_seats: false,
    schlafplatz: 'Eigenes Zelt',
    status: 'Genehmigt',
    phone: '+49 170 5555555',
    notes: 'Bringe gute Laune und Pasta mit.',
    created_at: new Date('2026-07-05').toISOString()
  },
  {
    name: 'Felix',
    start_location: 'Frankfurt',
    arrival_date: '2026-07-22',
    departure_date: '2026-07-28',
    transport_mode: 'Motorrad',
    has_seats: false,
    schlafplatz: 'Haus',
    status: 'Genehmigt',
    phone: '+49 170 6666666',
    notes: 'Anreise über Pässe 🏍️',
    created_at: new Date('2026-07-06').toISOString()
  },
  {
    name: 'Sophie',
    start_location: 'Nürnberg',
    arrival_date: '2026-07-13',
    departure_date: '2026-07-16',
    transport_mode: 'Suche Transport',
    has_seats: false,
    schlafplatz: 'Reggae Hut',
    status: 'Ausstehend',
    phone: '+49 170 7777777',
    notes: 'Suche noch eine Mitfahrgelegenheit ab Nürnberg!',
    created_at: new Date('2026-07-07').toISOString()
  },
  {
    name: 'Paul',
    start_location: 'München',
    arrival_date: '2026-07-25',
    departure_date: 'offen',
    transport_mode: 'Auto',
    has_seats: true,
    schlafplatz: 'Eigenes Zelt',
    status: 'Genehmigt',
    phone: '+49 170 8888888',
    notes: 'Rückfahrt flexibel.',
    created_at: new Date('2026-07-08').toISOString()
  }
];

function App() {
  const [participants, setParticipants] = useState([])
  const [isRulesOpen, setIsRulesOpen] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeImage, setActiveImage] = useState(null)
  
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Prevent background scrolling when a modal or zoom lightbox is open
  useEffect(() => {
    const isAnyModalOpen = isRulesOpen || isInfoOpen || isFormOpen || isEditFormOpen || !!activeImage;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isRulesOpen, isInfoOpen, isFormOpen, isEditFormOpen, activeImage]);

  const fetchData = async () => {
    setIsLoaded(false)
    
    // Fetch public columns of participants (excludes id and phone)
    const { data: pData } = await supabase
      .from('participants')
      .select('name, start_location, arrival_date, departure_date, transport_mode, has_seats, schlafplatz, status, notes, created_at')
      .order('created_at', { ascending: true })
      
    if (pData && pData.length > 0) {
      setParticipants(pData)
    } else {
      setParticipants(MOCK_PARTICIPANTS)
    }


    // Check if user is trying to edit their own booking (URL has ?edit=UUID)
    const urlParams = new URLSearchParams(window.location.search)
    const editId = urlParams.get('edit')
    if (editId) {
      const { data: guestData } = await supabase
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
    const { error } = await supabase.rpc('register_participant_guest', {
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
      const { data: isPasswordCorrect } = await supabase
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
        <div className="admin-banner animate-fade-in">
          <span>Admin-Modus aktiv: Alle Einträge sichtbar. Du kannst genehmigen &amp; bearbeiten.</span>
          <button 
            onClick={() => setShowAdminSettings(!showAdminSettings)}
            className="admin-banner-btn"
          >
            <Settings size={12} /> {showAdminSettings ? 'Verbergen' : 'Einstellungen'}
          </button>
        </div>
      )}

      {isAdmin && showAdminSettings && (
        <div className="glass-panel animate-fade-in" style={{ marginBottom: '2rem', padding: '1.75rem', borderLeft: '4px solid var(--color-accent-blue)' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={18} /> Admin-Einstellungen
          </h3>
          <div className="form-row">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: 'white', marginBottom: '4px' }}>Admin-Telefonnummern (Für SMS)</label>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  Admin 1 ist der primäre Notfallkontakt für Gäste
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={adminPhone1} 
                    onChange={(e) => setAdminPhone1(e.target.value)} 
                    placeholder="Admin 1 (Primär): +49 ..."
                  />
                  <input 
                    type="text" 
                    className="form-input" 
                    value={adminPhone2} 
                    onChange={(e) => setAdminPhone2(e.target.value)} 
                    placeholder="Admin 2: +49 ... (optional)"
                  />
                  <input 
                    type="text" 
                    className="form-input" 
                    value={adminPhone3} 
                    onChange={(e) => setAdminPhone3(e.target.value)} 
                    placeholder="Admin 3: +49 ... (optional)"
                  />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Benachrichtigungen</label>
                <div className="checkbox-group">
                  <input 
                    type="checkbox" 
                    id="notifyAdmin" 
                    checked={notifyAdmin} 
                    onChange={(e) => setNotifyAdmin(e.target.checked)} 
                  />
                  <label htmlFor="notifyAdmin" style={{ color: 'var(--color-text-muted)' }}>SMS bei neuen Buchungen / Änderungen erhalten</label>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
                <button className="btn btn-primary" onClick={handleSaveAdminSettings}>
                  Einstellungen speichern
                </button>
              </div>
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
        <>
          {/* Top Info Cards Grid */}
          <div className="top-grid animate-fade-in" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
            {/* Card 1: House Info with click-to-zoom Drone Image */}
            <div className="info-card">
              <div className="info-card-content">
                <h4 className="info-card-title">🛖 Das Casa Cassone Aperta</h4>
                <p className="info-card-text">
                  Unser privates Domizil liegt inmitten von Olivenbäumen am Gardasee mit direktem Blick auf den See.
                </p>
                
                <div className="media-thumbnail" onClick={() => setActiveImage('/drone-bg.jpg')}>
                  <img src="/drone-bg.jpg" alt="Casa Cassone Aperta Luftbild" />
                  <div className="media-thumbnail-overlay">
                    🔍 Foto vergrößern
                  </div>
                </div>

                <ul className="info-card-list" style={{ marginTop: 'auto' }}>
                  <li>🟢 <strong>Reggae Hut:</strong> Hütte für bis zu 6 Personen.</li>
                  <li>🟢 <strong>Haupthaus:</strong> 2 Betten für Organisatoren.</li>
                  <li>🟢 <strong>Zeltwiese:</strong> Stellflächen für eigene Zelte.</li>
                </ul>
              </div>
            </div>

            {/* Card 2: Interactive Map Widget */}
            <div className="info-card">
              <div className="info-card-content">
                <h4 className="info-card-title">🗺️ Lage &amp; Anfahrt</h4>
                <p className="info-card-text">
                  Klicke auf den Wegweiser unten, um die Skizze vom Parkplatz zum Haus vergrößert anzuzeigen.
                </p>
                
                <div className="media-thumbnail" onClick={() => setActiveImage('/map.jpg')}>
                  <img src="/map.jpg" alt="Casa Cassone Aperta Route Karte" />
                  <div className="media-thumbnail-overlay">
                    🔍 Karte vergrößern
                  </div>
                </div>

                <a 
                  href="https://www.google.com/maps/place/45%C2%B044'04.8%22N+10%C2%B047'31.2%22E/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ width: '100%', marginTop: 'auto', fontSize: '0.75rem', padding: '0.55rem' }}
                >
                  In Google Maps öffnen
                </a>
              </div>
            </div>

            {/* Card 3: Quick Actions Panel */}
            <div className="info-card">
              <div className="info-card-content">
                <h4 className="info-card-title">📋 Schnellzugriff</h4>
                <p className="info-card-text">
                  Wichtige Links, Dokumente und das Regelwerk für deinen Aufenthalt am Gardasee.
                </p>
                
                <ul className="info-meta-list">
                  <li><span>Lage:</span> <strong>Cassone, Italien 🇮🇹</strong></li>
                  <li><span>Saison:</span> <strong>Sommer 2026 ☀️</strong></li>
                  <li><span>Admin-Info:</span> <strong>Login im Seitenfuß</strong></li>
                </ul>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                  <button className="btn btn-secondary" onClick={() => setIsInfoOpen(true)} style={{ width: '100%', fontSize: '0.8rem', padding: '0.6rem' }}>
                    🎒 Packliste &amp; Infos
                  </button>
                  <button className="btn btn-secondary" onClick={() => setIsRulesOpen(true)} style={{ width: '100%', fontSize: '0.8rem', padding: '0.6rem' }}>
                    📜 Hausordnung lesen
                  </button>
                  <a 
                    href="/Haftungsausschluss.pdf" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-secondary" 
                    style={{ width: '100%', fontSize: '0.8rem', padding: '0.6rem', textDecoration: 'none' }}
                  >
                    📄 Haftungsausschluss
                  </a>
                </div>
              </div>
            </div>
          </div>
          {/* Calendar View Card */}
          <CalendarView participants={participants} />

          {/* Interactive Guest List Card */}
          <div className="glass-panel animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
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
        </>
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

      {activeImage && (
        <div className="lightbox-modal" onClick={() => setActiveImage(null)}>
          <img src={activeImage} alt="Vergrößerte Ansicht" className="lightbox-image" />
        </div>
      )}

      <DonationModal 
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
      />
    </div>
  )
}

export default App
