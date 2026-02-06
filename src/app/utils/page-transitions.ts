/**
 * Animaciones de página usando GSAP
 * Proporciona transiciones suaves entre rutas
 */
import { gsap } from 'gsap';

export class PageTransitions {
  /**
   * Fade in desde abajo
   */
  static fadeInUp(element: HTMLElement, delay: number = 0): gsap.core.Tween {
    return gsap.from(element, {
      y: 50,
      opacity: 0,
      duration: 0.6,
      delay,
      ease: 'power3.out'
    });
  }

  /**
   * Fade in desde la derecha
   */
  static fadeInRight(element: HTMLElement, delay: number = 0): gsap.core.Tween {
    return gsap.from(element, {
      x: 100,
      opacity: 0,
      duration: 0.6,
      delay,
      ease: 'power3.out'
    });
  }

  /**
   * Fade in desde la izquierda
   */
  static fadeInLeft(element: HTMLElement, delay: number = 0): gsap.core.Tween {
    return gsap.from(element, {
      x: -100,
      opacity: 0,
      duration: 0.6,
      delay,
      ease: 'power3.out'
    });
  }

  /**
   * Scale fade in
   */
  static scaleIn(element: HTMLElement, delay: number = 0): gsap.core.Tween {
    return gsap.from(element, {
      scale: 0.9,
      opacity: 0,
      duration: 0.5,
      delay,
      ease: 'back.out(1.7)'
    });
  }

  /**
   * Animación de cascada para elementos hijos
   */
  static staggerFadeIn(
    container: HTMLElement, 
    selector: string, 
    staggerDelay: number = 0.1
  ): gsap.core.Tween {
    const elements = container.querySelectorAll(selector);
    return gsap.from(elements, {
      y: 30,
      opacity: 0,
      duration: 0.5,
      stagger: staggerDelay,
      ease: 'power2.out'
    });
  }

  /**
   * Animación de entrada para cards
   */
  static cardEntrance(
    container: HTMLElement,
    cardSelector: string = '.card, .widget, .panel'
  ): gsap.core.Timeline {
    const timeline = gsap.timeline();
    const cards = container.querySelectorAll(cardSelector);

    timeline.from(cards, {
      y: 50,
      opacity: 0,
      scale: 0.95,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power3.out'
    });

    return timeline;
  }

  /**
   * Animación de hover para botones
   */
  static buttonHover(button: HTMLElement): void {
    button.addEventListener('mouseenter', () => {
      gsap.to(button, {
        scale: 1.05,
        duration: 0.3,
        ease: 'power2.out'
      });
    });

    button.addEventListener('mouseleave', () => {
      gsap.to(button, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
    });

    button.addEventListener('mousedown', () => {
      gsap.to(button, {
        scale: 0.95,
        duration: 0.1,
        ease: 'power2.out'
      });
    });

    button.addEventListener('mouseup', () => {
      gsap.to(button, {
        scale: 1.05,
        duration: 0.1,
        ease: 'power2.out'
      });
    });
  }

  /**
   * Efecto ripple en botones
   */
  static createRipple(event: MouseEvent, button: HTMLElement): void {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      left: ${x}px;
      top: ${y}px;
      transform: scale(0);
      pointer-events: none;
    `;

    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);

    gsap.to(ripple, {
      scale: 2,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      onComplete: () => ripple.remove()
    });
  }

  /**
   * Animación de cambio de número (contador)
   */
  static animateNumber(
    element: HTMLElement,
    from: number,
    to: number,
    duration: number = 1
  ): gsap.core.Tween {
    const obj = { value: from };
    return gsap.to(obj, {
      value: to,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        element.textContent = Math.round(obj.value).toString();
      }
    });
  }

  /**
   * Animación de scroll suave
   */
  static smoothScroll(target: HTMLElement, duration: number = 1): gsap.core.Tween {
    return gsap.to(window, {
      duration,
      scrollTo: { y: target, offsetY: 80 },
      ease: 'power3.inOut'
    });
  }

  /**
   * Parallax simple
   */
  static parallaxScroll(elements: NodeListOf<Element>, speed: number = 0.5): void {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      elements.forEach(element => {
        gsap.to(element, {
          y: scrollY * speed,
          duration: 0.5,
          ease: 'power2.out'
        });
      });
    });
  }

  /**
   * Animación de shake (error)
   */
  static shake(element: HTMLElement): gsap.core.Timeline {
    return gsap.timeline()
      .to(element, { x: -10, duration: 0.1 })
      .to(element, { x: 10, duration: 0.1 })
      .to(element, { x: -10, duration: 0.1 })
      .to(element, { x: 10, duration: 0.1 })
      .to(element, { x: 0, duration: 0.1 });
  }

  /**
   * Pulse (destacar elemento)
   */
  static pulse(element: HTMLElement, scale: number = 1.1): gsap.core.Timeline {
    return gsap.timeline({ repeat: 2 })
      .to(element, { scale, duration: 0.3, ease: 'power2.out' })
      .to(element, { scale: 1, duration: 0.3, ease: 'power2.in' });
  }

  /**
   * Animación de éxito (checkmark)
   */
  static successPulse(element: HTMLElement): gsap.core.Timeline {
    return gsap.timeline()
      .from(element, {
        scale: 0,
        rotation: -180,
        duration: 0.5,
        ease: 'back.out(2)'
      })
      .to(element, {
        scale: 1.2,
        duration: 0.2,
        yoyo: true,
        repeat: 1
      });
  }

  /**
   * Loader spinner
   */
  static spinLoader(element: HTMLElement): gsap.core.Tween {
    return gsap.to(element, {
      rotation: 360,
      duration: 1,
      ease: 'linear',
      repeat: -1
    });
  }

  /**
   * Reveal desde máscara
   */
  static maskReveal(element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down' = 'right'): gsap.core.Timeline {
    const timeline = gsap.timeline();
    const wrapper = document.createElement('div');
    
    wrapper.style.cssText = `
      position: relative;
      overflow: hidden;
      display: inline-block;
    `;
    
    element.parentNode?.insertBefore(wrapper, element);
    wrapper.appendChild(element);

    const mask = document.createElement('div');
    mask.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--primary-blue);
      z-index: 1;
    `;
    wrapper.appendChild(mask);

    const moveMap = {
      left: { x: '-100%' },
      right: { x: '100%' },
      up: { y: '-100%' },
      down: { y: '100%' }
    };

    timeline
      .from(element, { opacity: 0, duration: 0 })
      .to(mask, {
        ...moveMap[direction],
        duration: 0.8,
        ease: 'power3.inOut',
        onComplete: () => mask.remove()
      })
      .from(element, { opacity: 0, duration: 0.3 }, '-=0.4');

    return timeline;
  }
}
