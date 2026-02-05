# Guía PWA - Nubisfera

## 🎉 ¡Tu aplicación ahora es una PWA!

Nubisfera ahora se puede instalar como una aplicación nativa en cualquier dispositivo (móvil, tablet, escritorio).

## ✨ Características PWA implementadas

- ✅ **Instalable**: Los usuarios pueden instalar la app en su dispositivo
- ✅ **Funciona offline**: Cache inteligente de recursos estáticos
- ✅ **Actualizaciones automáticas**: La app se actualiza en segundo plano
- ✅ **Iconos optimizados**: Múltiples tamaños para diferentes dispositivos
- ✅ **Theme color**: Integración con el tema del sistema
- ✅ **Cache de API**: Estrategias de cache para AEMET y Open-Meteo

## 🧪 Cómo probar la PWA localmente

### Opción 1: Servidor HTTP local

```bash
# Instalar http-server globalmente (solo la primera vez)
npm install -g http-server

# Servir la aplicación desde la carpeta dist
cd dist/Nubisfera/browser
http-server -p 8080
```

Luego abre: `http://localhost:8080`

### Opción 2: Usar Angular CLI con producción

```bash
# Compilar en modo producción
npm run build

# Servir con configuración de producción (requiere Angular 17+)
npx angular-http-server --path dist/Nubisfera/browser --port 8080
```

### Opción 3: Python Simple Server

```bash
cd dist/Nubisfera/browser
python -m http.server 8080
```

## 📱 Cómo instalar la app en diferentes dispositivos

### En Android (Chrome/Edge)
1. Abre la app en el navegador
2. Busca el icono de **"Instalar app"** o el mensaje en la parte superior
3. Toca **"Instalar"** o el menú ⋮ → **"Añadir a pantalla de inicio"**
4. La app se instalará como una aplicación nativa

### En iOS (Safari)
1. Abre la app en Safari
2. Toca el botón **"Compartir"** (cuadrado con flecha)
3. Desplázate y selecciona **"Añadir a pantalla de inicio"**
4. Dale un nombre y toca **"Añadir"**

### En Windows (Edge/Chrome)
1. Abre la app en el navegador
2. Busca el icono de **"Instalar"** en la barra de direcciones (al final)
3. Haz clic en **"Instalar"**
4. La app se instalará como aplicación de escritorio

### En Mac (Chrome/Safari)
1. En Chrome: Clic en el icono de **"Instalar"** en la barra de direcciones
2. En Safari: Archivo → **"Añadir a Dock"**

## 🚀 Despliegue en producción

### Netlify (Recomendado - ya configurado)

Tu aplicación ya tiene `netlify.toml` configurado. Solo necesitas:

1. **Hacer push a tu repositorio**:
   ```bash
   git add .
   git commit -m "feat: Implementar PWA"
   git push origin master
   ```

2. **Netlify compilará automáticamente** con:
   - Service Worker habilitado
   - Manifest configurado
   - HTTPS automático (requerido para PWA)

3. **La app será instalable** automáticamente desde `https://tu-sitio.netlify.app`

### Otros servicios de hosting

#### Vercel
```bash
npm install -g vercel
vercel --prod
```

#### Firebase Hosting
```bash
npm install -g firebase-tools
firebase init hosting
firebase deploy
```

#### GitHub Pages
Requiere configuración adicional para SPAs. No recomendado para PWAs.

## 🔧 Configuración actual

### Manifest (`public/manifest.webmanifest`)
- **Nombre**: Nubisfera - Tu Ventana al Tiempo
- **Theme color**: #1e40af (azul)
- **Display mode**: standalone (pantalla completa)
- **Iconos**: 8 tamaños diferentes (72x72 a 512x512)

### Service Worker (`ngsw-config.json`)
- **App Shell**: Precarga archivos críticos (HTML, CSS, JS)
- **Assets**: Carga lazy de imágenes e iconos
- **Cache de API AEMET**: Estrategia "freshness" (1 hora)
- **Cache de Open-Meteo**: Estrategia "performance" (6 horas)

## 🛠️ Actualizar la PWA

Cuando hagas cambios en tu aplicación:

1. **Realiza los cambios** en tu código
2. **Compila con** `npm run build`
3. **Despliega** (push a Git o sube manualmente)
4. **El Service Worker se actualizará automáticamente** en los dispositivos de los usuarios

### Forzar actualización inmediata

Si necesitas que los usuarios actualicen inmediatamente:

```typescript
// En app.component.ts o donde prefieras
import { ApplicationRef } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { interval } from 'rxjs';

constructor(
  private appRef: ApplicationRef,
  private swUpdate: SwUpdate
) {
  // Verificar actualizaciones cada 6 horas
  const everySixHours$ = interval(6 * 60 * 60 * 1000);
  
  everySixHours$.subscribe(() => {
    this.swUpdate.checkForUpdate();
  });
  
  // Notificar cuando haya una actualización disponible
  this.swUpdate.versionUpdates.subscribe(event => {
    if (event.type === 'VERSION_READY') {
      if (confirm('¡Nueva versión disponible! ¿Actualizar ahora?')) {
        window.location.reload();
      }
    }
  });
}
```

## 📊 Verificar la PWA

### Chrome DevTools
1. Abre **DevTools** (F12)
2. Ve a la pestaña **"Application"**
3. En el panel izquierdo:
   - **Manifest**: Verifica que se cargue correctamente
   - **Service Workers**: Debe estar activo
   - **Cache Storage**: Verifica los recursos en cache

### Lighthouse
1. Abre **DevTools** (F12)
2. Ve a la pestaña **"Lighthouse"**
3. Selecciona **"Progressive Web App"**
4. Haz clic en **"Generate report"**
5. Debes obtener una puntuación alta (>90)

### PWA Testing
- Online: https://www.pwabuilder.com/
- Chrome DevTools: Application → Manifest

## ⚠️ Requisitos importantes

1. **HTTPS requerido**: Las PWAs solo funcionan con HTTPS (excepto localhost)
2. **Service Worker**: Solo se activa en modo producción (`npm run build`)
3. **Navegadores compatibles**: Chrome, Edge, Safari (iOS 11.3+), Firefox
4. **Iconos**: Ya están incluidos en múltiples tamaños

## 🐛 Solución de problemas

### La app no se puede instalar
- ✅ Verifica que estés usando HTTPS
- ✅ Compila en modo producción (`npm run build`)
- ✅ Verifica que el manifest esté accesible en `/manifest.webmanifest`
- ✅ Revisa en DevTools → Application → Manifest

### El Service Worker no se registra
- ✅ Debe estar en modo producción
- ✅ Verifica en DevTools → Application → Service Workers
- ✅ Limpia el cache del navegador

### Los cambios no se reflejan
- ✅ Desinstala y reinstala la app
- ✅ Limpia el cache del Service Worker en DevTools
- ✅ Usa modo incógnito para probar

### Error de instalación
- ✅ Verifica que tengas espacio en el dispositivo
- ✅ Cierra otras pestañas del mismo sitio
- ✅ Reinicia el navegador

## 📚 Recursos adicionales

- [Documentación oficial de Angular PWA](https://angular.dev/ecosystem/service-workers)
- [PWA Builder](https://www.pwabuilder.com/)
- [Web.dev - Progressive Web Apps](https://web.dev/progressive-web-apps/)
- [MDN - Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

## 🎯 Próximos pasos recomendados

1. **Personalizar iconos**: Reemplaza los iconos por defecto en `public/icons/`
2. **Push Notifications**: Implementar notificaciones para alertas meteorológicas
3. **Splash Screen**: Personalizar la pantalla de carga
4. **Share Target API**: Permitir compartir ubicaciones desde otras apps
5. **Background Sync**: Sincronizar datos cuando vuelva la conexión

---

¡Tu app Nubisfera ahora está lista para ser instalada en cualquier dispositivo! 🎉
