import { TestBed } from '@angular/core/testing';

import { AfsprakenService } from './afspraken.service';

describe('AfsprakenService', () => {
  let service: AfsprakenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AfsprakenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
