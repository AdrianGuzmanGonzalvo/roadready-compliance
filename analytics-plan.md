# Plan de analítica — RoadReady Compliance

Catálogo de eventos de interacción de usuario y cómo se capturan. La fuente de verdad en código es
el tipo `AnalyticsEvents` en [`src/lib/analytics.ts`](src/lib/analytics.ts): si agregas o cambias un
evento, actualiza ambos.

## 1. Stack detectado

| Aspecto | Hallazgo |
| --- | --- |
| Framework | Next.js 16.3 (App Router, carpeta `src/app`), React 19.2 |
| Grupos de rutas | `(marketing)` pública, `login` pública, `(app)` autenticada (protegida por `src/proxy.ts`) |
| Estado | Zustand (`src/store/ui-store.ts`) + TanStack Query (mutaciones con `onSuccess`) |
| Analítica existente | GA4 vía `next/script`, cargado **solo** en `src/app/(marketing)/layout.tsx` (`NEXT_PUBLIC_GA_ID`). Evento de conversión `generate_lead` en el formulario de demo |
| Librerías de product analytics | Ninguna (sin PostHog, Mixpanel, Segment, Amplitude) |

## 2. Arquitectura

```
Componente (onClick / onSubmit / onSuccess de mutación)
        │  trackEvent("evento", { ...props tipadas })
        ▼
src/lib/analytics.ts  ── agrega contexto: surface, path, session_id, user_id, role, tenant
        │
        ├─► console   (solo en desarrollo o con NEXT_PUBLIC_ANALYTICS_DEBUG=true)
        ├─► GA4       (solo eventos de surface "marketing"; excepto page_view, que GA4 ya mide)
        ├─► PostHog   (todas las superficies; registrado en src/instrumentation-client.ts si hay NEXT_PUBLIC_POSTHOG_KEY)
        └─► endpoint  (solo si NEXT_PUBLIC_ANALYTICS_ENDPOINT está definido)
```

- **PostHog** se inicializa en [`src/instrumentation-client.ts`](src/instrumentation-client.ts) antes de la
  hidratación, con **todo lo automático apagado**: autocapture, rage/dead clicks, heatmaps, session replay,
  pageview/pageleave automáticos, web vitals, excepciones y encuestas. Solo recibe los eventos del catálogo.
  [`src/lib/analytics-posthog.ts`](src/lib/analytics-posthog.ts) traduce `page_view` → `$pageview`, agrega
  `surface`, `role` y `tenant` a cada evento, e identifica al usuario por su id interno. Cada evento lleva la
  super-propiedad `app_env` (`development` o `production`) para filtrar las pruebas locales.

- **`page_view` automático**: `<PageViewTracker surface=… />` (Client Component con `usePathname`) está
  montado una vez por grupo de rutas: layout de marketing, página de login y `AppShell`. Se dispara al
  montar y en cada navegación del cliente. Solo registra el pathname, nunca el query string. Deduplica los
  efectos dobles de React Strict Mode.
- **Identidad**: `<AnalyticsIdentity />` en `AppShell` adjunta `user_id` (id interno), `role` y `tenant`
  (código de 4 dígitos) a los eventos de la app. Nunca se envía el username. `resetAnalytics()` en logout.
- **Server Components**: el layout de marketing y la landing siguen siendo Server Components; sus CTAs
  usan `<TrackedLink>` (Client Component) en vez de convertir la página entera a `'use client'`.
- **Mutaciones**: los eventos de negocio se disparan en `onSuccess`, así que solo cuentan acciones que el
  servidor confirmó.

## 3. Reglas de privacidad

La app guarda PII de conductores (nombres, licencias, SSN, teléfonos). Reglas obligatorias:

1. Las propiedades son **enums, conteos y booleanos**. Nunca nombres, licencias, SSN, teléfonos, emails,
   nombres de empresa/roster, nombres de archivo, texto de búsqueda ni contenido de formularios.
2. Las claves de formularios personalizados se derivan de etiquetas que escribe el usuario, así que se
   enmascaran como `"custom"` (`formKeyForAnalytics`). Las claves nativas (`ds703`, `mcsa5876`, …) sí se envían.
3. El filtro de empresa solo registra `"ALL"` o `"specific"`.
4. **GA4 nunca recibe eventos de la app autenticada ni del login**; eso respeta el comentario del layout de
   marketing y la política de privacidad (`/privacy`), que describe GA4 solo para el sitio público.
5. Los eventos de login y de la app van a PostHog (y al endpoint propio si se configura), nunca a GA4.
   `/privacy` tiene una sección "Product usage analytics" que lo explica (sigue siendo un borrador pendiente
   de revisión legal).
6. **No actives en PostHog** Session Replay, Autocapture ni Heatmaps: grabarían el texto y la pantalla con
   datos de conductores. Están apagados en el código y en la configuración del proyecto.

## 4. Convenciones

- Nombres `[objeto]_[acción]` en minúsculas y snake_case, acción en pasado: `driver_created`, `report_exported`.
- Propiedades en snake_case.
- Un evento por intención de usuario; la variante va en una propiedad (`location`, `source`, `format`), no en
  el nombre.

## 5. Preguntas de producto que responde

| Pregunta | Eventos |
| --- | --- |
| ¿Qué CTAs de la landing llevan a pedir una demo? | `page_view`, `cta_clicked`, `demo_request_submitted` |
| ¿Cuántos intentos de login fallan? | `login_submitted` |
| ¿Los tenants nuevos se activan (importan roster, crean empresas, programan reportes, invitan usuarios)? | `driver_import_completed`, `company_created`, `report_schedule_created`, `user_created` |
| ¿Se mantienen al día los expedientes de cumplimiento? | `driver_opened`, `driver_updated.form_dates_changed`, `document_uploaded` |
| ¿Se adopta el Dashboard (New) frente al clásico? ¿Qué vista de scorecard prefieren? | `page_view` (`/dashboard-new` vs `/`), `kpi_card_clicked.dashboard`, `driver_opened.scorecard_view`, `scorecard_view_changed` |
| ¿Desde dónde abren a un conductor? | `driver_opened.source` |
| ¿Qué formatos de exportación se usan y con cuántas filas? | `report_exported` |
| ¿Cuánto se abandonan los flujos modales? | `modal_opened` vs. su evento de éxito |

## 6. Contexto común (en todos los eventos)

| Campo | Descripción |
| --- | --- |
| `context.surface` | `marketing` \| `auth` \| `app` |
| `context.path` | `window.location.pathname` |
| `context.session_id` | UUID por pestaña (`sessionStorage`), se renueva en logout |
| `context.user_id`, `context.role`, `context.tenant` | Solo en `app`, cuando el usuario ya cargó |
| `timestamp` | ISO 8601 del cliente |

## 7. Catálogo de eventos

### Adquisición (marketing)

| Evento | Se dispara cuando | Propiedades | Ubicación |
| --- | --- | --- | --- |
| `page_view` | Carga inicial y cada navegación del cliente | `path` | [(marketing)/layout.tsx:16](src/app/(marketing)/layout.tsx#L16), [login/page.tsx:120](src/app/login/page.tsx#L120), [app-shell.tsx:59](src/components/layout/app-shell.tsx#L59) |
| `cta_clicked` | Click en un CTA público | `cta`: `request_demo` \| `how_it_works` \| `login`; `location`: `header` \| `hero` | [(marketing)/layout.tsx:42-57](src/app/(marketing)/layout.tsx#L42-L57), [19a-compliance/page.tsx:104-119](src/app/(marketing)/19a-compliance/page.tsx#L104-L119) |
| `demo_request_submitted` | Respuesta del envío del formulario de demo | `outcome`: `success` \| `rejected` \| `network_error` | [demo-request-form.tsx:36-47](src/components/marketing/demo-request-form.tsx#L36-L47) |

`generate_lead` (conversión de GA4 / Google Ads) sigue intacto en el mismo archivo.

### Autenticación

| Evento | Se dispara cuando | Propiedades | Ubicación |
| --- | --- | --- | --- |
| `login_submitted` | El servidor responde al login | `success` | [login/page.tsx:46](src/app/login/page.tsx#L46) |
| `user_logged_out` | Click en "Sign out" | `location`: `sidebar` \| `settings` | [sidebar.tsx:28](src/components/layout/sidebar.tsx#L28), [settings/page.tsx:52](src/app/(app)/settings/page.tsx#L52) |

### Navegación y descubrimiento (app)

| Evento | Se dispara cuando | Propiedades | Ubicación |
| --- | --- | --- | --- |
| `modal_opened` | Se abre un diálogo de flujo | `modal`: `upload_excel` \| `add_driver` \| `assign_company_roster` \| `add_company` \| `edit_company` \| `add_user` \| `edit_user` \| `add_custom_form`; `location` | [sidebar.tsx:72](src/components/layout/sidebar.tsx#L72), [topbar.tsx:57](src/components/layout/topbar.tsx#L57), [driver-filters.tsx:70](src/components/drivers/driver-filters.tsx#L70), [drivers/page.tsx:155](src/app/(app)/drivers/page.tsx#L155), [companies/page.tsx:24-30](src/app/(app)/companies/page.tsx#L24-L30), [settings/page.tsx:29-35](src/app/(app)/settings/page.tsx#L29-L35), [form-labels-card.tsx:350](src/components/settings/form-labels-card.tsx#L350) |
| `driver_opened` | Click en un conductor que abre el drawer | `source`: `driver_table` \| `expiration_matrix` \| `scorecard` \| `soon_to_expire_report`; `scorecard_view?` | [driver-table.tsx:85](src/components/drivers/driver-table.tsx#L85), [expiration-matrix.tsx:48](src/components/dashboard/expiration-matrix.tsx#L48), 4 scorecards en `src/components/dashboard-new/`, [soon-to-expire/page.tsx:285](src/app/(app)/reports/soon-to-expire/page.tsx#L285) |
| `kpi_card_clicked` | Click en una tarjeta KPI | `kpi`: `ALL` \| `expired` \| `expiring_30` \| `expiring_60`; `dashboard`: `classic` \| `new`; `active` | [kpi-cards.tsx:70](src/components/dashboard/kpi-cards.tsx#L70), [kpi-cards-new.tsx:84](src/components/dashboard-new/kpi-cards-new.tsx#L84) |
| `scorecard_view_changed` | Cambia la vista de scorecards | `view`: `structured` \| `hierarchy` \| `data-focus` \| `compact` | [dashboard-new/page.tsx:46](src/app/(app)/dashboard-new/page.tsx#L46) |
| `filter_changed` | Cambia un filtro de tipo select/tab/checkbox | `filter`: `driver_status_tab` \| `form` \| `expiration_window` \| `company` \| `report_form` \| `report_driver_status`; `value` (enum); `location` | [driver-filters.tsx:45-115](src/components/drivers/driver-filters.tsx#L45-L115), [company-roster-filter.tsx:33](src/components/layout/company-roster-filter.tsx#L33), [soon-to-expire/page.tsx:158-219](src/app/(app)/reports/soon-to-expire/page.tsx#L158-L219) |
| `filters_reset` | Click en "Reset" del reporte | `location` | [soon-to-expire/page.tsx:46](src/app/(app)/reports/soon-to-expire/page.tsx#L46) |

### Expedientes de conductores

| Evento | Se dispara cuando | Propiedades | Ubicación |
| --- | --- | --- | --- |
| `driver_import_completed` | Termina la importación del Excel | `success`; si es exitosa: `total`, `created`, `updated`, `warning_count` | [upload-dialog.tsx:35-52](src/components/upload/upload-dialog.tsx#L35-L52) |
| `driver_created` | Se crea un conductor | `status`, `has_company`, `has_roster` | [add-driver-dialog.tsx:70](src/components/drivers/add-driver-dialog.tsx#L70) |
| `driver_updated` | Se guardan cambios en el drawer | `status_changed`, `form_dates_changed` (número de fechas modificadas) | [driver-drawer.tsx:144](src/components/drivers/driver-drawer.tsx#L144) |
| `driver_status_changed` | Cambio rápido de estado en la tabla | `from`, `to` | [status-quick-select.tsx:41](src/components/drivers/status-quick-select.tsx#L41) |
| `driver_deleted` | Se elimina un conductor | `location`: `driver_drawer` \| `driver_table` | [driver-drawer.tsx:160](src/components/drivers/driver-drawer.tsx#L160), [driver-table.tsx:41](src/components/drivers/driver-table.tsx#L41) |
| `drivers_bulk_assigned` | Asignación masiva de empresa/roster | `count`, `company_set`, `roster_set` | [assign-company-roster-dialog.tsx:47](src/components/drivers/assign-company-roster-dialog.tsx#L47) |
| `drivers_bulk_deleted` | Borrado masivo | `count` | [drivers/page.tsx:99](src/app/(app)/drivers/page.tsx#L99) |
| `document_uploaded` | Se sube un documento al conductor | `file_type`: `pdf` \| `image` \| `other`; `size_kb`; `has_custom_label` | [driver-drawer.tsx:175](src/components/drivers/driver-drawer.tsx#L175) |
| `document_deleted` | Se borra un documento | — | [driver-drawer.tsx:197](src/components/drivers/driver-drawer.tsx#L197) |
| `package_form_downloaded` | Click en "19A Package Form" | — | [driver-drawer.tsx:230](src/components/drivers/driver-drawer.tsx#L230) |

### Reportes

| Evento | Se dispara cuando | Propiedades | Ubicación |
| --- | --- | --- | --- |
| `report_exported` | Exportación CSV/Excel o impresión | `report`: `drivers_list` \| `soon_to_expire`; `format`: `csv` \| `xlsx` \| `print`; `row_count` | [drivers/page.tsx:137-141](src/app/(app)/drivers/page.tsx#L137-L141), [soon-to-expire/page.tsx:111-133](src/app/(app)/reports/soon-to-expire/page.tsx#L111-L133) |
| `report_schedule_created` | Se crea un envío programado | `frequency`: `DAILY` \| `WEEKLY` \| `MONTHLY`; `recipient_count` | [report-schedule-panel.tsx:47](src/components/reports/report-schedule-panel.tsx#L47) |
| `report_schedule_toggled` | Pausa/reanuda un envío | `enabled` | [report-schedule-panel.tsx:93](src/components/reports/report-schedule-panel.tsx#L93) |
| `report_schedule_deleted` | Se borra un envío | — | [report-schedule-panel.tsx:105](src/components/reports/report-schedule-panel.tsx#L105) |

### Administración

| Evento | Se dispara cuando | Propiedades | Ubicación |
| --- | --- | --- | --- |
| `company_created` | Se crea una empresa | `roster_count` | [company-dialog.tsx:84](src/components/companies/company-dialog.tsx#L84) |
| `company_updated` | Se edita una empresa | — | [company-dialog.tsx:67](src/components/companies/company-dialog.tsx#L67) |
| `company_deleted` | Se borra una empresa | `roster_count` | [companies/page.tsx:45](src/app/(app)/companies/page.tsx#L45) |
| `roster_created` / `roster_deleted` | Alta/baja de roster | — | [roster-manager.tsx:27-39](src/components/companies/roster-manager.tsx#L27-L39) |
| `user_created` | Admin crea usuario | `role` | [user-dialog.tsx:73](src/components/settings/user-dialog.tsx#L73) |
| `user_updated` | Admin edita usuario | `role`, `password_changed` | [user-dialog.tsx:61](src/components/settings/user-dialog.tsx#L61) |
| `user_deleted` | Admin borra usuario | — | [settings/page.tsx:44](src/app/(app)/settings/page.tsx#L44) |
| `form_label_updated` | Se renombra o restablece un formulario nativo | `fields_changed`, `reset` | [form-labels-card.tsx:118-130](src/components/settings/form-labels-card.tsx#L118-L130) |
| `custom_form_created` / `custom_form_updated` / `custom_form_deleted` | CRUD de formularios personalizados | — | [form-labels-card.tsx:205-287](src/components/settings/form-labels-card.tsx#L205-L287) |

## 8. No instrumentado a propósito

| Interacción | Motivo |
| --- | --- |
| Búsqueda (topbar, lista, reporte) | El texto contiene nombres/licencias y se dispara por tecla. Si se necesita, agregar `search_performed { location, result_count }` con debounce, sin el texto |
| Rangos de fecha y "días restantes" del reporte | Se disparan por tecla; requerirían debounce |
| Clicks en el sidebar / navegación móvil | `page_view` ya captura el destino |
| Abrir un documento existente | Poco valor frente a `document_uploaded`; fácil de agregar si hace falta |
| Errores de mutación (salvo import, login y demo) | Solo se miden los éxitos; los fallos generales conviene medirlos con un monitor de errores |

## 9. Configuración

Variables en `.env.local` (documentadas también en `.env.example`):

| Variable | Obligatoria | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_GA_ID` | No (ya existía) | ID de GA4 (`G-XXXXXXX`) para las páginas públicas. Sin él no se carga GA4 |
| `NEXT_PUBLIC_POSTHOG_KEY` | Para PostHog | Clave pública del proyecto (`phc_…`). Sin ella PostHog no se carga. Ya está en `.env.local`; en producción hay que agregarla en Vercel |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | `https://us.i.posthog.com` (valor por defecto; proyecto en US) |
| `NEXT_PUBLIC_ANALYTICS_ENDPOINT` | No | URL del colector propio. Recibe un POST por evento con el `AnalyticsPayload` como JSON en un body `text/plain`. Sin ella, los eventos de login y de la app no salen del navegador |
| `NEXT_PUBLIC_ANALYTICS_DEBUG` | No | `true` imprime cada evento en la consola del navegador también en producción (en `next dev` siempre se imprime) |

Si el colector está en otro dominio, debe aceptar CORS para el origen de la app. Si usas un endpoint del
mismo dominio bajo `/api/`, recuerda que `src/proxy.ts` exige sesión en todo `/api/*`: los eventos de
marketing y login recibirían 401 a menos que agregues la ruta a la excepción del `matcher`.

Las variables `NEXT_PUBLIC_*` se incrustan al compilar: después de cambiarlas en Vercel hay que redeployar.

**Probar en local:** `npm run dev`, abre http://localhost:3000 y haz clic. En PostHog → **Activity** los
eventos aparecen en uno o dos minutos con `app_env = development`. PostHog descarta a propósito los
navegadores automatizados (headless), así que las pruebas automáticas necesitan un user agent normal.

## 10. Agregar un evento nuevo

1. Agrega la entrada al tipo `AnalyticsEvents` en `src/lib/analytics.ts` (propiedades solo enum/número/booleano).
2. Llama `trackEvent("objeto_accion", { ... })` en el handler o en el `onSuccess` de la mutación.
3. Documenta el evento en la sección 7 de este archivo.
4. Verifica con `next dev`: la consola del navegador muestra `[analytics] objeto_accion`.

Para conectar un proveedor (por ejemplo PostHog), escribe un `AnalyticsDestination` con `send`,
`identify` y `reset`, y regístralo con `registerDestination()` desde un Client Component o desde
`src/instrumentation-client.ts`.

## 11. Riesgo existente detectado (no modificado)

Después del login, la app navega con `router.push()` (navegación del cliente). Si el visitante llegó desde
la landing, el script de GA4 sigue cargado en esa pestaña, y la **medición mejorada de GA4 ("page changes
based on browser history events") está activa por defecto**, así que GA4 puede estar registrando page
views de rutas autenticadas (`/drivers`, `/settings`…). Solo envía rutas, no datos, pero contradice la
intención del layout de marketing. Hay dos formas de corregirlo: desactivar esa opción en GA4 (Admin →
Data streams → Enhanced measurement), o usar `window.location.assign(next)` en el login para forzar una
carga completa.
