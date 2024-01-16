import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { isSameDay, isSameMonth } from 'date-fns';
import { computedFrom } from 'ngxtension/computed-from';
import { filter, map, pipe, switchMap, tap } from 'rxjs';
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

    loading = signal(false);
    view = signal<CalendarView>('maand');
    date = signal<Date>(new Date());
    selectedAfspraak = signal<Afspraak | null | undefined>(null);
    filterFormControl = new FormControl('');
    filterValue = toSignal(this.filterFormControl.valueChanges);

    dagen = computed(() =>
        match(this.view())
            .with('maand', () => afsprakenVanDeMaand(this.date()))
            .with('week', () => afsprakenVanDeWeek(this.date()))
            .with('dag', () => [this.date()])
            .exhaustive()
    );

    private afspraken = computedFrom(
        [this.date],
        pipe(
            tap(() => this.loading.set(true)),
            switchMap(([date]) => this.afspraakService.afprakenVanDeMaand(date.getMonth(), date.getFullYear())),
            tap(() => this.loading.set(false))
        ),
        { initialValue: new Array<Afspraak>() }
    );

    private eerstVolgendeAfspraak = computed(() => {
        if (!isSameMonth(this.date(), new Date())) {
            return null;
        }
        return eerstVolgendeAfspraak(this.afspraken());
    });

    afspraakDetails = computedFrom(
        [this.selectedAfspraak],
        pipe(
            map(([afspraak]) => afspraak),
            filter(isPresent),
            switchMap((afspraak) => this.afspraakService.getDetails(afspraak.id))
        ),
        { initialValue: null }
    );

    private filteredAfspraken = computed(() => this.afspraken().filter((afspraak) => afspraak.titel.includes(this.filterValue() ?? '')));
    afsprakenPerDag = computed(
        () =>
            new Map(
                this.dagen().map((dag) => [dag.toString(), this.filteredAfspraken().filter((afspraak) => isSameDay(afspraak.datum, dag))])
            )
    );

    vorige = () => this.date.set(navigationFns[this.view()](this.date(), -1));
    volgende = () => this.date.set(navigationFns[this.view()](this.date(), 1));

    constructor() {
        effect(
            () => {
                if (this.eerstVolgendeAfspraak()) {
                    this.selectedAfspraak.set(this.eerstVolgendeAfspraak());
                }
            },
            { allowSignalWrites: true }
        );
    }
}
