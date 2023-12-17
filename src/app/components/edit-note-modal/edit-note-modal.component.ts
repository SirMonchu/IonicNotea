import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Note } from '../../model/note';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-note-modal',
  templateUrl: './edit-note-modal.component.html',
  styleUrls: ['./edit-note-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class EditNoteModalComponent {
  @Input() note: Note = { title: '', description: '', img: '', location: '', date: '' };

  constructor(private modalController: ModalController) {}

  saveChanges() {
    // Envia la nota actualizada de vuelta al componente padre
    this.modalController.dismiss({ saved: true, note: this.note });
  }

  discardChanges() {
    // Cierra el modal sin guardar los cambios
    this.modalController.dismiss();
  }

  removePhoto() {
    // Elimina la foto de la nota
    this.note.img = '';
  }

  removeLocation() {
    // Elimina la ubicación de la nota
    this.note.location = '';
  }

  // Inside EditNoteModalComponent class

isPhotoButtonDisabled(): boolean {
  return !this.note.img;
}

isLocationButtonDisabled(): boolean {
  return !this.note.location;
}

}
