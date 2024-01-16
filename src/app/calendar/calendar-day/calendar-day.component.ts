import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Output, computed, input } from '@angular/core';
import { isSameDay } from 'date-fns';
import { Afspraak } from '../../afspraken.service';

@Component({
    selector: 'app-calendar-day',
    standalone: true,
    imports: [DatePipe],
    templateUrl: './calendar-day.component.html',
    styleUrl: './calendar-day.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarDayComponent {
    dag = input.required<Date>();
    peildatum = input.required<Date>();
    afspraken = input.required<Afspraak[]>();
    selectedAfspraakId = input.required<string | undefined | null>();

    dagnummer = computed(() => this.dag().getDate());
    isToday = computed(() => isSameDay(this.dag(), new Date()));
    isPeildatum = computed(() => isSameDay(this.dag(), this.peildatum()));

    @Output() selectAfspraak = new EventEmitter<Afspraak>();
}
