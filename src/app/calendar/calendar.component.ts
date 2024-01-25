import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { isSameDay, isSameMonth } from 'date-fns';
import { BehaviorSubject, combineLatest, filter, map, merge, shareReplay, startWith, switchMap, tap } from 'rxjs';
import { match } from 'ts-pattern';
import { AfsprakenService } from '../afspraken.service';
import { LoaderComponent } from '../loader/loader.component';
import { CalendarView, afsprakenVanDeMaand, afsprakenVanDeWeek, eerstVolgendeAfspraak, isPresent, navigationFns } from './../utils';
import { CalendarDayComponent } from './calendar-day/calendar-day.component';

@Component({
    selector: 'app-calendar',
    standalone: true,
    imports: [CalendarDayComponent, ReactiveFormsModule, FormsModule, NgIf, LoaderComponent, DatePipe, AsyncPipe, RouterLink],
    templateUrl: './calendar.component.html',
    styleUrl: './calendar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarComponent {
    private afspraakService = inject(AfsprakenService);
    private activatedRoute = inject(ActivatedRoute);

    loading = false;
    filterFormControl = new FormControl('');

    /**
     *  Source streams
     **/
    view$ = new BehaviorSubject<CalendarView>('maand');
    date$ = new BehaviorSubject<Date>(new Date());
    filter$ = this.filterFormControl.valueChanges.pipe(startWith(''));

    /**
     *  intermediate streams
     **/
    private dagen$ = combineLatest([this.view$, this.date$]).pipe(
        map(([view, date]) =>
            match(view)
                .with('maand', () => afsprakenVanDeMaand(date))
                .with('week', () => afsprakenVanDeWeek(date))
                .with('dag', () => [date])
                .exhaustive()
        ),
        shareReplay({ bufferSize: 1, refCount: true })
    );

    private afspraken$ = this.date$.pipe(
        tap(() => (this.loading = true)),
        switchMap((date) => this.afspraakService.afprakenVanDeMaand(date.getMonth(), date.getFullYear())),
        tap(() => (this.loading = false)),
        shareReplay({ bufferSize: 1, refCount: true })
    );

    private filteredAfspraken$ = combineLatest([this.afspraken$, this.filter$]).pipe(
        map(([afspraken, filter]) => afspraken.filter((afspraak) => afspraak.titel.includes(filter ?? '')))
    );

    private eerstVolgendeAfspraakId$ = this.afspraken$.pipe(
        filter(() => isSameMonth(this.date$.value, new Date())),
        map(eerstVolgendeAfspraak),
        map((afspraak) => afspraak?.id)
    );

    private selectedAfspraakId$ = merge(
        this.eerstVolgendeAfspraakId$,
        this.activatedRoute.queryParams.pipe(map((qparams): string | undefined => qparams['afspraak']))
    );

    /**
     *  template streams
     **/
    dagenMetAfspraken$ = combineLatest([this.filteredAfspraken$, this.dagen$]).pipe(
        map(([afspraken, dagen]) =>
            dagen.map((dag) => ({ dag, afspraken: afspraken.filter((afspraak) => isSameDay(afspraak.datum, dag)) }))
        )
    );

    afspraakDetails$ = this.selectedAfspraakId$.pipe(
        filter(isPresent),
        switchMap((afspraakId) => this.afspraakService.getDetails(afspraakId)),
        startWith(null)
    );

    viewmodel$ = combineLatest([this.view$, this.date$, this.dagenMetAfspraken$, this.afspraakDetails$, this.selectedAfspraakId$]).pipe(
        map(([view, date, dagen, afspraakDetails, selectedAfspraakId]) => ({ view, date, dagen, afspraakDetails, selectedAfspraakId }))
    );

    /**
     *  functions
     **/

    vorige = () => this.date$.next(navigationFns[this.view$.value](this.date$.value, -1));
    volgende = () => this.date$.next(navigationFns[this.view$.value](this.date$.value, 1));
}
