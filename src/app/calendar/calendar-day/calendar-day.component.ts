import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isSameDay } from 'date-fns';
import { Afspraak } from '../../afspraken.service';

@Component({
    selector: 'app-calendar-day',
    standalone: true,
    imports: [DatePipe, RouterLink],
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
}
