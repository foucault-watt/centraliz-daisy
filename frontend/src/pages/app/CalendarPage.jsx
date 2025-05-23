import "cally";
import { addDays, format, getDay, isWeekend, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertTriangle, // Pour l'icône d'erreur dans le toast
  Calendar as CalendarIcon, // Pour l'icône d'info dans le toast
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info, // Pour l'icône d'info dans le toast
} from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useRef, useState } from "react";
import DayView from "../../components/calendar/DayView";
import WeekView from "../../components/calendar/WeekView";
import {
  formatWeekTitleString,
  getWorkWeek,
  parseICalData,
} from "../../utils/CalendarUtils";

function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(
    DateTime.now().setZone("Europe/Paris").toJSDate()
  );
  const [view, setView] = useState(window.innerWidth < 768 ? "day" : "week");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // État pour les toasts daisyUI
  const [toastInfo, setToastInfo] = useState({
    message: "",
    type: "error", // 'error', 'success', 'info', 'warning'
    visible: false,
    icon: null,
  });

  // Clé pour déclencher le re-fetch des événements lorsque la semaine change
  // const currentWeekIso = useMemo(() => {
  //   return startOfWeek(currentDate, { weekStartsOn: 1 }).toISOString();
  // }, [currentDate]);

  // Fonction pour afficher un toast daisyUI
  const showToast = (message, type = "error", duration = 5000) => {
    let iconComponent;
    switch (type) {
      case "success":
        iconComponent = (
          <CheckCircle2 className="stroke-current shrink-0 h-6 w-6" />
        );
        break;
      case "info":
        iconComponent = <Info className="stroke-current shrink-0 h-6 w-6" />;
        break;
      case "warning":
        iconComponent = (
          <AlertTriangle className="stroke-current shrink-0 h-6 w-6" />
        );
        break;
      case "error":
      default:
        iconComponent = (
          <AlertTriangle className="stroke-current shrink-0 h-6 w-6" />
        );
        break;
    }
    setToastInfo({ message, type, visible: true, icon: iconComponent });
    setTimeout(() => {
      setToastInfo((prev) => ({ ...prev, visible: false }));
    }, duration);
  };

  // Fetch des événements depuis l'API
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/events/hp-data", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // Les cookies de session sont automatiquement envoyés par le navigateur
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              `Erreur ${response.status} lors de la récupération du calendrier.`
          );
        }

        const icalRawData = await response.text();
        const parsedEvents = parseICalData(icalRawData);
        setEvents(parsedEvents);
      } catch (err) {
        console.error("Erreur lors du fetch des événements:", err);
        const errorMessage =
          err.message ||
          "Impossible de charger les événements. Vérifiez votre lien iCal dans les paramètres.";
        setError(errorMessage);
        setEvents([]); // Vider les événements en cas d'erreur
        showToast(errorMessage, "error"); // Utilisation du toast daisyUI
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []); // Re-fetch uniquement au montage du composant

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
      newDate = DateTime.fromJSDate(currentDate, { zone: "Europe/Paris" })
        .minus({ days: 1 })
        .toJSDate();
      if (getDay(newDate) === 0) {
        // Si on atterrit un dimanche en reculant
        newDate = addDays(newDate, -2); // Aller au vendredi
      } else if (getDay(newDate) === 6) {
        // Si on atterrit un samedi en reculant (ex: depuis lundi)
        newDate = addDays(newDate, -1); // Aller au vendredi
      }
    } else {
      // Vue semaine
      newDate = DateTime.fromJSDate(currentDate, { zone: "Europe/Paris" })
        .minus({ weeks: 1 })
        .toJSDate();
    }
    setCurrentDate(newDate);
  };

  const navigateToNext = () => {
    let newDate;
    if (view === "day") {
      newDate = DateTime.fromJSDate(currentDate, { zone: "Europe/Paris" })
        .plus({ days: 1 })
        .toJSDate();
      if (getDay(newDate) === 6) {
        // Si on atterrit un samedi en avançant
        newDate = addDays(newDate, 2); // Aller au lundi
      } else if (getDay(newDate) === 0) {
        // Si on atterrit un dimanche en avançant (ex: depuis vendredi)
        newDate = addDays(newDate, 1); // Aller au lundi
      }
    } else {
      // Vue semaine
      newDate = DateTime.fromJSDate(currentDate, { zone: "Europe/Paris" })
        .plus({ weeks: 1 })
        .toJSDate();
    }
    setCurrentDate(newDate);
  };

  const navigateToToday = () => {
    setCurrentDate(DateTime.now().setZone("Europe/Paris").toJSDate());
  };

  const workWeek = getWorkWeek(
    DateTime.fromJSDate(currentDate, { zone: "Europe/Paris" }).toJSDate()
  );

  // Handler pour la sélection via cally
  function handleCallyChange(e) {
    const val = e.target.value;
    if (val) setCurrentDate(new Date(val));
    setDropdownOpen(false);
  }

  // Fermer le dropdown si clic en dehors
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  return (
    <div className="p-2 sm:p-4 max-w-full bg-base-200 min-h-screen border border-base-200 rounded-xl">
      {/* Conteneur pour les toasts daisyUI */}
      {toastInfo.visible && (
        <div className="toast toast-bottom toast-center sm:toast-end z-[100]">
          <div
            role="alert"
            className={`alert alert-${toastInfo.type} shadow-lg`}
          >
            {toastInfo.icon}
            <span>{toastInfo.message}</span>
          </div>
        </div>
      )}

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
        <div className="navbar-end flex gap-2">
          {/* Indicateur de chargement */}
          {isLoading && (
            <span className="loading loading-spinner loading-sm text-primary mr-2"></span>
          )}
          {/* Dropdown calendrier cally */}
          <div className="dropdown" ref={dropdownRef}>
            <button
              type="button"
              tabIndex={0}
              className="btn btn-ghost btn-sm sm:btn-md"
              aria-label="Choisir une date"
              onClick={() => setDropdownOpen((v) => !v)}
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
            {dropdownOpen && (
              <div
                tabIndex={0}
                className="dropdown-content z-[60] mt-2 p-2 bg-base-100 rounded-box border border-base-300 shadow-lg"
              >
                <calendar-date
                  class="cally bg-base-100"
                  value={format(currentDate, "yyyy-MM-dd")}
                  onChange={handleCallyChange}
                >
                  <svg
                    aria-label="Previous"
                    className="fill-current size-4"
                    slot="previous"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M15.75 19.5 8.25 12l7.5-7.5"
                    ></path>
                  </svg>
                  <svg
                    aria-label="Next"
                    className="fill-current size-4"
                    slot="next"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="m8.25 4.5 7.5 7.5-7.5 7.5"
                    ></path>
                  </svg>
                  <calendar-month></calendar-month>
                </calendar-date>
              </div>
            )}
          </div>
          {/* Boutons de navigation */}
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
      {error && !isLoading && (
        <div role="alert" className="alert alert-error my-4">
          <AlertTriangle className="stroke-current shrink-0 h-6 w-6" />
          <span>Erreur : {error}</span>
        </div>
      )}

      {!error && view === "day" ? (
        <DayView currentDate={currentDate} events={events} />
      ) : !error && view === "week" ? (
        <WeekView
          workWeekDays={workWeek.days}
          events={events}
          currentDate={currentDate}
        />
      ) : null}

      {!isLoading && !error && events.length === 0 && (
        <div className="text-center py-10">
          <p className="text-lg text-base-content/70">
            Aucun événement à afficher pour cette période.
          </p>
          <p className="text-sm text-base-content/50 mt-2">
            Vérifiez que votre lien iCalendar est correctement configuré dans
            les paramètres et qu'il contient des événements.
          </p>
        </div>
      )}
    </div>
  );
}

export default CalendarPage;
