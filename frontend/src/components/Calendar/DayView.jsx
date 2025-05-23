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

  const eventColorClass =
    event.className || "bg-primary text-primary-content border-primary";

  const tooltipContent = [
    `${event.name} (${startTime} - ${endTime})`,
    event.prof !== "N/A" ? `Prof: ${event.prof}` : null,
    event.room ? `Salle: ${event.room}` : null,
    event.description ? `Desc: ${event.description}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div
      className="tooltip tooltip-fixed w-full z-[50]"
      data-tip={tooltipContent}
      style={{ ...style, position: "absolute", zIndex: 10 }}
    >
      <div
        className={`card card-compact ${eventColorClass} shadow-lg p-3 w-full h-full overflow-hidden flex flex-col justify-center items-center text-center rounded-xl`}
      >
        {/* Main content: Name and Room */}
        <div className="w-full flex flex-col items-center">
          <div
            className="font-extrabold text-xl sm:text-2xl leading-tight break-words text-white"
            style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}
          >
            {event.name}
          </div>
          {event.room && (
            <div className="badge badge-sm badge-ghost mt-1 px-2 opacity-70">
              {event.room}
            </div>
          )}
        </div>

        {/* Bottom content: Professor */}
        <div className="w-full mt-3 text-sm sm:text-base opacity-80 space-y-1 text-white">
          {event.prof !== "N/A" && (
            <p className="italic truncate">{event.prof}</p>
          )}
        </div>
      </div>
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
                key={ev.id} // Assurez-vous que ev.id est unique
                event={ev}
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  left: `${left}%`,
                  width: `calc(${width}% - 4px)`, // Augmentation du margin horizontal
                  marginLeft: "2px", // Augmentation légère
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
