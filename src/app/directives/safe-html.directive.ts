import { Directive, ElementRef, Input, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Directive({
  selector: '[safeHtml]'
})
export class SafeHtmlDirective {
  @Input()
  set safeHtml(value: SafeHtml) {
    this.elRef.nativeElement.innerHTML = this.sanitizer.sanitize(SecurityContext.HTML, value);
  }

  constructor(private elRef: ElementRef, private sanitizer: DomSanitizer) {}
}
