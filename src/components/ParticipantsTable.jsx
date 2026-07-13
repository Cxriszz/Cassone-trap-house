import { format, parseISO, differenceInDays } from 'date-fns'
import { de } from 'date-fns/locale'
import { Trash2, Phone, Train, Car, Bus, Bike, HelpCircle, Check, X, Clock, Lock } from 'lucide-react'

const TransportIcon = ({ mode }) => {
  switch (mode?.toLowerCase()) {
    case 'zug': return <><Train size={14} /> Zug</>;
    case 'motorrad': return <><Bike size={14} /> Motorrad</>;
    case 'fahrrad': return <><Bike size={14} /> Fahrrad</>;
    case 'flixbus': return <><Bus size={14} /> Flixbus</>;
    case 'suche transport': return <><HelpCircle size={14} /> Suche</>;
    case 'auto':
    default: return <><Car size={14} /> Auto</>;
  }
}

const ParticipantsTable = ({ participants, onDelete, onStatusChange, isAdmin }) => {
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    if (dateString.toLowerCase() === 'offen') return 'Offen';
    try {
      return format(parseISO(dateString), 'dd. MMM yyyy', { locale: de });
    } catch {
      return dateString;
    }
  }

  const calculateDays = (arrival, departure) => {
    if (!arrival || !departure || departure.toLowerCase() === 'offen') return '?';
    try {
      const days = differenceInDays(parseISO(departure), parseISO(arrival));
      return days > 0 ? days : 0;
    } catch {
      return '?';
    }
  }

  const renderStatus = (p) => {
    if (isAdmin) {
      return (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {p.status === 'Genehmigt' ? (
            <span className="badge badge-status-approved">Genehmigt</span>
          ) : (
            <button 
              className="action-btn approve" 
              onClick={() => onStatusChange(p.id, 'Genehmigt')}
              title="Genehmigen (SMS senden)"
            >
              <Check size={16} />
            </button>
          )}
          
          {p.status === 'Abgelehnt' ? (
            <span className="badge badge-status-rejected">Abgelehnt</span>
          ) : (
            <button 
              className="action-btn reject" 
              onClick={() => onStatusChange(p.id, 'Abgelehnt')}
              title="Ablehnen (SMS senden)"
            >
              <X size={16} />
            </button>
          )}
          
          {p.status === 'Ausstehend' && (
            <span className="badge badge-status-pending">Ausstehend</span>
          )}
        </div>
      )
    }

    // Non-admin view
    switch (p.status) {
      case 'Genehmigt': return <span className="badge badge-status-approved">✅ Genehmigt</span>;
      case 'Abgelehnt': return <span className="badge badge-status-rejected">❌ Abgelehnt</span>;
      case 'Ausstehend': 
      default: return <span className="badge badge-status-pending"><Clock size={12} style={{marginRight: '2px'}}/> In Bearbeitung</span>;
    }
  }

  if (!participants || participants.length === 0) {
    return (
      <div className="empty-state">
        <p>Noch keine Einträge. Sei der Erste, der sich anmeldet!</p>
      </div>
    )
  }

  return (
    <div className="table-container">
      <table className="participants-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>An/Abreise</th>
            {isAdmin && <th>Tage</th>}
            <th>Transport</th>
            <th>Schlafplatz</th>
            <th>Status</th>
            <th>Kontakt</th>
            <th>Notizen</th>
            {isAdmin && <th></th>}
          </tr>
        </thead>
        <tbody>
          {participants.map((p, index) => (
            <tr key={p.id || index}>
              <td>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>aus {p.start_location}</div>
              </td>
              <td>
                <div style={{ fontSize: '0.9rem' }}>{formatDate(p.arrival_date)}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>bis {formatDate(p.departure_date)}</div>
              </td>
              {isAdmin && (
                <td>
                  <strong>{calculateDays(p.arrival_date, p.departure_date)}</strong>
                </td>
              )}
              <td>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span className={`badge badge-${p.transport_mode?.split(' ')[0]?.toLowerCase() || 'auto'}`}>
                    <TransportIcon mode={p.transport_mode} />
                  </span>
                  {p.has_seats && (p.transport_mode === 'Auto' || p.transport_mode === 'Motorrad') && (
                    <span className="badge-seats">Plätze frei</span>
                  )}
                </div>
              </td>
              <td>
                <strong>{p.schlafplatz || '-'}</strong>
              </td>
              <td>
                {renderStatus(p)}
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  {p.hide_phone && !isAdmin ? (
                    <span style={{ color: 'var(--color-text-light)' }}>-</span>
                  ) : (
                    <>
                      <Phone size={12} color="var(--color-text-light)" />
                      {p.phone}
                      {p.hide_phone && isAdmin && <Lock size={12} color="var(--color-brand)" title="Vom Gast versteckt" style={{ marginLeft: '4px' }} />}
                    </>
                  )}
                </div>
              </td>
              <td>
                {p.notes ? (
                  <div style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', maxWidth: '180px' }}>
                    {p.notes}
                  </div>
                ) : '-'}
              </td>
              {isAdmin && (
                <td style={{ textAlign: 'right' }}>
                  <button 
                    className="action-btn delete" 
                    onClick={() => onDelete(p.id)}
                    title="Eintrag löschen"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ParticipantsTable
