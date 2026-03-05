import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({ selector: '[onlyLetters]' })
export class OnlyLettersDirective {
  constructor(private el: ElementRef<HTMLInputElement>) {}

  private sanitize(value: string) {
    return (value ?? '').replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, '');
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    const allowed = ['Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight','Home','End'];
    if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return;
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]$/.test(e.key)) e.preventDefault();
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