import { format, isWithinInterval, setHours, setMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { DateTime } from "luxon";

/**
 * Retourne les jours de la semaine de travail (lundi à vendredi) pour une date donnée.
 * @param {Date} date - La date de référence.
 * @returns {{start: Date, end: Date, days: Date[]}} Un objet avec le début, la fin et un tableau des jours de la semaine de travail.
 */
export const getWorkWeek = (date) => {
  // Convertir la date en objet DateTime avec le bon fuseau horaire
  const dateTime = DateTime.fromJSDate(date, { zone: "Europe/Paris" });

  // Trouver le lundi de la semaine courante
  // Si c'est déjà un lundi (1), on garde cette date
  // Sinon, on remonte jusqu'au lundi précédent
  let monday;
  const dayOfWeek = dateTime.weekday; // 1 = lundi, 7 = dimanche dans Luxon

  if (dayOfWeek === 1) {
    monday = dateTime;
  } else if (dayOfWeek > 1 && dayOfWeek <= 7) {
    // Si nous sommes entre mardi (2) et dimanche (7), on recule jusqu'au lundi
    monday = dateTime.minus({ days: dayOfWeek - 1 });
  }

  // Convertir en date JavaScript
  const mondayDate = monday.toJSDate();

  // Créer chaque jour de la semaine de travail (lundi à vendredi)
  const days = [];
  for (let i = 0; i < 5; i++) {
    days.push(DateTime.fromJSDate(mondayDate).plus({ days: i }).toJSDate());
  }

  // Le vendredi est 4 jours après le lundi
  const fridayDate = days[4];

  return { start: mondayDate, end: fridayDate, days };
};

/**
 * Vérifie si une date donnée est aujourd'hui.
 * @param {Date} date - La date à vérifier.
 * @returns {boolean} True si la date est aujourd'hui, false sinon.
 */
export const isToday = (date) => {
  const now = DateTime.now().setZone("Europe/Paris");
  return DateTime.fromJSDate(date, { zone: "Europe/Paris" }).hasSame(
    now,
    "day"
  );
};

/**
 * Génère un tableau des heures de travail.
 * @returns {Array<{hour: number, label: string}>} Un tableau d'objets avec l'heure et le label.
 */
export const getWorkingHours = () => {
  const hoursArray = [];
  for (let i = 8; i <= 17; i++) {
    hoursArray.push({
      hour: i,
      label: DateTime.fromObject(
        { hour: i },
        { zone: "Europe/Paris" }
      ).toFormat("HH:mm"),
    });
  }
  return hoursArray;
};

/**
 * Formate une plage de dates pour le titre de la semaine.
 * @param {Date} startDate - Date de début.
 * @param {Date} endDate - Date de fin.
 * @returns {string} Le titre formaté (ex: "1 - 5 juillet 2024").
 */
export const formatWeekTitleString = (startDate, endDate) => {
  const startDay = format(startDate, "d", { locale: fr });
  const endDayMonthYear = format(endDate, "d MMMM yyyy", { locale: fr });

  if (format(startDate, "MMMM yyyy") === format(endDate, "MMMM yyyy")) {
    return `${startDay} - ${endDayMonthYear}`;
  }
  // Si les mois/années sont différents (peu probable pour une semaine mais géré)
  const startDayMonth = format(startDate, "d MMMM", { locale: fr });
  return `${startDayMonth} - ${endDayMonthYear}`;
};

/**
 * Génère des événements de test pour le calendrier.
 * @returns {Array<Object>} Un tableau d'événements.
 */
export function generateSampleEvents() {
  const events = [
    {
      id: "TNE",
      name: "Réunion d'équipe",
      type: "Réunion",
      prof: "M. Dupont",
      room: "Salle A",
      start: new Date(2025, 4, 19, 9, 0),
      end: new Date(2025, 4, 19, 10, 0),
    },
    {
      id: "CB",
      name: "Présentation finale",
      type: "Évaluation",
      prof: "Mme Martin",
      room: "Amphi B",
      start: new Date(2025, 4, 20, 14, 0),
      end: new Date(2025, 4, 20, 16, 0),
    },
    {
      id: 3,
      name: "Cours de Mathématiques",
      type: "Cours Magistral",
      prof: "M. Bernard",
      room: "A101",
      start: new Date(2025, 4, 21, 8, 30),
      end: new Date(2025, 4, 21, 10, 30),
    },
    {
      id: 4,
      name: "Atelier Informatique",
      type: "TP",
      prof: "Mme Petit",
      room: "Labo C",
      start: new Date(2025, 4, 22, 13, 0),
      end: new Date(2025, 4, 22, 15, 0),
    },
    {
      id: 5,
      name: "Anglais",
      type: "TD",
      prof: "M. Smith",
      room: "D105",
      start: new Date(2025, 4, 23, 10, 0),
      end: new Date(2025, 4, 23, 12, 0),
    },
  ];

  return events;
}

/**
 * Récupère les événements pour un jour spécifique.
 * @param {Array<Object>} events - La liste de tous les événements.
 * @param {Date} day - Le jour pour lequel récupérer les événements.
 * @returns {Array<Object>} Les événements pour ce jour.
 */
export const getEventsForDay = (events, day) => {
  const dayStart = DateTime.fromJSDate(day, { zone: "Europe/Paris" })
    .startOf("day")
    .toJSDate();
  const dayEnd = DateTime.fromJSDate(day, { zone: "Europe/Paris" })
    .endOf("day")
    .toJSDate();
  return events.filter(
    (event) =>
      isWithinInterval(event.start, { start: dayStart, end: dayEnd }) ||
      isWithinInterval(event.end, { start: dayStart, end: dayEnd }) ||
      (event.start < dayStart && event.end > dayEnd) // Événement qui s'étend sur toute la journée
  );
};

/**
 * Récupère les événements pour un créneau horaire spécifique d'un jour donné.
 * @param {Array<Object>} events - La liste de tous les événements.
 * @param {Date} day - Le jour.
 * @param {number} hour - L'heure de début du créneau (ex: 8 pour 8h-9h).
 * @returns {Array<Object>} Les événements pour ce créneau.
 */
export const getEventsForSlot = (events, day, hour) => {
  const slotStart = setMinutes(setHours(day, hour), 0);
  const slotEnd = setMinutes(setHours(day, hour + 1), 0); // Le slot dure 1 heure

  return events.filter((event) => {
    // Vérifie si l'événement chevauche le créneau horaire
    const eventStartsInSlot = event.start >= slotStart && event.start < slotEnd;
    const eventEndsInSlot = event.end > slotStart && event.end <= slotEnd;
    const eventSpansOverSlot = event.start < slotStart && event.end > slotEnd;

    return eventStartsInSlot || eventEndsInSlot || eventSpansOverSlot;
  });
};

/**
 * Calcule la disposition des événements pour un jour donné.
 * @param {Array<Object>} dayEvents - Liste des événements pour le jour.
 * @param {Object} gridSettings - Paramètres de la grille { firstHour, lastHour, pixelsPerHour }.
 * @returns {Array<Object>} Liste d'événements avec leurs propriétés de layout { event, top, height, left, width }.
 */
export const calculateEventLayout = (dayEvents, gridSettings) => {
  const { firstHour, lastHour, pixelsPerHour } = gridSettings;
  const laidOutEvents = [];

  // 1. Prétraitement : calculer top/height initiaux et filtrer/tronquer
  const processedEvents = dayEvents
    .map((event) => {
      const eventStartHourFloat =
        event.start.getHours() + event.start.getMinutes() / 60;
      const eventEndHourFloat =
        event.end.getHours() + event.end.getMinutes() / 60;

      // Ignorer les événements complètement en dehors des heures de la grille
      if (
        eventEndHourFloat <= firstHour ||
        eventStartHourFloat >= lastHour + 1
      ) {
        return null;
      }

      const displayStartHour = Math.max(firstHour, eventStartHourFloat);
      const displayEndHour = Math.min(lastHour + 1, eventEndHourFloat);

      if (displayStartHour >= displayEndHour) return null;

      const top = (displayStartHour - firstHour) * pixelsPerHour;
      const height = Math.max(
        pixelsPerHour / 4,
        (displayEndHour - displayStartHour) * pixelsPerHour - 1
      ); // Hauteur min 15min, -1 pour bordure

      return {
        ...event,
        _layout: {
          top,
          height,
          start: displayStartHour, // Heure de début dans la grille
          end: displayEndHour, // Heure de fin dans la grille
          col: 0,
          span: 1, // Initial span, non utilisé dans cet algo simplifié pour le span horizontal
        },
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a._layout.start < b._layout.start) return -1;
      if (a._layout.start > b._layout.start) return 1;
      if (a._layout.end > b._layout.end) return -1;
      if (a._layout.end < b._layout.end) return 1;
      return 0;
    });

  if (!processedEvents.length) return [];

  // 2. Gestion des chevauchements et attribution des colonnes virtuelles
  const columns = []; // Chaque élément est une liste d'événements dans cette colonne virtuelle
  processedEvents.forEach((event) => {
    let placed = false;
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const overlapsInCol = col.some(
        (placedEvent) =>
          event._layout.start < placedEvent._layout.end &&
          event._layout.end > placedEvent._layout.start
      );
      if (!overlapsInCol) {
        col.push(event);
        event._layout.col = i;
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([event]);
      event._layout.col = columns.length - 1;
    }
  });

  const numCols = columns.length || 1; // Évite la division par zéro

  // 3. Calculer left/width finaux
  processedEvents.forEach((currentEvent) => {
    // Déterminer le nombre max de colonnes pour le groupe de chevauchement auquel cet event appartient
    // Pour simplifier, on utilise numCols global calculé précédemment.
    // Une logique plus avancée recalculerait numCols pour chaque "île" de chevauchement.
    const colWidth = 100 / numCols;

    laidOutEvents.push({
      event: currentEvent, // L'événement original
      top: currentEvent._layout.top,
      height: currentEvent._layout.height,
      left: currentEvent._layout.col * colWidth,
      width: colWidth,
    });
  });

  return laidOutEvents;
};
