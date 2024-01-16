import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { isSameDay, isSameMonth } from 'date-fns';
import { BehaviorSubject, combineLatest, filter, map, shareReplay, startWith, switchMap, tap } from 'rxjs';
import { match } from 'ts-pattern';
import { Afspraak, AfsprakenService } from '../afspraken.service';
import { LoaderComponent } from '../loader/loader.component';
import { CalendarView, afsprakenVanDeMaand, afsprakenVanDeWeek, eerstVolgendeAfspraak, isPresent, navigationFns } from './../utils';
import { CalendarDayComponent } from './calendar-day/calendar-day.component';

@Component({
    selector: 'app-calendar',
    standalone: true,
    imports: [CalendarDayComponent, ReactiveFormsModule, FormsModule, NgIf, LoaderComponent, DatePipe, AsyncPipe],
    templateUrl: './calendar.component.html',
    styleUrl: './calendar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarComponent {
    private afspraakService = inject(AfsprakenService);

    loading = false;
    view$ = new BehaviorSubject<CalendarView>('maand');
    date$ = new BehaviorSubject<Date>(new Date());
    selectedAfspraak$ = new BehaviorSubject<Afspraak | null | undefined>(null);
    filterFormControl = new FormControl('');

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

    eerstVolgendeAfspraak$ = this.afspraken$
        .pipe(
            filter(() => isSameMonth(this.date$.value, new Date())),
            map(eerstVolgendeAfspraak),
            takeUntilDestroyed()
        )
        .subscribe(this.selectedAfspraak$);

    afspraakDetails$ = this.selectedAfspraak$.pipe(
        filter(isPresent),
        switchMap((afspraak) => this.afspraakService.getDetails(afspraak.id)),
        startWith(null)
    );

    private filteredAfspraken$ = combineLatest([this.afspraken$, this.filterFormControl.valueChanges.pipe(startWith(''))]).pipe(
        map(([afspraken, filter]) => afspraken.filter((afspraak) => afspraak.titel.includes(filter ?? '')))
    );

    private afsprakenPerDag$ = combineLatest([this.filteredAfspraken$, this.dagen$]).pipe(
        map(
            ([afspraken, dagen]) =>
                new Map(dagen.map((dag) => [dag.toString(), afspraken.filter((afspraak) => isSameDay(afspraak.datum, dag))]))
        ),
        startWith(new Map())
    );

    viewmodel$ = combineLatest([
        this.view$,
        this.date$,
        this.dagen$,
        this.afsprakenPerDag$,
        this.selectedAfspraak$,
        this.afspraakDetails$
    ]).pipe(
        map(([view, date, dagen, afsprakenPerDag, selectedAfspraak, afspraakDetails]) => ({
            view,
            date,
            dagen,
            afsprakenPerDag,
            selectedAfspraak,
            afspraakDetails
        }))
    );

    vorige = () => this.date$.next(navigationFns[this.view$.value](this.date$.value, -1));
    volgende = () => this.date$.next(navigationFns[this.view$.value](this.date$.value, 1));
}
