import { useState } from 'react'
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  parseISO, 
  isValid,
  isSameMonth
} from 'date-fns'
import { de } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar, Info, User } from 'lucide-react'


const CalendarView = ({ participants = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [includePending, setIncludePending] = useState(false)

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  // Get start/end dates of the grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  // All days in the calendar grid
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  // Check if participant is present on a given day
  const getParticipantsOnDay = (day) => {
    return participants.filter(p => {
      if (!p.arrival_date) return false
      
      // Filter status if pending is not included
      if (!includePending && p.status !== 'Genehmigt') return false
      // Exclude Rejected bookings completely
      if (p.status === 'Abgelehnt') return false

      const start = parseISO(p.arrival_date)
      if (!isValid(start)) return false

      let end
      if (!p.departure_date || p.departure_date === 'offen') {
        // If departure is open, treat as active for up to 365 days or just active onwards
        end = new Date('2099-12-31')
      } else {
        end = parseISO(p.departure_date)
      }
      if (!isValid(end)) return false

      // Clear hours/minutes for date-only comparison
      const checkTime = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime()
      const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()
      const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime()

      return checkTime >= startTime && checkTime <= endTime
    })
  }

  const getOccupancyStats = (pList) => {
    const reggaeHutCount = pList.filter(p => p.schlafplatz === 'Reggae Hut').length
    const hausCount = pList.filter(p => p.schlafplatz === 'Haus').length
    // Group "Eigenes Zelt", "Hotel", and any other custom values into zelt/garden
    const zeltCount = pList.filter(p => p.schlafplatz !== 'Reggae Hut' && p.schlafplatz !== 'Haus').length
    
    return {
      reggaeHutCount,
      hausCount,
      zeltCount,
      total: pList.length
    }
  }

  // Selected day details
  const selectedDayParticipants = getParticipantsOnDay(selectedDate)
  const selectedDayStats = getOccupancyStats(selectedDayParticipants)

  return (
    <div className="calendar-section glass-panel animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
      <div className="calendar-header-row">
        <div className="calendar-title-container">
          <Calendar className="calendar-icon" size={24} />
          <h2>Belegungs-Kalender</h2>
        </div>
        
        <div className="calendar-controls">
          <div className="checkbox-group" style={{ marginTop: 0, marginRight: '1rem' }}>
            <input 
              type="checkbox" 
              id="includePending" 
              checked={includePending} 
              onChange={(e) => setIncludePending(e.target.checked)} 
            />
            <label htmlFor="includePending" style={{ fontSize: '0.8rem' }}>Ausstehende einblenden</label>
          </div>
          
          <div className="month-nav">
            <button className="month-nav-btn" onClick={handlePrevMonth}>
              <ChevronLeft size={20} />
            </button>
            <span className="current-month-label">
              {format(currentMonth, 'MMMM yyyy', { locale: de })}
            </span>
            <button className="month-nav-btn" onClick={handleNextMonth}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="calendar-grid-container">
        {/* Calendar Main Grid */}
        <div className="calendar-wrapper">
          {/* Weekday Names */}
          <div className="weekdays-grid">
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(wd => (
              <div key={wd} className="weekday-header">{wd}</div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="days-grid">
            {days.map((day, idx) => {
              const pOnDay = getParticipantsOnDay(day)
              const stats = getOccupancyStats(pOnDay)
              const isSelected = isSameDay(day, selectedDate)
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isToday = isSameDay(day, new Date())

              return (
                <div 
                  key={idx} 
                  className={`calendar-day-cell ${!isCurrentMonth ? 'outside-month' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className="day-number-row">
                    <span className="day-number">{format(day, 'd')}</span>
                    {stats.total > 0 && (
                      <span className="day-total-badge">{stats.total}</span>
                    )}
                  </div>

                  {/* Occupancy Human Counts */}
                  <div className="day-occupancy-indicators-icons">
                    {stats.reggaeHutCount > 0 && (
                      <span className="occupancy-icon-text reggae" title={`Reggae Hut: ${stats.reggaeHutCount}/6`}>
                        <User size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
                        <span style={{ verticalAlign: 'middle', marginLeft: '1px' }}>{stats.reggaeHutCount}</span>
                      </span>
                    )}
                    {stats.hausCount > 0 && (
                      <span className="occupancy-icon-text haus" title={`Haupthaus: ${stats.hausCount}/2`}>
                        <User size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
                        <span style={{ verticalAlign: 'middle', marginLeft: '1px' }}>{stats.hausCount}</span>
                      </span>
                    )}
                    {stats.zeltCount > 0 && (
                      <span className="occupancy-icon-text zelt" title={`Zelt/Garten: ${stats.zeltCount}`}>
                        <User size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
                        <span style={{ verticalAlign: 'middle', marginLeft: '1px' }}>{stats.zeltCount}</span>
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Day Details Panel */}
        <div className="day-details-panel">
          <div className="day-details-header">
            <h3>{format(selectedDate, 'EEEE, dd. MMMM yyyy', { locale: de })}</h3>
            <p className="day-details-subtitle">Belegung &amp; anwesende Gäste</p>
          </div>

          <div className="occupancy-summary-cards">
            <div className="occupancy-summary-card">
              <span className="summary-label">🛖 Reggae Hut</span>
              <div className="summary-value-row">
                <span className={`summary-value ${selectedDayStats.reggaeHutCount >= 6 ? 'full' : ''}`}>
                  {selectedDayStats.reggaeHutCount} / 6
                </span>
                <span className="summary-subtext">Betten</span>
              </div>
              <div className="summary-progress-bar">
                <div 
                  className="summary-progress-fill reggae" 
                  style={{ width: `${(selectedDayStats.reggaeHutCount / 6) * 100}%` }}
                />
              </div>
            </div>

            <div className="occupancy-summary-card">
              <span className="summary-label">🏠 Haupthaus</span>
              <div className="summary-value-row">
                <span className={`summary-value ${selectedDayStats.hausCount >= 2 ? 'full' : ''}`}>
                  {selectedDayStats.hausCount} / 2
                </span>
                <span className="summary-subtext">Betten</span>
              </div>
              <div className="summary-progress-bar">
                <div 
                  className="summary-progress-fill haus" 
                  style={{ width: `${(selectedDayStats.hausCount / 2) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="day-guests-list-container">
            <h4>Anwesende Personen ({selectedDayStats.total})</h4>
            
            {selectedDayParticipants.length === 0 ? (
              <div className="no-guests-placeholder">
                <Info size={16} />
                <span>Keine Gäste an diesem Tag registriert.</span>
              </div>
            ) : (
              <div className="day-guests-list">
                {selectedDayParticipants.map((p, idx) => (
                  <div key={idx} className="day-guest-item">
                    <div className="guest-item-main">
                      <span className="guest-name">{p.name}</span>
                      <span className="guest-location">aus {p.start_location}</span>
                    </div>
                    <div className="guest-item-details">
                      <span className={`badge-compact ${p.schlafplatz === 'Reggae Hut' ? 'reggae' : p.schlafplatz === 'Haus' ? 'haus' : 'other'}`}>
                        {p.schlafplatz === 'Reggae Hut' ? '🛖 Hut' : p.schlafplatz === 'Haus' ? '🏠 Haus' : p.schlafplatz === 'Eigenes Zelt' ? '⛺ Zelt' : '🏨 Hotel'}
                      </span>
                      {p.status === 'Ausstehend' && (
                        <span className="badge-compact pending">Urgenehmigt</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarView
