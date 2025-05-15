# Spanish Translations

Based on our analysis of the codebase, we need to add the following translations to the Spanish translation file (`translations/es.json`). These translations cover the login screen and personalization features.

## Login Screen Translations

```json
"login": {
  "title": "AI SPORTS EDGE",
  "subtitle": "IMPULSADO POR IA AVANZADA",
  "signIn": "INICIAR SESIÓN",
  "email": "Correo electrónico",
  "password": "Contraseña",
  "forgotPassword": "¿Olvidó su contraseña?",
  "dontHaveAccount": "¿No tiene una cuenta?",
  "signUp": "Registrarse",
  "features": {
    "aiPicks": "Selecciones de IA",
    "trackBets": "Seguimiento de Apuestas",
    "rewards": "Recompensas",
    "proAnalysis": "Análisis Pro",
    "helpFaq": "Ayuda y FAQ"
  }
}
```

## Personalization Features Translations

```json
"personalization": {
  "title": "Personalización",
  "loading": "Cargando preferencias...",
  "tabs": {
    "general": "General",
    "sportsbooks": "Casas de Apuestas",
    "notifications": "Notificaciones"
  },
  "general": {
    "defaultSport": "Deporte Predeterminado",
    "defaultSportDescription": "Elija su deporte predeterminado para comparación de cuotas"
  },
  "sportsbooks": {
    "defaultSportsbook": "Casa de Apuestas Predeterminada",
    "defaultSportsbookDescription": "Elija su casa de apuestas preferida para apostar",
    "noPreference": "Sin Preferencia"
  },
  "notifications": {
    "title": "Preferencias de Notificación",
    "description": "Personalice qué notificaciones recibe",
    "oddsMovements": "Movimientos de Cuotas",
    "gameStart": "Inicio de Juego",
    "gameEnd": "Fin de Juego",
    "specialOffers": "Ofertas Especiales"
  },
  "alerts": {
    "defaultSportUpdated": "Deporte Predeterminado Actualizado",
    "defaultSportUpdatedMessage": "{sport} es ahora su deporte predeterminado.",
    "defaultSportsbookUpdated": "Casa de Apuestas Predeterminada Actualizada",
    "defaultSportsbookUpdatedMessage": "{sportsbook} es ahora su casa de apuestas predeterminada.",
    "defaultSportsbookCleared": "Preferencia de casa de apuestas predeterminada eliminada.",
    "resetPreferences": "Restablecer Preferencias",
    "resetPreferencesMessage": "¿Está seguro de que desea restablecer todas las preferencias de personalización a los valores predeterminados?",
    "preferencesReset": "Preferencias Restablecidas",
    "preferencesResetMessage": "Todas las preferencias de personalización han sido restablecidas a los valores predeterminados.",
    "cancel": "Cancelar",
    "reset": "Restablecer",
    "ok": "OK"
  },
  "resetButton": "Restablecer Todas las Preferencias"
}
```

## Language Selector Translations

```json
"languageSelector": {
  "switchToEnglish": "Cambiar a inglés",
  "switchToSpanish": "Cambiar a español"
}
```

## Implementation Plan

To implement these translations:

1. Switch to Code mode
2. Update the `translations/es.json` file to include these new translations
3. Modify the components to use the translation keys instead of hardcoded strings:
   - Update `NeonLoginScreen.tsx` to use `t('login.title')` instead of hardcoded "AI SPORTS EDGE"
   - Update `PersonalizationSettings.tsx` to use `t('personalization.title')` instead of hardcoded "Personalization"
   - Update `LanguageSelector.tsx` to use `t('languageSelector.switchToEnglish')` for accessibility labels

4. Test the Spanish version of the app to ensure all translations are displayed correctly