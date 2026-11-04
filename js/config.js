/* ============================================================
   CONFIGURACIÓN DE LA INVITACIÓN  (lo único que hay que editar)
   ============================================================ */
window.CONFIG = {
  // Ceremonia: sábado 20/03/2027, 4:00 p.m. hora Colombia (UTC-5)
  eventDate: "2027-03-20T16:00:00-05:00",
  eventEnd:  "2027-03-20T23:59:00-05:00",

  // URL de la aplicación web de Google Apps Script (ver README.md, paso 2).
  // Mientras esté vacía, la invitación funciona en MODO PRUEBA: no escribe en el Excel
  // y solo reconoce el código de ejemplo  ?i=demo
  rsvpEndpoint: "",

  // Enlace de la carpeta/álbum compartido donde los invitados suben fotos.
  // Al llenarlo aparece la sección "Comparte tus fotos" (y el QR, ver tools/make_qr.py).
  photosUrl: "",

  // Grupo de WhatsApp: solo se muestra después de que el invitado confirma que asistirá.
  groupUrl: "https://chat.whatsapp.com/JkqEx0Ol08tAOc05WUlJdV?s=cl&p=a&iam=2",

  // Dress code: se abre como enlace externo (no se muestra imagen dentro de la tarjeta)
  dressCodeUrl: "https://pin.it/5KP9RG96m",

  // Solo para modo prueba (rsvpEndpoint vacío)
  demoGuests: {
    demo: { name: "Invitado de prueba", cupos: 3 }
  }
};
