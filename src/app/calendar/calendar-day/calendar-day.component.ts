import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
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
export class CalendarDayComponent implements OnChanges {
    @Input({ required: true }) dag: Date;
    @Input({ required: true }) peildatum: Date;
    @Input({ required: true }) afspraken: Afspraak[];
    @Input({ required: true }) selectedAfspraakId: string | undefined | null;

    @Output() selectAfspraak = new EventEmitter<Afspraak>();

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
