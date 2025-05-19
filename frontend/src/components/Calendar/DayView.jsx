import { DateTime } from "luxon";
import {
  calculateEventLayout,
  getEventsForDay,
  getWorkingHours,
  isToday,
} from "../../utils/CalendarUtils";

// EventCard reste majoritairement le même, mais le style sera appliqué dynamiquement
function EventCard({ event, style }) {
  const startTime = DateTime.fromJSDate(event.start, {
    zone: "Europe/Paris",
  }).toFormat("HH:mm");
  const endTime = DateTime.fromJSDate(event.end, {
    zone: "Europe/Paris",
  }).toFormat("HH:mm");

  // Déterminer la couleur en fonction de l'importance de l'événement
  const eventColor =
    event.id === "TNE"
      ? "bg-info text-info-content"
      : event.id === "CB"
      ? "bg-error text-error-content"
      : "bg-primary text-primary-content";

  return (
    <div
      className={`card card-compact ${eventColor} shadow-md p-2 mb-0.5`} // mb-0.5 au lieu de mb-1
      style={{ ...style, position: "absolute", zIndex: 10 }} // Positionnement absolu
    >
      <p className="font-semibold text-xs">{event.name}</p>
      <p className="text-xs opacity-80">
        {startTime} - {endTime}
      </p>
      {event.description && (
        <p className="text-xs opacity-70 mt-0.5 truncate">
          {event.description}
        </p>
      )}
    </div>
  );
}

function DayView({ currentDate, events }) {
  const hours = getWorkingHours();
  const firstHourGrid = hours[0]?.hour || 8;
  const lastHourGrid = hours[hours.length - 1]?.hour || 17;
  const PIXELS_PER_HOUR_DAY = 60; // Ajusté pour une meilleure granularité, avant c'était 70px par slot

  const gridSettings = {
    firstHour: firstHourGrid,
    lastHour: lastHourGrid,
    pixelsPerHour: PIXELS_PER_HOUR_DAY,
  };

  const dayEvents = getEventsForDay(
    events,
    DateTime.fromJSDate(currentDate, { zone: "Europe/Paris" }).toJSDate()
  );
  const laidOutEvents = calculateEventLayout(dayEvents, gridSettings);
  const isCurrentDayToday = isToday(currentDate);

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body p-3 sm:p-4">
        <div className="flex">
          {/* Colonne des heures */}
          <div className="w-16 sm:w-20">
            {hours.map(({ hour, label }) => (
              <div
                key={hour}
                className="text-xs sm:text-sm font-medium text-base-content/60 flex items-start pt-1 pr-2 border-b border-base-300/30 last:border-b-0"
                style={{ height: `${PIXELS_PER_HOUR_DAY}px` }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Conteneur des événements */}
          <div
            className={`flex-1 relative ${
              isCurrentDayToday ? "bg-primary/5" : "bg-base-200/20"
            }`}
          >
            {/* Lignes de fond pour la clarté visuelle */}
            {hours.map(({ hour }) => (
              <div
                key={`bg-day-${hour}`}
                className="border-b border-base-300/30 last:border-b-0"
                style={{ height: `${PIXELS_PER_HOUR_DAY}px` }}
              ></div>
            ))}
            {/* Événements */}
            {laidOutEvents.map(({ event: ev, top, height, left, width }) => (
              <EventCard
                key={ev.id}
                event={ev}
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  left: `${left}%`,
                  width: `calc(${width}% - 4px)`, // -4px pour espacement
                  marginLeft: "2px",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DayView;
