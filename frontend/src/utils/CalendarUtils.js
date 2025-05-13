import {
  addDays,
  eachDayOfInterval,
  endOfDay,
  format,
  isSameDay,
  isWithinInterval,
  setHours,
  setMinutes,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Retourne les jours de la semaine de travail (lundi à vendredi) pour une date donnée.
 * @param {Date} date - La date de référence.
 * @returns {{start: Date, end: Date, days: Date[]}} Un objet avec le début, la fin et un tableau des jours de la semaine de travail.
 */
export const getWorkWeek = (date) => {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  const friday = addDays(monday, 4);
  const days = eachDayOfInterval({ start: monday, end: friday });
  return { start: monday, end: friday, days };
};

/**
 * Vérifie si une date donnée est aujourd'hui.
 * @param {Date} date - La date à vérifier.
 * @returns {boolean} True si la date est aujourd'hui, false sinon.
 */
export const isToday = (date) => isSameDay(date, new Date());

/**
 * Génère un tableau des heures de travail.
 * @returns {Array<{hour: number, label: string}>} Un tableau d'objets avec l'heure et le label.
 */
export const getWorkingHours = () => {
  // Crée un tableau [{hour: 8, label: "08:00"}, ..., {hour: 17, label: "17:00"}] pour 10 slots horaires
  // La journée de travail va de 8h00 à 18h00 (le slot de 17h va jusqu'à 17h59)
  const hoursArray = [];
  for (let i = 8; i <= 17; i++) {
    hoursArray.push({ hour: i, label: `${i.toString().padStart(2, "0")}:00` });
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
 * @param {Date} referenceDate - La date de référence pour générer les événements autour de cette semaine.
 * @returns {Array<Object>} Un tableau d'événements.
 */
export function generateSampleEvents() {
  // Définir la semaine du 12/05/2025
  const baseDate = new Date(2025, 4, 12); // 12 mai 2025 (mois indexés à partir de 0)

  // Créer un tableau pour stocker les événements
  const events = [];

  // Lundi 12/05/2025
  events.push({
    id: 1,
    name: "Cours Mathématiques",
    type: "Cours Magistral",
    prof: "M. Dupont",
    room: "A101",
    color: "primary",
    start: new Date(2025, 4, 12, 8, 30),
    end: new Date(2025, 4, 12, 10, 30),
  });

  events.push({
    id: 2,
    name: "TD Informatique",
    type: "TD",
    prof: "Mme Martin",
    room: "B203",
    color: "accent",
    start: new Date(2025, 4, 12, 14, 0),
    end: new Date(2025, 4, 12, 16, 0),
  });

  // Mardi 13/05/2025
  events.push({
    id: 3,
    name: "Projet Collaboratif",
    type: "TP",
    prof: "M. Bernard",
    room: "Labo C",
    color: "secondary",
    start: new Date(2025, 4, 13, 9, 0),
    end: new Date(2025, 4, 13, 12, 0),
    description: "Préparation du rendu final",
  });

  // Mercredi 14/05/2025
  events.push({
    id: 4,
    name: "Communication",
    type: "Cours Magistral",
    prof: "Mme Petit",
    room: "Amphi A",
    color: "info",
    start: new Date(2025, 4, 14, 10, 0),
    end: new Date(2025, 4, 14, 12, 0),
  });

  events.push({
    id: 5,
    name: "Anglais",
    type: "TD",
    prof: "M. Smith",
    room: "D105",
    color: "success",
    start: new Date(2025, 4, 14, 13, 30),
    end: new Date(2025, 4, 14, 15, 30),
  });

  // Jeudi 15/05/2025
  events.push({
    id: 6,
    name: "Gestion de Projet",
    type: "Cours Magistral",
    prof: "Mme Dubois",
    room: "Amphi B",
    color: "warning",
    start: new Date(2025, 4, 15, 8, 0),
    end: new Date(2025, 4, 15, 11, 0),
    description: "Examen en fin de séance",
  });

  // Vendredi 16/05/2025
  events.push({
    id: 7,
    name: "Soutenance",
    type: "Évaluation",
    prof: "Jury",
    room: "Salle des conseils",
    color: "error",
    start: new Date(2025, 4, 16, 14, 0),
    end: new Date(2025, 4, 16, 15, 0),
  });

  events.push({
    id: 8,
    name: "Synthèse hebdomadaire",
    type: "Réunion",
    prof: "Équipe pédagogique",
    room: "E001",
    color: "neutral",
    start: new Date(2025, 4, 16, 16, 0),
    end: new Date(2025, 4, 16, 17, 30),
  });

  // Pour ajouter des événements qui se chevauchent
  events.push({
    id: 9,
    name: "Tutorat",
    type: "Accompagnement",
    prof: "M. Robert",
    room: "E202",
    color: "secondary",
    start: new Date(2025, 4, 13, 11, 0),
    end: new Date(2025, 4, 13, 13, 0),
  });

  return events;
}

/**
 * Récupère les événements pour un jour spécifique.
 * @param {Array<Object>} events - La liste de tous les événements.
 * @param {Date} day - Le jour pour lequel récupérer les événements.
 * @returns {Array<Object>} Les événements pour ce jour.
 */
export const getEventsForDay = (events, day) => {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
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
