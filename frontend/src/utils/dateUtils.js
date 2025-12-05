// src/utils/dateUtils.js
import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const toDate = (date) => {
  if (!date) return null;
  if (date instanceof Date) return date;
  return parseISO(date);
};

export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  const d = toDate(date);
  return d ? format(d, formatStr, { locale: es }) : '-';
};

export const formatDateTime = (date) => {
  const d = toDate(date);
  return d ? format(d, "dd/MM/yyyy 'a las' HH:mm", { locale: es }) : '-';
};

export const formatTime = (date) => {
  const d = toDate(date);
  return d ? format(d, 'HH:mm', { locale: es }) : '-';
};

export const formatRelative = (date) => {
  const d = toDate(date);
  return d ? formatDistanceToNow(d, { addSuffix: true, locale: es }) : '-';
};

export const formatFriendlyDate = (date) => {
  const d = toDate(date);
  if (!d) return '-';
  if (isToday(d)) return `Hoy, ${format(d, 'HH:mm')}`;
  if (isTomorrow(d)) return `Mañana, ${format(d, 'HH:mm')}`;
  return format(d, "EEEE d 'de' MMMM, HH:mm", { locale: es });
};

export const formatForInput = (date) => {
  const d = toDate(date);
  return d ? format(d, "yyyy-MM-dd'T'HH:mm") : '';
};

export const formatForDateInput = (date) => {
  const d = toDate(date);
  return d ? format(d, 'yyyy-MM-dd') : '';
};

export const calculateAge = (birthdate) => {
  const birth = toDate(birthdate);
  if (!birth) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};
