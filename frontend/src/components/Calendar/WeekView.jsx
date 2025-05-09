import { format } from "date-fns";
import { fr } from "date-fns/locale";
import React from "react";
import {
  getEventsForSlot,
  getWorkingHours,
  isToday,
} from "../../utils/CalendarUtils";

// Détecte si deux événements se chevauchent ou se touchent
function areEventsOverlapping(a, b) {
  return (
    (a.start < b.end && a.end > b.start) ||
    a.end.getTime() === b.start.getTime() ||
    b.end.getTime() === a.start.getTime()
  );
}

function EventCardWeek({ event, style }) {
  const startTime = format(event.start, "HH:mm");
  const endTime = format(event.end, "HH:mm");
  return (
    <div
      className="tooltip tooltip-bottom w-full"
      data-tip={
        `${event.name} (${startTime} - ${endTime})\n` +
        `${event.type} • ${event.prof} • ${event.room}` +
        (event.description ? "\n" + event.description : "")
      }
      style={style}
    >
      <div
        className={`bg-${event.color} text-${event.color}-content rounded p-1 mb-0.5 shadow text-left w-full overflow-hidden text-xs border border-${event.color} border-opacity-40`}
      >
        <div className="font-semibold truncate">{event.name}</div>
        <div className="flex flex-wrap gap-x-1 text-[10px] opacity-90">
          <span className="">{event.type}</span>
          <span className="opacity-60">•</span>
          <span className="">{event.prof}</span>
          <span className="opacity-60">•</span>
          <span className="">{event.room}</span>
        </div>
        <div className="text-[10px] opacity-70">
          {startTime} - {endTime}
        </div>
      </div>
    </div>
  );
}

function WeekView({ workWeekDays, events }) {
  const hours = getWorkingHours();

  // Pour chaque slot, détecte les groupes d'événements qui se chevauchent
  function groupOverlappingEvents(slotEvents) {
    if (slotEvents.length < 2) return slotEvents.map((e) => [e]);
    const groups = [];
    let currentGroup = [slotEvents[0]];
    for (let i = 1; i < slotEvents.length; i++) {
      const prev = currentGroup[currentGroup.length - 1];
      const curr = slotEvents[i];
      if (areEventsOverlapping(prev, curr)) {
        currentGroup.push(curr);
      } else {
        groups.push(currentGroup);
        currentGroup = [curr];
      }
    }
    groups.push(currentGroup);
    return groups;
  }

  return (
    <div className="card bg-base-100 shadow border border-base-300/50">
      <div>
        <div className="relative">
          <div className="grid grid-cols-[auto_repeat(5,minmax(60px,1fr))]">
            {/* Coin supérieur gauche vide */}
            <div className="sticky left-0 top-0 z-30 bg-base-100 border-b border-r border-base-300/50 p-1 h-10"></div>
            {/* En-têtes des jours */}
            {workWeekDays.map((day) => {
              const today = isToday(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`sticky top-0 z-20 text-center p-1 border-b border-r border-base-300/50 h-10 flex flex-col justify-center items-center
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
            {/* Grille horaire principale */}
            {hours.map(({ hour }) => (
              <React.Fragment key={hour}>
                {/* Colonne des heures */}
                <div className="px-1 sticky left-0 z-20 bg-base-100 flex items-center justify-end text-[11px] font-medium text-base-content/70 pr-1 h-12 border-r border-t border-base-300/50">
                  {`${hour}h`}
                </div>
                {/* Cellules pour chaque jour de cette heure */}
                {workWeekDays.map((day, dayIndex) => {
                  const today = isToday(day);
                  const slotEvents = getEventsForSlot(events, day, hour).sort(
                    (a, b) => a.start - b.start
                  );
                  // Regroupe les événements qui se chevauchent
                  const groups = groupOverlappingEvents(slotEvents);
                  return (
                    <div
                      key={`${hour}-${day.toISOString()}`}
                      className={`border-t border-base-300/50 min-h-12 p-0.5 relative
                        ${
                          today
                            ? "bg-primary/5"
                            : "bg-base-200/20 hover:bg-base-300/30"
                        }
                        ${
                          dayIndex < workWeekDays.length - 1 ? "border-r" : ""
                        }`}
                    >
                      {/* Affichage côte à côte si chevauchement */}
                      {groups.map((group, idx) =>
                        group.length === 1 ? (
                          <EventCardWeek key={group[0].id} event={group[0]} />
                        ) : (
                          <div key={idx} className="flex gap-0.5">
                            {group.map((ev) => (
                              <EventCardWeek
                                key={ev.id}
                                event={ev}
                                style={{
                                  width: `${100 / group.length}%`,
                                  minWidth: 0,
                                }}
                              />
                            ))}
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeekView;
