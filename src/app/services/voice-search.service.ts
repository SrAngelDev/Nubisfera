import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/**
 * Voice Search Service
 * Proporciona búsqueda por voz usando Web Speech API
 * Compatible con navegadores modernos
 */

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class VoiceSearchService {
  private recognition: any;
  private isListening = false;
  private resultSubject = new Subject<string>();
  public result$ = this.resultSubject.asObservable();

  constructor() {
    this.initSpeechRecognition();
  }

  /**
   * Inicializar Speech Recognition API
   */
  private initSpeechRecognition(): void {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API no disponible en este navegador');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'es-ES';
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.resultSubject.next(transcript);
      this.isListening = false;
    };

    this.recognition.onerror = (event: any) => {
      console.error('Error en reconocimiento de voz:', event.error);
      this.isListening = false;
      
      // Emitir error específico
      if (event.error === 'no-speech') {
        this.resultSubject.next('');
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  /**
   * Iniciar escucha de voz
   */
  startListening(): void {
    if (!this.recognition) {
      console.error('Speech Recognition no está inicializado');
      return;
    }

    if (this.isListening) {
      console.warn('Ya está escuchando');
      return;
    }

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      console.error('Error iniciando reconocimiento de voz:', error);
    }
  }

  /**
   * Detener escucha
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Verificar si está escuchando
   */
  isActive(): boolean {
    return this.isListening;
  }

  /**
   * Verificar si el navegador soporta Speech Recognition
   */
  isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
}
