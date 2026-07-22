const CACHE_NAME = "gymstart-v4";

const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  /*
   * No interceptamos solicitudes externas.
   * El logo del gimnasio puede estar alojado en Vercel
   * u otro dominio público.
   */
  if (url.origin !== self.location.origin) {
    return;
  }

  /*
   * Las peticiones del backend siempre deben ir a la red
   * para obtener los datos actualizados.
   */
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  /*
   * Para navegaciones como:
   * /my-routine?gym=gym-shark
   *
   * se intenta cargar primero desde internet. Si no hay
   * conexión, se devuelve la aplicación guardada.
   */
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();

          caches
            .open(CACHE_NAME)
            .then((cache) => {
              cache.put("/", responseClone);
            });

          return response;
        })
        .catch(async () => {
          const cachedPage =
            await caches.match(request);

          if (cachedPage) {
            return cachedPage;
          }

          const appShell =
            await caches.match("/");

          if (appShell) {
            return appShell;
          }

          return new Response(
            "No hay conexión disponible",
            {
              status: 503,
              headers: {
                "Content-Type":
                  "text/plain; charset=utf-8",
              },
            }
          );
        })
    );

    return;
  }

  /*
   * Para archivos estáticos utilizamos red primero
   * y caché como respaldo.
   */
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (
          response.ok &&
          response.type === "basic"
        ) {
          const responseClone =
            response.clone();

          caches
            .open(CACHE_NAME)
            .then((cache) => {
              cache.put(
                request,
                responseClone
              );
            });
        }

        return response;
      })
      .catch(async () => {
        const cachedResponse =
          await caches.match(request);

        if (cachedResponse) {
          return cachedResponse;
        }

        return new Response(
          "Recurso no disponible",
          {
            status: 503,
            headers: {
              "Content-Type":
                "text/plain; charset=utf-8",
            },
          }
        );
      })
  );
});  