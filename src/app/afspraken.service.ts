import { Injectable } from '@angular/core';
import { faker } from '@faker-js/faker';
import { endOfMonth, endOfWeek, format, setMonth, setYear, startOfMonth, startOfWeek } from 'date-fns';
import { nl } from 'date-fns/locale';
import { orderBy } from 'lodash-es';
import { Observable, delay, of } from 'rxjs';

export interface Afspraak {
    id: string;
    titel: string;
    datum: Date;
}

@Injectable({
    providedIn: 'root'
})
export class AfsprakenService {
    cache = new Map<string, Observable<Afspraak[]>>();

    getDetails = (id: string, delayTime = 500) => of('details van ' + id).pipe(delay(delayTime));

    afprakenVanDeMaand(maand: number, year: number): Observable<Afspraak[]> {
        if (this.cache.has(`${maand}-${year}`)) {
            return this.cache.get(`${maand}-${year}`)!;
        }

        const startMonth = startOfWeek(startOfMonth(setYear(setMonth(new Date(), maand), year)), { weekStartsOn: 1 });
        const endMonth = endOfWeek(endOfMonth(setYear(setMonth(new Date(), maand), year)), { weekStartsOn: 1 });

        const afspraken: Afspraak[] = faker.helpers
            .multiple(() => faker.date.between({ from: startMonth, to: endMonth }), {
                count: faker.number.int({ min: 10, max: 50 })
            })
            .map((datum) => ({
                id: format(datum, 'yyyy-M-d-HH:mm', { locale: nl }),
                titel: faker.lorem.words(2),
                datum
            }));

        const afspraken$ = of(orderBy(afspraken, 'datum'));
        this.cache.set(`${maand}-${year}`, afspraken$);

        return afspraken$.pipe(delay(2000));
    }
}
