import { addDays, format, getDay, isWeekend, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import DayView from "../components/Calendar/DayView";
import WeekView from "../components/Calendar/WeekView";
import {
  formatWeekTitleString,
  generateSampleEvents,
  getWorkWeek,
} from "../utils/CalendarUtils";

function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState(window.innerWidth < 768 ? "day" : "week");

  // Générer les événements une seule fois ou lorsque la date de référence change de semaine
  // Pour un vrai backend, vous feriez un fetch ici.
  const events = useMemo(
    () => generateSampleEvents(currentDate),
    [
      startOfWeek(currentDate, { weekStartsOn: 1 }).toISOString(), // Clé pour re-générer si la semaine change
    ]
  );

  // Gérer le changement de taille de la fenêtre pour la vue responsive
  useEffect(() => {
    const handleResize = () => {
      setView(window.innerWidth < 768 ? "day" : "week");
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Ajuster la date si elle tombe un week-end
  useEffect(() => {
    let newDate = currentDate;
    let dateChanged = false;
    if (isWeekend(newDate)) {
      if (getDay(newDate) === 6) {
        // Samedi
        newDate = addDays(newDate, -1);
        dateChanged = true;
      } else if (getDay(newDate) === 0) {
        // Dimanche
        newDate = addDays(newDate, 1);
        dateChanged = true;
      }
      if (isWeekend(newDate)) {
        newDate = startOfWeek(newDate, { weekStartsOn: 1 });
        dateChanged = true;
      }
      if (dateChanged) setCurrentDate(newDate);
    }
  }, [currentDate]);

  const navigateToPrevious = () => {
    let newDate;
    if (view === "day") {
      newDate = addDays(currentDate, -1);
      if (getDay(newDate) === 0) {
        // Si on atterrit un dimanche en reculant
        newDate = addDays(newDate, -2); // Aller au vendredi
      } else if (getDay(newDate) === 6) {
        // Si on atterrit un samedi en reculant (ex: depuis lundi)
        newDate = addDays(newDate, -1); // Aller au vendredi
      }
    } else {
      // Vue semaine
      newDate = addDays(currentDate, -7);
    }
    setCurrentDate(newDate);
  };

  const navigateToNext = () => {
    let newDate;
    if (view === "day") {
      newDate = addDays(currentDate, 1);
      if (getDay(newDate) === 6) {
        // Si on atterrit un samedi en avançant
        newDate = addDays(newDate, 2); // Aller au lundi
      } else if (getDay(newDate) === 0) {
        // Si on atterrit un dimanche en avançant (ex: depuis vendredi)
        newDate = addDays(newDate, 1); // Aller au lundi
      }
    } else {
      // Vue semaine
      newDate = addDays(currentDate, 7);
    }
    setCurrentDate(newDate);
  };

  const navigateToToday = () => {
    setCurrentDate(new Date());
  };

  const workWeek = getWorkWeek(currentDate);

  return (
    <div className="p-2 sm:p-4 max-w-full bg-base-200 min-h-screen">
      {/* En-tête du calendrier : Titre et boutons de navigation */}
      <div className="navbar bg-base-100 rounded-box shadow-md mb-4 sm:mb-6">
        <div className="navbar-start">
          <h1 className="text-lg sm:text-2xl font-bold flex items-center text-base-content normal-case">
            <CalendarIcon className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            {view === "day"
              ? format(currentDate, "EEEE d MMMM yyyy", { locale: fr })
              : formatWeekTitleString(workWeek.start, workWeek.end)}
          </h1>
        </div>
        <div className="navbar-end">
          <div className="join">
            <button
              aria-label="Période précédente"
              className="btn btn-ghost btn-sm sm:btn-md join-item"
              onClick={navigateToPrevious}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="btn btn-ghost btn-sm sm:btn-md join-item"
              onClick={navigateToToday}
            >
              Aujourd'hui
            </button>
            <button
              aria-label="Période suivante"
              className="btn btn-ghost btn-sm sm:btn-md join-item"
              onClick={navigateToNext}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Affichage du calendrier (journalier ou hebdomadaire) */}
      {view === "day" ? (
        <DayView currentDate={currentDate} events={events} />
      ) : (
        <WeekView workWeekDays={workWeek.days} events={events} />
      )}
    </div>
  );
}

export default CalendarPage;
