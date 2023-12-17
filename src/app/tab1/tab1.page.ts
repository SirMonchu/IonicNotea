import { Component,inject } from '@angular/core';
import {AlertController, IonicModule, LoadingController, ModalController, Platform } from '@ionic/angular'
import { Note } from '../model/note';
import { NoteService } from '../services/note.service';
import { UIService } from '../services/ui.service';
import { Camera, CameraResultType } from '@capacitor/camera';
import { addIcons } from 'ionicons';
import { create, trash } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Observable, Subscription, from, map, mergeMap, tap, toArray } from 'rxjs';
import { IonicSafeString } from '@ionic/core';
import * as L from 'leaflet';
import { ToastController } from '@ionic/angular';
import { EditNoteModalComponent } from '../components/edit-note-modal/edit-note-modal.component';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [IonicModule,CommonModule],
})

export class Tab1Page {
  //public misnotas:Note[]=[];
  public noteS = inject(NoteService);  //noteS.notes$
  public lastNote: Note | undefined = undefined;
  public notesPerPage: number = 7;
  public isInfiniteScrollAvailable: boolean = true;
  public _notes$:BehaviorSubject<Note[]> = new BehaviorSubject<Note[]>([]);
  private suscription!: Subscription;
  public notesList:Note[] = [];
  private uiService = inject(UIService);
  private noteTimeouts: Map<Note, ReturnType<typeof setTimeout>> = new Map<Note, ReturnType<typeof setTimeout>>();

  constructor(public platform:Platform,
    public alertController: AlertController,
    private toastController: ToastController,
    private modalController: ModalController,
    private noteService: NoteService) {
    addIcons({ trash, create})
  }

  handleRefresh(event:any) {
    this.isInfiniteScrollAvailable=true;
    this.lastNote=undefined;
    this.loadNotes(true,event);
  }

  onItemSlide(event: any, note: Note) {
    const swipeDirection = event.detail.side;
  
    if (swipeDirection === 'start') {
      // Lógica para el deslizamiento hacia el inicio (puedes abrir un modal de edición aquí)
      this.openEditNoteModal(note);
    } else if (swipeDirection === 'end') {
      // Lógica para el deslizamiento hacia el final (puedes eliminar la nota aquí)
      this.deleteNote(note);
    }
  }

  async openEditNoteModal(note: Note) {
    const modal = await this.modalController.create({
      component: EditNoteModalComponent,
      componentProps: {
        note: { ...note }, // Pasar una copia de la nota para evitar cambios no deseados en la vista
      },
    });
  
    modal.onDidDismiss().then((result) => {
      if (result?.data && result.data.saved) {
        // Actualizar la nota con los cambios realizados en el modal
        const updatedNote = result.data.note;
        this.updateNoteInList(updatedNote);
      }
    });
  
    await modal.present();
  }
  
  private updateNoteInList(updatedNote: Note) {
    // Actualizar la nota en la lista
    this._notes$.next(this._notes$.getValue().map((note) =>
      note.key === updatedNote.key ? updatedNote : note
    ));
  
    // Actualizar la nota en Firebase
    this.noteService.updateNote(updatedNote);
  }  

  ionViewWillLeave() {
    this._notes$.next([]); // Limpiar la lista de notas al salir de la vista
  }

  ionViewDidEnter(){
    this.platform.ready().then(() => {
      this.handleRefresh(event);
      console.log(this.platform.height());
      this.notesPerPage=Math.round(this.platform.height()/100);
      this.loadNotes(true);
    });
   
  }

  ngOnDestroy() {
    this.suscription.unsubscribe();
  }
  
  loadNotes(fromFirst:boolean, event?:any){
    if(fromFirst==false && this.lastNote==undefined){
      this.isInfiniteScrollAvailable=false;
      event.target.complete();
      return;
    } 
    this.convertPromiseToObservableFromFirebase(this.noteS.readNext(this.lastNote,this.notesPerPage)).subscribe(d=>{
      event?.target.complete();
      if(fromFirst){
        this._notes$.next(d);
      }else{
        this._notes$.next([...this._notes$.getValue(),...d]);
      }
    })
  } 
  
  private convertPromiseToObservableFromFirebase(promise: Promise<any>): Observable<Note[]> {
    return from(promise).pipe(
      tap(d=>{
        if(d.docs && d.docs.length>=this.notesPerPage){
          this.lastNote=d.docs[d.docs.length-1];
        }else{
          this.lastNote=undefined;
        }
      }),
      mergeMap(d =>  d.docs),
      map(d => {
        return {key:(d as any).id,...(d as any).data()};
      }),
      toArray()
    );
  }

  loadMore(event: any) {
    console.log('Load more notes...');
    this.loadNotes(false, event);
  } 

  async editNote(note: Note) {
    const modal = await this.modalController.create({
      component: EditNoteModalComponent,
      componentProps: { note: note },
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.saved) {
        // Guardar los cambios en la nota en Firebase
        this.noteService.updateNote(result.data.note);
      }
    });

    await modal.present();
  }

  async deleteNote(note: Note) {
    const toast = await this.toastController.create({
      message: 'La nota se eliminará en 6 segundos',
      duration: 6000,
      position: 'bottom',
      buttons: [
        {
          text: 'Deshacer',
          role: 'cancel',
          handler: () => {
            // Acción al hacer clic en Deshacer
            this.restoreNote(note);
          },
        },
      ],
      mode: 'ios',
    });
  
    await toast.present();
  
    // Espera 6 segundos antes de eliminar definitivamente la nota
    const timeoutId = setTimeout(() => {
      this.deleteNotePermanently(note);
    }, 6000);
  
    // Almacenar el ID del temporizador para cancelarlo si es necesario
    this.noteTimeouts.set(note, timeoutId);
  
    // Elimina la nota de la lista temporalmente
    this.removeNoteFromList(note);
  }
  
  private removeNoteFromList(note: Note) {
    // Elimina la nota de la lista temporalmente
    this._notes$.next(this._notes$.getValue().filter((n) => n !== note));
  }
  
  private restoreNote(note: Note) {
    // Restaura la nota en la lista (vuelve a mostrarla)
    this._notes$.next([...this._notes$.getValue(), note]);
  }
  
  private deleteNotePermanently(note: Note) {
    if (!this.noteTimeouts.has(note)) {
      // Si no hay un temporizador en marcha, elimina definitivamente la nota
      this.noteS.deleteNote(note);
    }
  }  
  
async showNoteContent(note: Note) {
  const alert = await this.alertController.create({
    header: note.title,
    message: `
      ${note.img ? `<img src="${note.img}" alt="Note Image"/>` : ''}
      <p>${note.description}</p>
      <p>Date: ${note.date}</p>
      ${note.location ? `<div id="map" style="height: 200px;"></div>` : ''}
    `,
    buttons: ['Cerrar'],
    cssClass: 'note-alert',
    mode: 'ios',
  });

  await this.loadLeafletScripts(); // Carga los scripts de Leaflet antes de presentar la alerta

  await alert.present();

  // Si hay ubicación, inicializa el mapa después de presentar la alerta
  if (note.location) {
    const mapElement = document.getElementById('map');
    if (mapElement) {
      this.initializeMap(mapElement, note.location);
    }
  }
}

loadLeafletScripts(): Promise<void> {
  return new Promise<void>((resolve) => {
    const head = document.head || document.getElementsByTagName('head')[0];

    // Cargar hoja de estilos de Leaflet
    const leafletStylesheet = document.createElement('link');
    leafletStylesheet.rel = 'stylesheet';
    leafletStylesheet.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    leafletStylesheet.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    leafletStylesheet.crossOrigin = '';
    head.appendChild(leafletStylesheet);

    // Cargar script de Leaflet
    const leafletScript = document.createElement('script');
    leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    leafletScript.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    leafletScript.crossOrigin = '';
    leafletScript.defer = true; // Asegúrate de que el script se cargue de manera asincrónica
    leafletScript.onload = () => resolve();
    head.appendChild(leafletScript);
  });
}


initializeMap(mapElement: HTMLElement, location: string) {
  // Expresión regular para extraer coordenadas del formato "Lat: xx, Lng: yy"
  const matchResult = location.match(/-?\d+\.\d+/g);

  // Verifica si se encontraron coordenadas
  if (matchResult && matchResult.length >= 2) {
    // Parsea las coordenadas de la ubicación almacenada
    const coordinates = matchResult.map((coord) => parseFloat(coord));

    // Inicializa el mapa de Leaflet
    const map = L.map(mapElement).setView(coordinates as L.LatLngExpression, 15);

    // Añade un marcador en las coordenadas
    L.marker(coordinates as L.LatLngExpression).addTo(map);

    // Añade la capa de mapa base de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);
  } else {
    console.error('Error parsing coordinates from location:', location);
  }
}

}