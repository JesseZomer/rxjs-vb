import { DatePipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
    addDays,
    addMonths,
    addWeeks,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    isFuture,
    isSameDay,
    isSameMonth,
    startOfMonth,
    startOfWeek
} from 'date-fns';
import { sortBy } from 'lodash';
import { Subscription } from 'rxjs';
import { Afspraak, AfsprakenService } from '../afspraken.service';
import { LoaderComponent } from '../loader/loader.component';
import { CalendarDayComponent } from './calendar-day/calendar-day.component';

type CalendarView = 'maand' | 'week' | 'dag';
export interface Dag {
    datum: Date;
    afspraken: Afspraak[];
}

@Component({
    selector: 'app-calendar',
    standalone: true,
    imports: [CalendarDayComponent, ReactiveFormsModule, FormsModule, NgIf, LoaderComponent, DatePipe],
    templateUrl: './calendar.component.html',
    styleUrl: './calendar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarComponent implements OnInit {
    view: CalendarView = 'maand';
    date = new Date();
    dagen = eachDayOfInterval({ start: startOfMonth(this.date), end: endOfMonth(this.date) });
    afspraken: Afspraak[] = [];
    afsprakenPerDag = new Map<string, Afspraak[]>();
    afsprakenSub: Subscription;
    filter = '';
    filteredAfspraken: Afspraak[] = [];
    loading = false;
    selectedAfspraak: Afspraak | undefined | null;
    selectedAfspraakDetails: string | undefined | null;

    private afspraakService = inject(AfsprakenService);
    private changeDetector = inject(ChangeDetectorRef);

    ngOnInit() {
        this.updateDate(this.date);
    }

    updateView(view: CalendarView) {
        this.view = view;
        switch (view) {
            case 'maand': {
                this.dagen = eachDayOfInterval({
                    start: startOfWeek(startOfMonth(this.date), { weekStartsOn: 1 }),
                    end: endOfWeek(endOfMonth(this.date), { weekStartsOn: 1 })
                });
                return;
            }
            case 'week': {
                this.dagen = eachDayOfInterval({
                    start: startOfWeek(this.date, { weekStartsOn: 1 }),
                    end: endOfWeek(this.date, { weekStartsOn: 1 })
                });
                return;
            }
            case 'dag': {
                this.dagen = [this.date];
            }
        }
    }

    updateDate(date: Date) {
        this.afsprakenPerDag.clear();
        this.date = date;
        this.updateView(this.view);
        this.afsprakenSub?.unsubscribe();
        this.loading = true;
        this.afsprakenSub = this.afspraakService
            .afprakenVanDeMaand(this.date.getMonth(), this.date.getFullYear())
            .subscribe((afspraken) => {
                this.loading = false;
                this.afspraken = afspraken;
                this.filterAfspraken(this.filter);
                if (isSameMonth(this.date, new Date())) {
                    this.selectAfspraak(this.getEerstVolgendeAfspraak(), 5000);
                }
                this.changeDetector.markForCheck();
            });
    }

    filterAfspraken(filter: string) {
        this.filteredAfspraken = this.afspraken.filter((afspraak) => afspraak.titel.includes(filter));
        this.afsprakenPerDag = new Map(
            this.dagen.map((dag) => [dag.toString(), this.filteredAfspraken.filter((afspraak) => isSameDay(afspraak.datum, dag))])
        );
    }

    selectAfspraak(afspraak: Afspraak | null | undefined, delayTime = 50) {
        if (!afspraak) return;
        this.selectedAfspraak = afspraak;
        this.afspraakService.getDetails(afspraak.id, delayTime).subscribe((details) => {
            this.selectedAfspraakDetails = details;
            this.changeDetector.markForCheck();
        });
    }

    clearFilter() {
        this.filter = '';
        this.filterAfspraken(this.filter);
    }

    vorige = () => this.updateDate(navigationFns[this.view](this.date, -1));
    volgende = () => this.updateDate(navigationFns[this.view](this.date, 1));

    private getEerstVolgendeAfspraak = (): Afspraak | null | undefined =>
        sortBy(
            this.afspraken.filter((afspraak) => isFuture(afspraak.datum)),
            ['datum'],
            ['desc']
        )[0];
}

const navigationFns = {
    dag: addDays,
    week: addWeeks,
    maand: addMonths
} satisfies Record<CalendarView, (date: Date, number: number) => Date>;
