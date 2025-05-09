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
 * Génère un tableau des heures de travail de 8h à 17h (pour des slots de 8h-9h, ..., 17h-18h).
 * @returns {Array<{hour: number, label: string}>} Un tableau d'objets avec l'heure et le label.
 */
export const getWorkingHours = () => {
  // Crée un tableau [{hour: 8, label: "08:00"}, ..., {hour: 17, label: "17:00"}] pour 10 slots horaires
  return Array.from({ length: 10 }, (_, i) => {
    const hour = i + 8;
    return { hour, label: `${hour.toString().padStart(2, "0")}:00` };
  });
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
export const generateSampleEvents = (referenceDate) => {
  const monday = startOfWeek(referenceDate, { weekStartsOn: 1 });
  return [
    {
      id: "1",
      name: "Mathématiques",
      type: "Cours magistral",
      prof: "Mme Dupont",
      room: "A101",
      start: setMinutes(setHours(monday, 10), 0),
      end: setMinutes(setHours(monday, 11), 30),
      color: "primary",
      description: "Chapitre 4 : Intégrales.",
    },
    {
      id: "2",
      name: "Physique",
      type: "TP",
      prof: "M. Martin",
      room: "Lab 2",
      start: setMinutes(setHours(addDays(monday, 1), 14), 0), // Mardi 14h00
      end: setMinutes(setHours(addDays(monday, 1), 15), 0), // Mardi 15h00
      color: "secondary",
      description: "Optique expérimentale.",
    },
    {
      id: "3",
      name: "Anglais",
      type: "Cours",
      prof: "Mme Smith",
      room: "B202",
      start: setMinutes(setHours(addDays(monday, 2), 9), 30), // Mercredi 9h30
      end: setMinutes(setHours(addDays(monday, 2), 10), 30), // Mercredi 10h30
      color: "accent",
      description: "Expression orale.",
    },
    {
      id: "4",
      name: "Histoire",
      type: "TD",
      prof: "M. Bernard",
      room: "C303",
      start: setMinutes(setHours(addDays(monday, 3), 12), 0), // Jeudi 12h00
      end: setMinutes(setHours(addDays(monday, 3), 13), 30), // Jeudi 13h30
      color: "info",
      description: "Révolution française.",
    },
    {
      id: "5",
      name: "Informatique",
      type: "Projet",
      prof: "Mme Leroy",
      room: "Salle info",
      start: setMinutes(setHours(addDays(monday, 4), 16), 0), // Vendredi 16h00
      end: setMinutes(setHours(addDays(monday, 4), 17), 30), // Vendredi 17h30
      color: "success",
      description: "Présentation du projet final.",
    },
    {
      id: "6",
      name: "Mathématiques",
      type: "TD",
      prof: "Mme Dupont",
      room: "A101",
      start: setMinutes(setHours(monday, 10), 15), // Lundi 10h15
      end: setMinutes(setHours(monday, 10), 45), // Lundi 10h45
      color: "warning",
      description: "Exercices sur les intégrales.",
    },
    {
      id: "7",
      name: "Physique",
      type: "Cours magistral",
      prof: "M. Martin",
      room: "Amphi 1",
      start: setMinutes(setHours(addDays(monday, 1), 14), 30), // Mardi 14h30
      end: setMinutes(setHours(addDays(monday, 1), 15), 30), // Mardi 15h30
      color: "error",
      description: "Mécanique quantique.",
    },
  ];
};

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
