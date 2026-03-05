import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { NotifyService } from '../../core/services/notify';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [NgFor],
  templateUrl: './toasts.html',
  styleUrl: './toasts.scss',
})
export class Toasts {
  constructor(public notify: NotifyService) {}

  dismiss(id: number) {
    this.notify.remove(id);
  }
}
