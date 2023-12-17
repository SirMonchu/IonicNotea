import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { NoteService } from '../services/note.service';
import { Note } from '../model/note';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { LoadingController } from '@ionic/angular';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UIService } from '../services/ui.service';
import { Camera, CameraResultType } from '@capacitor/camera';
import { compass, image } from 'ionicons/icons';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage'; // Importa AngularFireStorage
import * as L from 'leaflet';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class Tab2Page implements OnInit {

  public form!: FormGroup;
  private formB = inject(FormBuilder);
  private noteS = inject(NoteService);
  private UIS = inject(UIService);
  private storage = inject(Storage); // Inyecta AngularFireStorage
  public loadingS = inject(LoadingController);
  private myLoading!: HTMLIonLoadingElement;
  public uploadProgress: number = 0;
  public isUploading: boolean = false;
  @ViewChild('map', { static: false }) mapContainer!: ElementRef;
  map!: L.Map;
  mapInitialized = false;
  location: string | undefined;
  imageUrl: string | undefined;

  constructor() {
    this.form = this.formB.group({
      title: ['', [Validators.required, Validators.minLength(4)]],
      description: ['']
    });
    addIcons({ image, compass });
  }

  ngOnInit() {}

  loadMap() {
    this.map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  initializeMap() {
    if (!this.mapInitialized) {
      this.map = L.map(this.mapContainer.nativeElement).setView([0, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);
      this.mapInitialized = true;
    }
  }

  locate() {
    this.initializeMap();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          this.map.setView([lat, lng], 15);
          L.marker([lat, lng]).addTo(this.map)
            .bindPopup('¡Estás aquí!')
            .openPopup();
          this.location = `Lat: ${lat}, Lng: ${lng}`;
        },
        (error) => {
          console.error(`Error getting location: ${error.message}`);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }

  public async takePic() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri
      });
  
      // Verifica que la imagen sea válida
      if (image && image.webPath) {
        await this.uploadImage(image.webPath);
      } else {
        console.error('No se pudo obtener una imagen válida.');
      }
    } catch (error) {
      console.error('Error al tomar la foto', error);
    }
  }
  

  async uploadImage(imagePath: string) {
    this.isUploading = true;
  
    const fileName = new Date().getTime().toString() + '.jpg';
    const storageRef = ref(this.storage, `images/${fileName}`);
    const imageBlob = await this.getBlob(imagePath);
    const uploadTask = uploadBytesResumable(storageRef, imageBlob, { contentType: 'image/jpeg' });
  
    uploadTask.on('state_changed',
      (snapshot) => {
        // Actualizar el progreso de la carga
        this.uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      },
      (error) => {
        console.error('Error al cargar la imagen', error);
        this.isUploading = false;
      },
      async () => {
        // Carga completada con éxito
        this.isUploading = false;

        this.uploadProgress = 100;
  
        try {
          const snapshot = await uploadTask;
          this.imageUrl = await getDownloadURL(snapshot.ref);
        } catch (error) {
          console.error('Error al obtener la URL de descarga', error);
        }
      }
    );
  }  
  
  private async getBlob(imagePath: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
  
      xhr.onload = () => {
        resolve(xhr.response);
      };
  
      xhr.onerror = (error) => {
        reject(error);
      };
  
      xhr.open('GET', imagePath, true);
      xhr.send();
    });
  }
  

  public async saveNote(): Promise<void> {
    if (!this.form.valid || this.isUploading) return;

    let note: Note = {
      title: this.form.get('title')?.value,
      description: this.form.get('description')?.value,
      date: new Date().toLocaleString(),
    };

    if (this.location) {
      note.location = this.location;
    }

    if (this.imageUrl) {
      note.img = this.imageUrl;
    }

    await this.UIS.showLoading();

    try {
      await this.noteS.addNote(note);
      this.form.reset();
      this.location = undefined;
      this.imageUrl = undefined;
      await this.UIS.showToast('Nota introducida correctamente', 'success');
    } catch (error) {
      await this.UIS.showToast('Error al insertar la nota', 'danger');
    } finally {
      await this.UIS.hideLoading();
    }
  }
}
