import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DateTime } from "luxon";
import { useMemo } from "react";
import {
  calculateEventLayout,
  getEventsForDay,
  getWorkWeek,
  getWorkingHours,
  isToday,
} from "../../utils/CalendarUtils";

function EventCardWeek({ event, style }) {
  const startTime = DateTime.fromJSDate(event.start, {
    zone: "Europe/Paris",
  }).toFormat("HH:mm");
  const endTime = DateTime.fromJSDate(event.end, {
    zone: "Europe/Paris",
  }).toFormat("HH:mm");

  // Déterminer la couleur en fonction de l'importance de l'événement
  const eventColor =
    event.id === "TNE"
      ? "bg-info text-info-content border-info"
      : event.id === "CB"
      ? "bg-error text-error-content border-error"
      : "bg-primary text-primary-content border-primary";

  return (
    <div
      className="tooltip tooltip-fixed w-full z-[50]"
      data-tip={`${event.name} (${startTime} - ${endTime})\n${event.type} • ${
        event.prof
      } • ${event.room}${event.description ? "\n" + event.description : ""}`}
      style={{ ...style, position: "absolute", zIndex: 10 }}
    >
      <div
        className={`${eventColor} rounded p-1 shadow text-left w-full h-full overflow-hidden text-xs border-opacity-40 flex flex-col`}
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

function WeekView({ workWeekDays, events, currentDate }) {
  const hours = getWorkingHours();
  const firstHourGrid = hours[0]?.hour || 8;
  const lastHourGrid = hours[hours.length - 1]?.hour || 17;
  const PIXELS_PER_HOUR_WEEK = 48;
  const TIME_COLUMN_WIDTH_CLASS = "w-12";
  const TIME_COLUMN_WIDTH_PX = "48px";

  const gridSettings = {
    firstHour: firstHourGrid,
    lastHour: lastHourGrid,
    pixelsPerHour: PIXELS_PER_HOUR_WEEK,
  };

  // Récupérer une semaine correcte (lundi-vendredi) si les jours fournis ne sont pas valides
  const validWorkWeek = useMemo(() => {
    // Vérifier si workWeekDays est une semaine valide (5 jours, du lundi au vendredi)
    if (workWeekDays && workWeekDays.length === 5) {
      // Vérifier que le premier jour est un lundi et le dernier un vendredi
      const firstDayOfWeek = workWeekDays[0].getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi
      const lastDayOfWeek = workWeekDays[4].getDay();

      if (firstDayOfWeek === 1 && lastDayOfWeek === 5) {
        // C'est bien une semaine du lundi au vendredi
        return workWeekDays.map((day) =>
          DateTime.fromJSDate(day, { zone: "Europe/Paris" }).toJSDate()
        );
      }
    }

    // Si workWeekDays n'est pas valide, retourner la semaine actuelle
    // ou à partir du premier jour fourni s'il existe
    const referenceDate =
      workWeekDays && workWeekDays.length > 0
        ? workWeekDays[0]
        : new Date(currentDate);

    return getWorkWeek(referenceDate).days;
  }, [workWeekDays, currentDate]);

  return (
    <div className="card bg-base-100 shadow border border-base-300 overflow-hidden">
      {/* En-tête des jours */}
      <div
        className="grid sticky top-0 z-30 bg-base-100"
        style={{
          gridTemplateColumns: `${TIME_COLUMN_WIDTH_PX} repeat(5, minmax(60px,1fr))`,
        }}
      >
        <div
          className={`border-b border-r border-base-300 h-10 ${TIME_COLUMN_WIDTH_CLASS}`}
        ></div>
        {validWorkWeek.map((day) => {
          const today = isToday(day);
          return (
            <div
              key={`header-${day.toISOString()}`}
              className={`text-center p-1 border-b border-r border-base-300 h-10 flex flex-col justify-center items-center ${
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

        {/* Grille des jours */}
        <div className="flex-1 grid grid-cols-5">
          {validWorkWeek.map((day, dayIndex) => {
            const dayEvents = getEventsForDay(events, day);
            const laidOutEvents = calculateEventLayout(dayEvents, gridSettings);
            const isCurrentDayToday = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`relative ${
                  dayIndex < validWorkWeek.length - 1
                    ? "border-r border-base-300"
                    : ""
                }`}
              >
                {hours.map(({ hour: h }) => (
                  <div
                    key={`bg-${h}-${day.toISOString()}`}
                    className={`border-t border-base-300 ${
                      isCurrentDayToday
                        ? "bg-primary/5"
                        : "bg-base-200/20 hover:bg-base-300/30"
                    }`}
                    style={{ height: `${PIXELS_PER_HOUR_WEEK}px` }}
                  ></div>
                ))}
                {laidOutEvents.map(
                  ({ event: ev, top, height, left, width }) => (
                    <EventCardWeek
                      key={ev.id}
                      event={ev}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: `${left}%`,
                        width: `calc(${width}% - 2px)`,
                        marginLeft: `1px`,
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
