# Daily Summary App - Setup Guide

## Google Calendar API Setup

Para que la app pueda acceder a tu Google Calendar, necesitas añadir los scopes correctos en Google Cloud Console:

### Pasos:

1. **Ve a Google Cloud Console**
   - https://console.cloud.google.com/

2. **Navega a OAuth Consent Screen**
   - APIs & Services → OAuth consent screen

3. **Añade los siguientes scopes:**
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

4. **Guarda los cambios**

5. **Vuelve a hacer login** en la aplicación para obtener los nuevos permisos

## Notion API Setup

La base de datos de Notion debe tener una propiedad llamada **"Status"** de tipo **Status** con al menos un valor "Done".

## Gemini API

Asegúrate de que tu API key de Gemini esté activa en https://aistudio.google.com/

## Troubleshooting

### Error 401 en Calendar API
- Verifica que los scopes estén configurados correctamente
- Cierra sesión y vuelve a iniciar sesión para obtener nuevos permisos

### Error en Notion
- Verifica que el token de integración tenga acceso a la base de datos
- Verifica que la base de datos tenga la propiedad "Status"

### Error en Gemini
- Verifica que la API key sea correcta
- Verifica que no hayas excedido la cuota gratuita
