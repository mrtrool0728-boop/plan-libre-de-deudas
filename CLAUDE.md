@AGENTS.md

## Flujo de trabajo con Antigravity

Este proyecto lo trabajan en paralelo **Antigravity** (IA de Google Deepmind) y **Claude Code**.
Ambos leen AGENTS.md antes de tocar cualquier cosa.

### Reglas de coordinación
- Toda modificación se guarda directamente en esta carpeta local.
- Después de guardar, el dueño hace commit y push desde **GitHub Desktop** (o con el script de abajo).
- **Nunca sobrescribas cambios sin leer primero el estado actual del archivo.**
- Si vas a cambiar `js/calculos.js`, documenta en el commit el caso de prueba antes/después.
- Sube `VERSION` en `sw.js` en cada cambio que vaya a producción.

### Script rápido para subir cambios (PowerShell)
```powershell
$git = "C:\Users\mrtro\AppData\Local\GitHubDesktop\app-3.6.10\resources\app\git\cmd\git.exe"
& $git add .
& $git commit -m "descripcion del cambio"
& $git push origin main
```

### URL de producción
https://mrtrool0728-boop.github.io/plan-libre-de-deudas/
