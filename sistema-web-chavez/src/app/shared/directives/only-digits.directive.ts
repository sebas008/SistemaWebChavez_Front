import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({ selector: '[onlyDigits]' })
export class OnlyDigitsDirective {
  @Input() maxDigits?: number;

  constructor(private el: ElementRef<HTMLInputElement>) {}

  private sanitize(value: string) {
    let v = (value ?? '').replace(/\D+/g, '');
    if (this.maxDigits && this.maxDigits > 0) v = v.slice(0, this.maxDigits);
    return v;
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    const allowed = ['Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight','Home','End'];
    if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  }

  @HostListener('input')
  onInput() {
    const input = this.el.nativeElement;
    const clean = this.sanitize(input.value);
    if (input.value !== clean) input.value = clean;
  }

  @HostListener('paste', ['$event'])
  onPaste(e: ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData?.getData('text') ?? '';
    document.execCommand('insertText', false, this.sanitize(text));
  }
}