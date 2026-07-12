import { useState, useEffect } from 'react'
import { Plus, Lock, Unlock, Send, Settings, User } from 'lucide-react'
import { differenceInDays, parseISO, isValid } from 'date-fns'
import Header from './components/Header'
import ParticipantsTable from './components/ParticipantsTable'
import AddParticipantForm from './components/AddParticipantForm'
import EditParticipantForm from './components/EditParticipantForm'
import RulesModal from './components/RulesModal'
import { supabase } from './supabaseClient'
import InfoModal from './components/InfoModal'

function App() {
  const [participants, setParticipants] = useState([])
  const [isRulesOpen, setIsRulesOpen] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Admin State
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminPhone1, setAdminPhone1] = useState('')
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

  // Fetch data from Supabase
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    // Fetch Participants
    const { data: pData, error: pError } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: true })
      
    if (pData) {
      setParticipants(pData)
      const urlParams = new URLSearchParams(window.location.search)
      const editId = urlParams.get('edit')
      if (editId) {
        const pToEdit = pData.find(x => x.id === editId)
        if (pToEdit) {
          setParticipantToEdit(pToEdit)
          setIsEditFormOpen(true)
        }
      }
    }
    
    // Fetch Admins
    const { data: aData, error: aError } = await supabase
      .from('admins')
      .select('*')
      .order('id', { ascending: true })
      
    if (aData && aData.length > 0) {
      const primary = aData.find(a => a.is_primary)
      const others = aData.filter(a => !a.is_primary)
      if (primary) setAdminPhone1(primary.phone)
      if (others[0]) setAdminPhone2(others[0].phone)
      if (others[1]) setAdminPhone3(others[1].phone)
      
      setNotifyAdmin(aData[0].receive_sms)
    }
    
    setIsLoaded(true)
  }

  const sendRealSms = async (to, body) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: { to, body }
      })
      if (error) {
        console.error("SMS Error:", error)
        addAlert(`❌ SMS Error an ${to}: ${error.message || 'Unbekannter Fehler. (Evtl. Nummer nicht bei Twilio verifiziert?)'}`)
      } else if (data && data.error) {
        console.error("SMS Data Error:", data.error)
        addAlert(`❌ SMS Error an ${to}: ${data.error}`)
      }
    } catch (e) {
      console.error(e)
      addAlert(`❌ SMS Exception an ${to}: ${e.message}`)
    }
  }

  const handleStartSignUp = () => {
    setIsRulesOpen(true)
  }

  const handleRulesAccepted = () => {
    setIsRulesOpen(false)
    setIsFormOpen(true)
  }

  const handleAddParticipant = async (newParticipant) => {
    // Keep only digits and '+'
    let formattedPhone = newParticipant.phone.replace(/[^0-9+]/g, '');
    
    if (formattedPhone.startsWith('00')) {
      formattedPhone = '+' + formattedPhone.substring(2);
    } else if (formattedPhone.startsWith('0')) {
      formattedPhone = '+49' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+49' + formattedPhone;
    }

    const { data, error } = await supabase.from('participants').insert([{
      name: newParticipant.name,
      start_location: newParticipant.start_location,
      arrival_date: newParticipant.arrival_date,
      departure_date: newParticipant.departure_date,
      transport_mode: newParticipant.transport_mode,
      has_seats: newParticipant.has_seats,
      schlafplatz: newParticipant.schlafplatz,
      phone: formattedPhone,
      notes: newParticipant.notes,
      status: 'Ausstehend'
    }]).select()
    
    if (error) {
      alert("Fehler beim Speichern: " + error.message)
      return
    }

    const participantWithId = data[0]
    setParticipants([...participants, participantWithId])
    setIsFormOpen(false)
    
    // Real SMS to Admin
    if (notifyAdmin) {
      const phones = [adminPhone1, adminPhone2, adminPhone3].filter(p => p && p.trim() !== '')
      phones.forEach(phone => {
        const msg = `Neue Buchung von ${newParticipant.name}. Bitte prüfen!`
        addAlert(`📱 [ADMIN SMS an ${phone}]: ${msg}`)
        sendRealSms(phone, msg)
      })
    }
    
    // Real SMS to Guest
    alert("Eine Bestätigungs-SMS wurde soeben an dich verschickt!")
    const editLink = `${window.location.origin}/?edit=${participantWithId.id}`
    const smsText = `Cassone: Buchung eingegangen! Dein Status ist in Bearbeitung. Kontakt: ${adminPhone1}. Bearbeiten/Löschen: ${editLink}`
    
    sendRealSms(formattedPhone, smsText)
  }

  const handleEditSubmit = async (updatedParticipant) => {
    const wasApproved = updatedParticipant.status === 'Genehmigt'
    const newStatus = wasApproved ? 'Ausstehend' : updatedParticipant.status
    
    const { data, error } = await supabase.from('participants').update({
      name: updatedParticipant.name,
      start_location: updatedParticipant.start_location,
      arrival_date: updatedParticipant.arrival_date,
      departure_date: updatedParticipant.departure_date,
      transport_mode: updatedParticipant.transport_mode,
      has_seats: updatedParticipant.has_seats,
      schlafplatz: updatedParticipant.schlafplatz,
      phone: updatedParticipant.phone,
      notes: updatedParticipant.notes,
      status: newStatus
    }).eq('id', updatedParticipant.id).select()

    if (error) {
      alert("Fehler beim Speichern: " + error.message)
      return
    }

    const finalParticipant = data[0]
    setParticipants(participants.map(p => 
      p.id === updatedParticipant.id ? finalParticipant : p
    ))
    setIsEditFormOpen(false)
    setParticipantToEdit(null)
    
    if (wasApproved && notifyAdmin) {
      const phones = [adminPhone1, adminPhone2, adminPhone3].filter(p => p && p.trim() !== '')
      phones.forEach(phone => {
        const msg = `${updatedParticipant.name} hat den Eintrag bearbeitet. Status wieder auf Ausstehend gesetzt!`
        addAlert(`📱 [ADMIN SMS an ${phone}]: ${msg}`)
        sendRealSms(phone, msg)
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

  const handleDeleteParticipant = async (id) => {
    if (isAdmin) {
      if (window.confirm('Möchtest du diesen Eintrag wirklich löschen?')) {
        const { error } = await supabase.from('participants').delete().eq('id', id)
        if (!error) {
          setParticipants(participants.filter(p => p.id !== id))
        } else {
          alert("Fehler beim Löschen!")
        }
      }
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    if (isAdmin) {
      const { data, error } = await supabase.from('participants').update({ status: newStatus }).eq('id', id).select()
      if (!error) {
        setParticipants(participants.map(p => 
          p.id === id ? data[0] : p
        ))
        
        const p = participants.find(x => x.id === id)
        const actionText = newStatus === 'Genehmigt' ? 'Genehmigt' : 'Abgelehnt'
        
        const msg = `Hallo ${p?.name}, deine Buchung wurde: ${actionText}!`
        addAlert(`📱 [GAST SMS an ${p?.phone}]: ${msg}`)
        sendRealSms(p?.phone, msg)
      } else {
        alert("Fehler beim Update!")
      }
    }
  }

  const handleSaveAdminSettings = async () => {
    // Delete all admins and insert new ones to sync
    await supabase.from('admins').delete().neq('id', '00000000-0000-0000-0000-000000000000') // Deletes all safely if RLS permits
    
    const inserts = []
    if (adminPhone1) inserts.push({ phone: adminPhone1, is_primary: true, receive_sms: notifyAdmin })
    if (adminPhone2) inserts.push({ phone: adminPhone2, is_primary: false, receive_sms: notifyAdmin })
    if (adminPhone3) inserts.push({ phone: adminPhone3, is_primary: false, receive_sms: notifyAdmin })
    
    if (inserts.length > 0) {
      await supabase.from('admins').insert(inserts)
    }
    alert("Admin-Einstellungen in der Datenbank gespeichert!")
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
            <div>{typeof alert.msg === 'string' ? alert.msg : alert.msg}</div>
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
    </div>
  )
}

export default App
