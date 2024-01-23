import { DatePipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { eachDayOfInterval, endOfMonth, isFuture, isSameDay, isSameMonth, startOfMonth } from 'date-fns';
import { sortBy } from 'lodash';
import { Subscription } from 'rxjs';
import { Afspraak, AfsprakenService } from '../afspraken.service';
import { LoaderComponent } from '../loader/loader.component';
import { CalendarView, dagenVanDeMaand, dagenVanDeWeek, navigationFns } from '../utils';
import { CalendarDayComponent } from './calendar-day/calendar-day.component';

@Component({
    selector: 'app-calendar',
    standalone: true,
    imports: [CalendarDayComponent, ReactiveFormsModule, FormsModule, NgIf, LoaderComponent, DatePipe, RouterLink],
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
    private activeRoute = inject(ActivatedRoute);

    constructor() {
        this.activeRoute.queryParams.pipe(takeUntilDestroyed()).subscribe((params) => {
            const selectedAfspraakId = params['afspraak'];
            if (selectedAfspraakId && this.afspraken) {
                this.selectAfspraak(selectedAfspraakId);
            }
        });
    }

    ngOnInit() {
        this.updateDate(this.date);
    }

    updateView(view: CalendarView) {
        this.view = view;
        switch (view) {
            case 'maand': {
                this.dagen = dagenVanDeMaand(this.date);
                return;
            }
            case 'week': {
                this.dagen = dagenVanDeWeek(this.date);
                return;
            }
            case 'dag': {
                this.dagen = [this.date];
            }
        }
    }

    updateDate(date: Date) {
        this.date = date;
        this.updateView(this.view);
        this.loading = true;
        this.afsprakenSub?.unsubscribe();
        this.afsprakenSub = this.afspraakService
            .afprakenVanDeMaand(this.date.getMonth(), this.date.getFullYear())
            .subscribe((afspraken) => {
                this.loading = false;
                this.afspraken = afspraken;
                this.filterAfspraken(this.filter);
                if (isSameMonth(this.date, new Date())) {
                    const volgendeAfspraak = this.getEerstVolgendeAfspraak();
                    if (volgendeAfspraak) {
                        this.selectAfspraak(volgendeAfspraak.id, 5000);
                    }
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

    selectAfspraak(afspraakId: string, delayTime = 50) {
        this.selectedAfspraak = this.afspraken.find((afspraak) => afspraak.id === afspraakId);
        this.afspraakService.getDetails(afspraakId, delayTime).subscribe((details) => {
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
