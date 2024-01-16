import { addDays, addMonths, addWeeks, eachDayOfInterval, endOfMonth, endOfWeek, isFuture, startOfMonth, startOfWeek } from 'date-fns';
import { sortBy } from 'lodash';
import { Afspraak } from './afspraken.service';

export const dagenVanDeMaand = (date: Date) =>
    eachDayOfInterval({
        start: startOfWeek(startOfMonth(date), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(date), { weekStartsOn: 1 })
    });

export const dagenVanDeWeek = (date: Date) =>
    eachDayOfInterval({
        start: startOfWeek(date, { weekStartsOn: 1 }),
        end: endOfWeek(date, { weekStartsOn: 1 })
    });

export function isPresent<T>(t: T | null | undefined): t is T {
    return t !== null && t !== undefined;
}

export const eerstVolgendeAfspraak = (afspraken: Afspraak[]): Afspraak | null | undefined =>
    sortBy(
        afspraken.filter((afspraak) => isFuture(afspraak.datum)),
        ['datum'],
        ['desc']
    )[0];

export const navigationFns = {
    dag: addDays,
    week: addWeeks,
    maand: addMonths
} satisfies Record<CalendarView, (date: Date, number: number) => Date>;

export type CalendarView = 'maand' | 'week' | 'dag';
export interface Dag {
    datum: Date;
    afspraken: Afspraak[];
}
