# Documentación

## Crear chatbot en el marketplace de zoom

Para crear el chatbot en zoom, primero tenemos que tener listo los siguientes endpoints:

- GET /authorize
- POST /deauthorize
- POST /bot

Una vez que tenemos los endpoints, procedemos a crear el chatbot.

1.  Abrimos el marketplace de zoom e iniciamos sesión (https://marketplace.zoom.us/)
2.  Una vez dentro, desplegamos **develop** y seleccionamos **build app**.
3.  Dentro de build app, seleccionamos la card **Chatbot**, le damos un nombre a nuestro chatbot y presionamos en **create**.

Ya tenemos nuestro chatbot creado, ahora vamos a configurarlo..

1.  **App credentials**: Guardamos en nuestro archivo `.env` el `clientId` y `clientSecret` estos son necesarios para que la api funcione correctamente. luego en el campo **Redirect URL for OAuth** añadimos nuestra endpoint (`/authorize`), recuerda que no es el path si no la url completa. Luego, en el campo Whitelist URL añadimos nuestra URL principal.
2.  **Information**: Aqui añadimos como se llamara nuestra app y detalles sobre ella. Importante llenar los campos de **Developer Contact Information**. En la sección **Links**puedes añadir aquellos endpoints de ayuda, como doc, terms, policy, etc. Luego en **Deauthorization Notification** añade el endpoint (`/deauthorize`).
3.  **Feature**: En **Add Features** - **Chat Subscription** añadimos nuestro endpoint (/bot) en los campos **Bot endpoint URL** y guardamos. Una vez que se guarde, nos mostrara el **Bot JID** tanto dev como prod, este token lo guardamos en nuestro archivo `.env`.
4.  **Scopes**: En esta seccion tenemos que añadir un scope para leer usuarios, para eso presionamos el boton **Add Scopes**, buscamos **User** y seleccionamos **View all user information** añadimos y guardamos.
5.  **Local Test**: Dado que por ahora no queremos publicar la aplicación, si no que se gestionara de manera interna en la organización, podemos solo llegar hasta este paso y no hasta **Submit**. Bien, presionamos el botón **Generate** y nos dará un enlace para instalar la aplicación.
