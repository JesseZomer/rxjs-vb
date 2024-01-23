import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
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
export class CalendarDayComponent implements OnChanges {
    @Input({ required: true }) dag: Date;
    @Input({ required: true }) peildatum: Date;
    @Input({ required: true }) afspraken: Afspraak[];
    @Input({ required: true }) selectedAfspraakId: string | undefined | null;

    dagnummer: number;
    isToday = false;
    isPeildatum = false;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['dag']) {
            this.dagnummer = this.dag.getDate();
            this.isToday = isSameDay(this.dag, new Date());
        }
        this.isPeildatum = isSameDay(this.dag, this.peildatum);
    }
}
