import { format } from "date-fns";
import { Clock } from "lucide-react";
import React from "react";
import {
  getEventsForSlot,
  getWorkingHours,
  isToday,
} from "../../utils/CalendarUtils";

function EventCard({ event }) {
  const startTime = format(event.start, "HH:mm");
  const endTime = format(event.end, "HH:mm");

  return (
    <div
      className={`card card-compact bg-${event.color} text-${event.color}-content shadow-md p-2 mb-1`}
    >
      <p className="font-semibold text-xs">{event.title}</p>
      <p className="text-xs opacity-80">
        {startTime} - {endTime}
      </p>
      {event.description && (
        <p className="text-xs opacity-70 mt-0.5">{event.description}</p>
      )}
    </div>
  );
}

function DayView({ currentDate, events }) {
  const hours = getWorkingHours(); // Heures de 8h à 17h (pour slots 8h-18h)
  const today = isToday(currentDate);
  const dayEvents = events.filter(
    (event) =>
      format(event.start, "yyyy-MM-dd") === format(currentDate, "yyyy-MM-dd") ||
      format(event.end, "yyyy-MM-dd") === format(currentDate, "yyyy-MM-dd")
  );

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body p-3 sm:p-4">
        <div className="space-y-px">
          {" "}
          {/* Réduit l'espace entre les slots */}
          {hours.map(({ hour, label }) => {
            const slotEvents = getEventsForSlot(dayEvents, currentDate, hour);
            return (
              <div
                key={hour}
                className="flex items-stretch border-b border-base-300/30 last:border-b-0 py-1.5 min-h-[70px]"
              >
                {/* Colonne de l'heure */}
                <div className="w-16 sm:w-20 text-xs sm:text-sm font-medium text-base-content/60 flex items-start pt-1 pr-2">
                  {label}
                </div>

                {/* Cellule pour les événements de cette heure */}
                <div
                  className={`flex-1 rounded p-1.5 ${
                    today ? "bg-primary/5" : "bg-base-200/20"
                  }`}
                >
                  {slotEvents.length > 0 ? (
                    slotEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))
                  ) : (
                    <div className="h-full w-full"></div> // Placeholder pour maintenir la hauteur
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DayView;
