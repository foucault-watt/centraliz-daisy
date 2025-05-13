import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  calculateEventLayout,
  getEventsForDay,
  getWorkingHours,
  isToday,
} from "../../utils/CalendarUtils";

// EventCardWeek reste majoritairement le même, mais le style sera appliqué dynamiquement
function EventCardWeek({ event, style }) {
  const startTime = format(event.start, "HH:mm");
  const endTime = format(event.end, "HH:mm");
  return (
    <div
      className="tooltip tooltip-fixed w-full z-[50]"
      // ↑ z-[50] pour que le tooltip soit au-dessus du calendrier
      // tooltip-fixed empêche le tooltip de sortir de la fenêtre visible
      data-tip={
        `${event.name} (${startTime} - ${endTime})\n` +
        `${event.type} • ${event.prof} • ${event.room}` +
        (event.description ? "\n" + event.description : "")
      }
      style={{ ...style, position: "absolute", zIndex: 10 }}
    >
      <div
        className={`bg-${event.color} text-${event.color}-content rounded p-1 shadow text-left w-full h-full overflow-hidden text-xs border border-${event.color} border-opacity-40 flex flex-col`}
      >
        <div className="font-semibold truncate">{event.name}</div>
        <div className="flex flex-wrap gap-x-1 text-[10px] opacity-90">
          <span className="truncate">{event.type}</span>
          <span className="opacity-60">•</span>
          <span className="truncate">{event.prof}</span>
          <span className="opacity-60">•</span>
          <span className="truncate">{event.room}</span>
        </div>
        <div className="text-[10px] opacity-70 mt-auto">
          {startTime} - {endTime}
        </div>
      </div>
    </div>
  );
}

function WeekView({ workWeekDays, events }) {
  const hours = getWorkingHours();
  const firstHourGrid = hours[0]?.hour || 8;
  const lastHourGrid = hours[hours.length - 1]?.hour || 17;
  const PIXELS_PER_HOUR_WEEK = 48; // Corresponds à h-12
  const TIME_COLUMN_WIDTH_CLASS = "w-12"; // 48px
  const TIME_COLUMN_WIDTH_PX = "48px"; // Pour la grille CSS

  const gridSettings = {
    firstHour: firstHourGrid,
    lastHour: lastHourGrid,
    pixelsPerHour: PIXELS_PER_HOUR_WEEK,
  };

  return (
    <div className="card bg-base-100 shadow border border-base-300 overflow-hidden">
      {/* En-tête des jours (sticky) */}
      <div
        className={`grid sticky top-0 z-30 bg-base-100`}
        style={{
          gridTemplateColumns: `${TIME_COLUMN_WIDTH_PX} repeat(5, minmax(60px,1fr))`,
        }}
      >
        <div
          className={`border-b border-r border-base-300 h-10 ${TIME_COLUMN_WIDTH_CLASS}`}
        ></div>
        {/* Coin vide aligné */}
        {workWeekDays.map((day) => {
          const today = isToday(day);
          return (
            <div
              key={`header-${day.toISOString()}`}
              className={`text-center p-1 border-b border-r border-base-300 h-10 flex flex-col justify-center items-center
                ${
                  today
                    ? "bg-primary/10 text-primary font-semibold"
                    : "bg-base-100"
                }`}
            >
              <span className="text-xs font-medium capitalize">
                {format(day, "eee", { locale: fr })}
              </span>
              <span className="text-base font-bold text-base-content/90">
                {format(day, "d", { locale: fr })}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex">
        {/* Colonne des heures */}
        <div
          className={`bg-base-100 border-r border-base-300 ${TIME_COLUMN_WIDTH_CLASS}`}
        >
          {hours.map(({ hour, label }) => (
            <div
              key={`time-${hour}`}
              className="h-12 flex items-center justify-end text-[11px] font-medium text-base-content/70 pr-1 pl-1 border-t border-base-300"
              style={{ height: `${PIXELS_PER_HOUR_WEEK}px` }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grille des jours pour les événements */}
        <div className="flex-1 grid grid-cols-5">
          {workWeekDays.map((day, dayIndex) => {
            const dayEvents = getEventsForDay(events, day);
            const laidOutEvents = calculateEventLayout(dayEvents, gridSettings);
            const isCurrentDayToday = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`relative ${
                  dayIndex < workWeekDays.length - 1
                    ? "border-r border-base-300"
                    : ""
                }`}
              >
                {/* Lignes de fond pour les heures */}
                {hours.map(({ hour: h }) => (
                  <div
                    key={`bg-${h}-${day.toISOString()}`}
                    className={`border-t border-base-300 
                      ${
                        isCurrentDayToday
                          ? "bg-primary/5"
                          : "bg-base-200/20 hover:bg-base-300/30"
                      }`}
                    style={{ height: `${PIXELS_PER_HOUR_WEEK}px` }}
                  ></div>
                ))}
                {/* Événements */}
                {laidOutEvents.map(
                  ({ event: ev, top, height, left, width }) => (
                    <EventCardWeek
                      key={ev.id}
                      event={ev}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: `${left}%`,
                        width: `calc(${width}% - 2px)`, // -2px pour petit espacement
                        marginLeft: `1px`, // Pour centrer l'espacement
                      }}
                    />
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default WeekView;
